# ccusage Algorithms — Research Notes

Source: https://github.com/ccusage/ccusage (MIT, cloned at `research/ccusage`).
The production CLI is **Rust-first** (`rust/` workspace); the npm package is only a launcher.
Most reusable crates for us: `rust/crates/ccusage-core`, `rust/adapters/claude`, `rust/adapters/codex`.

## 1. Claude Code data discovery

- Config dirs: `CLAUDE_CONFIG_DIR` env (comma-separated, exclusive if set) → else check
  `$XDG_CONFIG_HOME/claude` then `~/.claude`, keeping dirs that contain `projects/`.
- Files: plain recursive walk of `projects/` for any `*.jsonl` at any depth (no glob lib).
- Project name = first path component after `projects/`; session id = jsonl filename
  (with a `subagents/` special case). Display names strip `-Users-<user>-` prefixes.

## 2. Claude Code JSONL entry schema (camelCase)

```jsonc
{
  "timestamp": "2026-01-09T10:00:00.000Z",   // ISO 8601, required
  "sessionId": "…", "requestId": "…", "version": "1.0.0",
  "costUSD": 0.12,                            // optional, pre-computed
  "isApiErrorMessage": false, "isSidechain": false,
  "message": {
    "id": "msg_…", "model": "claude-sonnet-4-5-20250929",
    "usage": {
      "input_tokens": 100, "output_tokens": 50,
      "cache_creation_input_tokens": 25, "cache_read_input_tokens": 10,
      "speed": "standard" | "fast",           // optional
      "cache_creation": { "ephemeral_5m_input_tokens": n, "ephemeral_1h_input_tokens": n }
    }
  }
}
```

- Parse fast path: skip line unless bytes contain `"usage":{` (memchr/memmem SIMD prefilter);
  skip lines where certain fields are `:null`; then `serde_json::from_slice` straight to struct.
- `model == "<synthetic>"` → treat model as None (no pricing, no breakdown row).
- `speed: fast` → model displayed with `-fast` suffix; cost = standard cost × fast_multiplier.
- cache_creation tokens: prefer `ephemeral_5m + ephemeral_1h` breakdown, else flat field.
- Rate-limit marker: entries with `isApiErrorMessage: true` containing
  `"Claude AI usage limit reached|<unix_secs>"` → parse as the block's usage-limit reset time.

## 3. Deduplication

Claude Code writes the same API response to multiple files (parent + sidechain logs).
- Key: FxHash of `(message.id, requestId)`; fallback pass on `message.id` alone for
  sidechain replays (match if either candidate or stored entry is a sidechain).
- Winner rules: non-sidechain beats sidechain; else more total tokens; else has `speed` field.

## 4. Cost calculation

- Pricing: LiteLLM `model_prices_and_context_window.json` (embedded snapshot at build +
  live refresh from GitHub raw), models.dev as fallback. Lookup: exact → alias map → fuzzy
  word-boundary substring match (longest key wins; 8-digit runs = date suffixes are boundaries,
  other numeric suffixes like `-5` are not — so `claude-sonnet-4-20250514` matches
  `claude-sonnet-4` but `claude-sonnet-4-5-…` does not).
- Defaults when cache rates missing: `cache_create = input × 1.25`, `cache_read = input × 0.10`.
- 1h cache writes: `input × 2.0` (CACHE_CREATE_1H_INPUT_MULTIPLIER).
- Cost modes: `display` (use costUSD or 0), `auto` (costUSD else compute), `calculate` (always compute).
- Anthropic long-context: marginal split at 200k (first 200k at base rate, rest at `above` rate).
  OpenAI long-context: whole-request switch when input > 272k.
- No subscription-plan (Pro/Max) logic anywhere — pure token × rate.

Key per-token prices (USD/M tokens: input / output / cache-write / cache-read):
- claude-opus-4: 15 / 75 / 18.75 / 1.5 · opus-4-5: 5 / 25 / 6.25 / 0.5
- claude-sonnet-4(.5): 3 / 15 / 3.75 / 0.3 (above-200k: 6 / 22.5 / 7.5 / 0.6)
- claude-haiku-4-5: 1 / 5 / 1.25 / 0.1
- gpt-5 / 5.1(-codex): 1.25 / 10 / — / 0.125 · gpt-5.2(-codex): 1.75 / 14 / — / 0.175

## 5. 5-hour session blocks (`blocks.rs`)

```
sort entries by timestamp
for each entry:
  since_start = t - block_start; since_last = t - last_entry_t
  if since_start > 5h OR since_last > 5h:
    close block; if since_last > 5h emit gap block
    block_start = floor_to_hour(t)        // UTC hour boundary
  push entry
block.end_time = start + 5h  (fixed width)
is_active = (now - last_entry < 5h) AND (now < end_time)
```

## 6. Burn rate & projection

```
elapsed_min = (last_entry_t - first_entry_t) / 60_000       // within active block
tokens_per_minute = total_tokens / elapsed_min               // includes cache tokens
tokens_per_minute_indicator = (input + output) / elapsed_min // excludes cache
cost_per_hour = block_cost / elapsed_min * 60

remaining_min = round((end_time - now) / 60_000)
projected_tokens = current_total + tokens_per_minute * remaining_min
projected_cost   = current_cost + cost_per_hour/60 * remaining_min
```
- Token limit: `--token-limit max` = highest total of any COMPLETED block (self-calibrating).
- Status: exceeds if projected > limit; warning if > 80% of limit.
- Indicator thresholds: <2000/min normal, <5000 moderate, ≥5000 high.

## 7. Live updates

ccusage has NO file watcher; statusline mode uses an mtime-checked JSON cache in
`$TMPDIR/ccusage-semaphore/<session>.lock`, recomputed when transcript mtime changes or a
refresh interval passes. Full re-scan every recompute (fast because of the byte prefilter +
per-file-size-balanced thread pool). **For Meter we improve on this with a real FS watcher.**

## 8. Codex adapter

- Dirs: `CODEX_HOME` (comma list) else `~/.codex`; probe `sessions/`, `archived_sessions/`,
  then the home itself. `sessions/` beats `archived_sessions/` on same relative path.
- Events (session format): `turn_context` (sets model), `event_msg`/`token_count` carrying
  `info.last_token_usage` (per-turn delta) and `info.total_token_usage` (cumulative),
  `event_msg`/`thread_settings_applied` (`service_tier`: default/standard→std, fast/priority→fast),
  `session_meta` (fork/subagent parentage on line 1).
- Field aliases: input_tokens|prompt_tokens|input; cached_input_tokens|cache_read_input_tokens|
  cached_tokens; output_tokens|completion_tokens|output; reasoning_output_tokens|reasoning_tokens.
- Delta derivation: skip if cumulative total unchanged; prefer `last_token_usage` when total
  advanced; else subtract previous cumulative from current. Clamp cached ≤ input.
- Fork replay: parent history is replayed at the head of child files — suppressed by prefix
  matching against the parent's events, falling back to "burst" detection (events written
  within 1000ms at file head).
- Reasoning tokens are ALREADY included in output_tokens (display-only, never billed extra).
- Cost: `(input − cached)·in_rate + cached·cache_read_rate + output·out_rate`, with per-request
  long-context bucket split at 272k.
- Codex logs expose no rate-limit windows; cache_creation is always 0.
