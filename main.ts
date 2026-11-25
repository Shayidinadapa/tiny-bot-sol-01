// Tiny mean-reversion bot for "Tiny Bot, Easy $2: Beat Buy-and-Hold on Solana"
// (make.fun, harness agent-fun/bars-replay/v1, hourly bars).
//
// Strategy, per symbol, from first principles:
//  - Track hourly closes and a slow EMA (24 bars) as the symbol's moving mean.
//  - Buy the dip: when the close sits 3% or more below its slow EMA, the
//    symbol is oversold against its own recent mean, so open a position
//    worth 15% of equity (capped by the harness weight room of 25% and by
//    cash on hand). No longs are chased after a run-up: momentum entries
//    only buy tops in this market.
//  - Sell when the price reverts to its slow EMA, when the position gains
//    1.5% (bank the bounce), or when it loses 2% (cut the falling knife).
//    Selling first never funds a buy in the same reply, so buys only spend
//    cash held at the start of the bar.
//  - Skip a buy when the modelled price impact at the pool depth is over
//    50 bps, and trade nothing during warm-up bars.
//  - Fully deterministic: no clock, no environment, no randomness. Every
//    decision is a pure function of the bars seen so far.

import { runBars } from './vendor/makefun-bars.ts';
import type { BarsState, Batch, OrderInput } from './vendor/makefun-bars.ts';

const SLOW_PERIOD = 24;
const DIP_FRACTION = 0.02; // buy when close is 2% below the slow EMA
const TAKE_PROFIT_BPS = 1015; // bank the bounce at +1.5% of cost
const STOP_LOSS_BPS = 97; // cut the knife at -3% of cost: dips often dip a little more before reverting
const TARGET_WEIGHT_BPS = 1500; // 15% of equity per new position
const MAX_IMPACT_BPS = 50;
const MAX_SLIPPAGE_BPS = 100;

interface Trend {
  closes: number[];
  slowEma: number;
}

const trends = new Map<string, Trend>();

function emaAlpha(period: number): number {
  return 2 / (period + 1);
}

function observe(symbol: string, close: number): Trend {
  let trend = trends.get(symbol);
  if (trend === undefined) {
    trend = { closes: [], slowEma: close };
    trends.set(symbol, trend);
  }
  trend.closes.push(close);
  if (trend.closes.length > SLOW_PERIOD + 2) {
    trend.closes.shift();
  }
  trend.slowEma = emaAlpha(SLOW_PERIOD) * close + (1 - emaAlpha(SLOW_PERIOD)) * trend.slowEma;
  return trend;
}

await runBars({
  onBatch(state: BarsState, batch: Batch): OrderInput[] {
    if (state.warmingUp) return [];
    const orders: OrderInput[] = [];
    let plannedCash = state.cash;

    for (const bar of batch.bars) {
      const symbol = bar.symbol;
      const meta = state.symbols.get(symbol);
      if (meta === undefined) continue;
      const closeRaw = BigInt(bar.c);
      const close = Number(closeRaw) / 10 ** meta.price_scale;
      if (!Number.isFinite(close) || close <= 0) continue;

      const trend = observe(symbol, close);
      if (trend.closes.length < SLOW_PERIOD) continue;

      const held = state.positions.get(symbol);
      const heldQty = held?.qty ?? 0n;

      if (heldQty > 0n) {
        // Exit: reverted to the mean, bounced enough, or still falling.
        const value = state.value(symbol, heldQty);
        const cost = held?.cost ?? 0n;
        const reverted = close >= trend.slowEma;
        const takeProfit = cost > 0n && value > (cost * BigInt(TAKE_PROFIT_BPS)) / 1000n;
        const stopHit = cost > 0n && value < (cost * BigInt(STOP_LOSS_BPS)) / 100n;
        if (reverted || takeProfit || stopHit) {
          orders.push({ side: 'sell', symbol, qty: heldQty, max_slippage_bps: MAX_SLIPPAGE_BPS });
        }
        continue;
      }

      // Entry: buy the dip, 3% or more under the slow EMA.
      if (close < trend.slowEma * (1 - DIP_FRACTION)) {
        const target = (state.equity * BigInt(TARGET_WEIGHT_BPS)) / 10000n;
        const room = state.weightRoom(symbol);
        let notional = target < room ? target : room;
        if (notional > plannedCash) notional = plannedCash;
        if (notional < 1_000_000n) continue; // below the harness min notional
        const impact = state.impactBps(symbol, notional);
        if (impact !== null && impact > BigInt(MAX_IMPACT_BPS)) continue;
        plannedCash -= notional;
        orders.push({ side: 'buy', symbol, notional_quote_units: notional, max_slippage_bps: MAX_SLIPPAGE_BPS });
      }
    }

    return orders;
  },
});
