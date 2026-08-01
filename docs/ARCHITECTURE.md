# Meter — Architecture

A local-first Tauri v2 desktop app + menu bar utility that tracks Claude Code and Codex
usage in real time and predicts time-to-limit. See `docs/research/` for the dissection of
ccusage and Claude-Code-Usage-Monitor that these algorithms are based on, and the design
spec (color/type/layout) in the project brief.

## Layout

```
meter/
  src/                  React + TS frontend (Vite)
    screens/            Overview · Sessions · Projects · Models · Budgets · Settings
    popover/            Menu-bar glance card
    theme.ts            Design tokens from the Meter spec
  src-tauri/
    src/
      lib.rs            Tauri setup: tray, windows, watcher, background refresh
      state.rs          Shared AppState (snapshot cache behind RwLock)
      commands.rs       invoke() endpoints for the frontend
      engine/
        mod.rs          Orchestrates a full scan → UsageSnapshot
        claude.rs       ~/.claude/projects JSONL parser (prefilter, dedup)
        codex.rs        ~/.codex/sessions parser (cumulative→delta, replay skip)
        pricing.rs      Embedded pricing table + LiteLLM live refresh
        blocks.rs       5h billing blocks, burn rate, projection, time-to-limit
        types.rs        UsageEntry, TokenCounts, SessionBlock, UsageSnapshot
```

## Data flow

1. `notify` watcher on `~/.claude/projects` + `~/.codex/sessions` (debounced ~1.5s)
   plus a 60s fallback interval timer.
2. On trigger, the engine rescans (ccusage-style: whole-file read, memchr `"usage":{`
   prefilter, serde from_slice, `(messageId, requestId)` dedup) and produces a
   `UsageSnapshot`: today totals, 7-day series, sessions, projects, model mix,
   active 5h block, burn rate, ETA-to-limit.
3. Snapshot stored in `AppState`, emitted to all windows as `usage-snapshot`,
   tray title updated to today's spend (`$12.84`).
4. Frontend renders from the pushed snapshot; commands exist for on-demand pulls.

## Core algorithms (mirrored from research)

- **Blocks**: sort by timestamp; new block when gap or span > 5h; start = floor-to-UTC-hour;
  active = last entry < 5h ago && now < start+5h.
- **Burn rate**: total tokens / elapsed minutes within active block; indicator rate uses
  input+output only.
- **Time-to-limit**: `(limit − used_io) / (used_io / elapsed_min)`; limit = user-set or
  self-calibrated (max of completed blocks, later P90). Alert when ETA < block reset.
- **Cost**: per-token pricing table (embedded; LiteLLM refresh later), costUSD passthrough
  when present (`auto` mode), cache write ×1.25 / read ×0.10 defaults, 200k marginal tiers.
- **Codex deltas**: prefer `last_token_usage` when cumulative advanced, else subtract
  cumulative totals; skip forked-session replays (session_meta parentage + head-burst).

## Milestones

1. **MVP (now)**: engine (claude + codex) · tray with today spend + popover glance ·
   Overview + Sessions screens · live watcher.
2. Budgets/alerts (3-stage notifications, quota-back), Projects/Models screens, store-backed
   settings, autostart.
3. Cross-tool (Cursor, Gemini CLI, OpenRouter billing), Wrapped reports, routing
   recommendations (paid unlock), Windows/Linux polish.
