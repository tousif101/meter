pub mod engine;

use std::sync::mpsc;
use std::sync::RwLock;
use std::time::Duration;

use notify::{RecursiveMode, Watcher};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_positioner::{Position, WindowExt};

use engine::types::UsageSnapshot;

pub struct AppState {
    pub snapshot: RwLock<Option<UsageSnapshot>>,
}

#[tauri::command]
fn get_snapshot(state: tauri::State<AppState>) -> Option<UsageSnapshot> {
    state.snapshot.read().unwrap().clone()
}

#[tauri::command]
fn refresh_now(app: AppHandle) {
    refresh(&app);
}

#[tauri::command]
fn open_main(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.set_focus();
    }
    if let Some(pop) = app.get_webview_window("popover") {
        let _ = pop.hide();
    }
}

fn refresh(app: &AppHandle) {
    let snapshot = engine::scan();
    let today_total = snapshot.today.claude_cost + snapshot.today.codex_cost;
    if let Some(tray) = app.tray_by_id("meter-tray") {
        let _ = tray.set_title(Some(format!("${:.2}", today_total)));
    }
    let _ = app.emit("usage-snapshot", &snapshot);
    *app.state::<AppState>().snapshot.write().unwrap() = Some(snapshot);
}

fn toggle_popover(app: &AppHandle) {
    let Some(win) = app.get_webview_window("popover") else { return };
    if win.is_visible().unwrap_or(false) {
        let _ = win.hide();
    } else {
        let _ = win.as_ref().window().move_window(Position::TrayCenter);
        let _ = win.show();
        let _ = win.set_focus();
    }
}

fn spawn_watcher(app: AppHandle) {
    std::thread::spawn(move || {
        let (tx, rx) = mpsc::channel::<notify::Result<notify::Event>>();
        let mut watcher = match notify::recommended_watcher(tx) {
            Ok(w) => w,
            Err(_) => return,
        };
        for dir in engine::claude::config_dirs() {
            let _ = watcher.watch(&dir.join("projects"), RecursiveMode::Recursive);
        }
        for dir in engine::codex::session_dirs() {
            let _ = watcher.watch(&dir, RecursiveMode::Recursive);
        }
        loop {
            match rx.recv_timeout(Duration::from_secs(60)) {
                Ok(_) => {
                    // Debounce: drain the burst, then rescan once.
                    while rx.recv_timeout(Duration::from_millis(1500)).is_ok() {}
                    refresh(&app);
                }
                Err(mpsc::RecvTimeoutError::Timeout) => refresh(&app),
                Err(mpsc::RecvTimeoutError::Disconnected) => return,
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .manage(AppState {
            snapshot: RwLock::new(None),
        })
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_positioner::init())?;

            let open_item = MenuItem::with_id(app, "open", "Open Meter", true, None::<&str>)?;
            let refresh_item = MenuItem::with_id(app, "refresh", "Refresh", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit Meter", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_item, &refresh_item, &quit_item])?;

            TrayIconBuilder::with_id("meter-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .icon_as_template(true)
                .title("$0.00")
                .tooltip("Meter — Claude Code & Codex usage")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => app.exit(0),
                    "refresh" => refresh(app),
                    "open" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_popover(tray.app_handle());
                    }
                })
                .build(app)?;

            let handle = app.handle().clone();
            std::thread::spawn(move || refresh(&handle));
            spawn_watcher(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_snapshot, refresh_now, open_main])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
