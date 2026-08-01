# Tauri v2 — Menu Bar App Notes

Source: v2.tauri.app docs (researched 2026-08-01). Rust ≥ 1.77.2; Xcode CLT on macOS.

## Tray / menu bar

- `TrayIconBuilder::new().icon(…).title("$12.84")` — `title` renders live TEXT in the macOS
  menu bar (also Linux; NOT Windows — use tooltip/icon there). Update at runtime with
  `tray.set_title(Some(…))`, `tray.set_icon(…)`. Get handle via `app.tray_by_id("main")`.
- Hide Dock icon: `app.set_activation_policy(ActivationPolicy::Accessory)` in setup +
  `"LSUIElement": true` in bundle.macOS.infoPlist. Policy is runtime-toggleable.
- Popover: separate window `decorations:false, transparent:true, alwaysOnTop:true,
  skipTaskbar:true, visible:false`; position with `tauri-plugin-positioner`
  (`features=["tray-icon"]`, forward tray events via `on_tray_event`, then
  `win.move_window(Position::TrayCenter)` before `show()`).
- Auto-hide on blur: `onFocusChanged` → `hide()`. Known flake (#13633): call `set_focus()`
  right after `show()`.

## Background work

- `tauri::async_runtime::spawn` + `tokio::time::interval` for polling loops.
- FS watching: use the `notify` crate directly (v2 has no official fs-watch plugin);
  run watcher on a std thread, forward events, debounce, then `app.emit("event", payload)`.
- Frontend: `listen<T>("event", cb)` from `@tauri-apps/api/event`; commands via
  `invoke<T>("cmd")`; shared state via `app.manage(State)` + `tauri::State<T>`.

## Plugins (all `tauri-plugin-<name> = "2"` / `@tauri-apps/plugin-<name>`)

store (settings JSON, autoSave), notification, autostart (LaunchAgent), single-instance
(register FIRST, Rust-only), positioner, opener. Every plugin needs its permission listed in
`src-tauri/capabilities/default.json` with the window labels — missing permission = silent
IPC denial.

## Build / distribution

- `pnpm tauri dev` / `pnpm tauri build` → `src-tauri/target/release/bundle/{macos,dmg}`.
- Unsigned runs locally; ad-hoc `"signingIdentity": "-"` for testers;
  Developer ID + notarization for real distribution.
- Windows: no tray title text. Linux: tray needs AppIndicator (GNOME extension).
