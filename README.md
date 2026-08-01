# Meter — Claude Code & Codex usage monitor

A local-first macOS menu bar + desktop app (Tauri v2) that tracks Claude Code and
Codex CLI usage in real time and predicts time-to-limit.

```
docs/            Architecture plan + research notes (ccusage & usage-monitor dissection)
meter/           The Tauri app (React + TS frontend, Rust engine)
research/        Cloned reference repos (ccusage, Claude-Code-Usage-Monitor) — not ours
```

## Install (Homebrew)

```sh
brew tap tousif101/tap
brew install --cask meter
```

Until builds are notarized, macOS will warn on first launch — right-click
Meter.app → Open once, or `xattr -d com.apple.quarantine /Applications/Meter.app`.

## Run it from source

```sh
cd meter
pnpm install
pnpm tauri dev          # dev mode (main window + menu bar item)
pnpm tauri build --bundles app   # release .app in src-tauri/target/release/bundle/macos
```

Requires Rust (rustup) and pnpm. No account, no network calls except nothing —
all data is parsed locally from `~/.claude/projects` and `~/.codex/sessions`.

## What works today (MVP)

- Rust engine: Claude Code JSONL parsing (memchr prefilter, messageId+requestId dedup,
  costUSD passthrough + pricing table), Codex session parsing (cumulative→delta tokens,
  fork-replay suppression), 5-hour billing blocks, burn rate, projection, time-to-limit.
- Live updates: `notify` file watcher on both log dirs (debounced) + 60s fallback.
- Menu bar: today's spend as tray title, glance popover (spend, provider split,
  sparkline, block usage bar, time-to-limit line).
- Main window: Overview / Sessions / Projects / Models / Cost & budgets / Settings
  screens per the Meter design spec (dark, mono numerals).
- Verified against real logs: full rescan of ~500MB of JSONL in ~0.5s.

## Next (see docs/ARCHITECTURE.md)

Budgets + 3-stage alerts (native notifications), P90 self-calibrating limits,
settings persistence (store plugin), autostart, light appearance, Cursor/Gemini/
OpenRouter sources, Wrapped reports, model-routing recommendations (paid unlock).
