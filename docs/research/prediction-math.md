# Time-to-Limit Prediction Math — Research Notes

Source: Claude-Code-Usage-Monitor (cloned at `research/Claude-Code-Usage-Monitor`).
This is the math behind Meter's headline feature: "at this pace you hit your limit in ~12 min".

## Burn rate (two bases — keep them consistent!)

- Block burn rate: `total_tokens / block_elapsed_minutes` (all 4 token types), guards:
  active block only, elapsed ≥ 1 min, tokens > 0.
- Display burn rate: rolling 60-min window across blocks, pro-rata attribution
  (`block_tokens × overlap_min / block_duration_min`), **input+output only**.
- Pitfall found in their code: forecast numerator uses input+output while one burn-rate field
  includes cache. Meter rule: **limits are expressed in input+output tokens; use the same
  basis for numerator and denominator.**

## Plan limits (tokens per 5-hour block)

| Plan | tokens | cost | messages |
|---|---|---|---|
| Pro | 19,000 | $18 | 250 |
| Max5 | 88,000 | $35 | 1,000 |
| Max20 | 220,000 | $140 | 2,000 |
| Custom | P90 auto | P90 | P90 |

COMMON_TOKEN_LIMITS = [19k, 88k, 220k, 880k]; LIMIT_DETECTION_THRESHOLD = 0.95.

## P90 auto-detection (custom plan)

1. Collect completed non-gap blocks whose totalTokens ≥ 0.95 × any common limit ("limit hits").
2. If none, use all completed non-gap blocks with tokens > 0.
3. limit = max(P90 of that distribution, 19_000). Cache result for 1 hour.

## Time-to-limit forecast

```
used = active_block.input + output tokens
remaining = max(0, limit - used)
burn = used / elapsed_minutes            # elapsed since block start, min 1
minutes_remaining = remaining / burn
exhausted_at = now + minutes_remaining
```
Alert when `exhausted_at < block_reset_time` (i.e., you'll hit the wall before the window
resets). Reset time = `usageLimitResetTime` from a rate-limit log entry if present, else
`block_start(floor hour) + 5h`.

## Pace indicator

```
elapsed_pct = (now - window_start) / 5h × 100
delta = used_pct - elapsed_pct
delta > +10 → "slow down" · delta < -10 → "speed up" · else "on track"
```

## Status codes

- ≥100% or limit message seen → limit_hit
- ≥95% → near_limit
- else ok

## Meter alert design (3-stage, from product spec)

1. Ambient: tray icon/dot color by status.
2. 70% / 90% thresholds → native notification, framed in time ("~25 min left at this pace").
3. Imminent (ETA < reset AND ETA < ~10 min) → final warning.
4. "Quota's back" notification only if the user was actually blocked.
