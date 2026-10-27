pub mod analysis;
pub mod commands;
pub mod config;
pub mod db;
pub mod lcu;
pub mod service;
pub mod window;

use commands::AppState;
use service::manager::ServiceManager;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = db::DbStore::init();

    tauri::Builder::default()
        // .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        //     if let Some(win) = app.get_webview_window("main") {
        //         let _ = win.show();
        //         let _ = win.unminimize();
        //         let _ = win.set_focus();
        //     }
        // }))
        .plugin(tauri_plugin_log::Builder::default().build())
        .setup(|app| {
            let manager = Arc::new(ServiceManager::new(app.handle().clone()));
            manager.start();

            app.manage(AppState { manager });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::save_config,
            commands::get_status,
            commands::get_logs,
            commands::clear_logs,
            commands::start_matchmaking,
            commands::stop_matchmaking,
            commands::accept_match,
            commands::get_match_analysis,
            commands::get_horse_report,
            commands::get_video_platforms,
            commands::get_video_history,
            commands::open_web_video_window,
            commands::close_web_video_window,
            commands::open_overlay_window,
            commands::close_overlay_window,
            commands::minimize_window,
            commands::toggle_maximize_window,
            commands::is_window_maximized,
            commands::close_app,
            commands::set_always_on_top,
            commands::set_mini_mode,
            commands::open_browser,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
