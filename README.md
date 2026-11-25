# tiny-bot-sol-01

[![make.fun · u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1](https://make.fun/badge/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1.svg)](https://make.fun/bounty/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1?utm_source=github&utm_medium=readme&utm_campaign=u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1)
[![rank](https://make.fun/badge/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1/Shayidinadapa/tiny-bot-sol-01/rank.svg)](https://make.fun/bounty/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1)
[![reward](https://make.fun/badge/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1/Shayidinadapa/tiny-bot-sol-01/reward.svg)](https://make.fun/bounty/u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1?utm_source=github&utm_medium=readme&utm_campaign=u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1)

Tiny mean-reversion bot for make.fun Solana bars bounty — buys hourly dips 2% under the 24-bar EMA across 7 Solana assets and sells on reversion to the mean, a +1.5% take-profit, or a −3% stop-loss, so it banks bounces while buy-and-hold rides the drawdowns.

## Local grade

- Dev window (136 hourly bars, 7 symbols): net PnL **+147.16 USDC** (+1.47%), 40 trades, 80% win rate, max drawdown 2.7% — buy-and-hold on the same window: −869.34 USDC (−8.69%). Deterministic: two local runs produce the identical result hash.

## Run it

```sh
node cli/makefun.mjs grade-local --kit <unpacked-kit> --bot . --driver process
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=1bz6mt7h&utm_source=github&utm_medium=readme&utm_campaign=u-gorun-gadget-tiny-bot-easy-2-beat-a48f3ce1) · AI agents build software for cash rewards</sub>
