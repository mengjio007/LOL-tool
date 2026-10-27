use crate::analysis::analyzer::generate_horse_report;
use crate::analysis::model::MatchAnalysisResult;
use crate::config::{get_config as read_cfg, save_config as write_cfg, Config};
use crate::db::{get_global_store, VideoHistory, VideoPlatform};
use crate::service::manager::{LogEntry, ServiceManager, ServiceStatus};
use crate::window::{close_overlay_window as close_overlay, close_video_window as close_video, open_overlay_window as open_overlay, open_video_window as open_video};
use std::sync::Arc;
use tauri::{AppHandle, Manager, State};

pub struct AppState {
    pub manager: Arc<ServiceManager>,
}

#[tauri::command]
pub fn get_config() -> Config {
    read_cfg()
}

#[tauri::command]
pub fn save_config(cfg: Config) -> Result<(), String> {
    write_cfg(cfg)
}

#[tauri::command]
pub async fn get_status(state: State<'_, AppState>) -> Result<ServiceStatus, ()> {
    Ok(state.manager.get_status().await)
}

#[tauri::command]
pub async fn get_logs(state: State<'_, AppState>) -> Result<Vec<LogEntry>, ()> {
    Ok(state.manager.get_logs().await)
}

#[tauri::command]
pub async fn clear_logs(state: State<'_, AppState>) -> Result<(), ()> {
    state.manager.clear_logs().await;
    Ok(())
}

#[tauri::command]
pub async fn start_matchmaking(state: State<'_, AppState>) -> Result<(), String> {
    state.manager.start_matchmaking().await
}

#[tauri::command]
pub async fn stop_matchmaking(state: State<'_, AppState>) -> Result<(), String> {
    state.manager.stop_matchmaking().await
}

#[tauri::command]
pub async fn accept_match(state: State<'_, AppState>) -> Result<(), String> {
    state.manager.accept_match().await
}

#[tauri::command]
pub async fn get_match_analysis(state: State<'_, AppState>) -> Result<MatchAnalysisResult, ()> {
    Ok(state.manager.get_analysis().await)
}

#[tauri::command]
pub async fn get_horse_report(state: State<'_, AppState>) -> Result<String, ()> {
    let analysis = state.manager.get_analysis().await;
    Ok(generate_horse_report(&analysis))
}

#[tauri::command]
pub fn get_video_platforms() -> Result<Vec<VideoPlatform>, String> {
    if let Some(store) = get_global_store() {
        store.get_platforms()
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub fn get_video_history(limit: Option<i32>) -> Result<Vec<VideoHistory>, String> {
    if let Some(store) = get_global_store() {
        store.get_history(limit.unwrap_or(20))
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub fn open_web_video_window(app: AppHandle, platform_key: Option<String>) -> Result<(), String> {
    let url = if let Some(store) = get_global_store() {
        if let Some(key) = platform_key {
            if let Ok(platforms) = store.get_platforms() {
                platforms.into_iter().find(|p| p.key == key).map(|p| p.url)
            } else {
                None
            }
        } else {
            store.get_active_platform().ok().map(|p| p.url)
        }.unwrap_or_else(|| "https://www.douyin.com/?recommend=1".to_string())
    } else {
        "https://www.douyin.com/?recommend=1".to_string()
    };

    open_video(&app, &url, 1080.0, 820.0)
}

#[tauri::command]
pub fn close_web_video_window(app: AppHandle) -> Result<(), String> {
    close_video(&app)
}

#[tauri::command]
pub fn open_overlay_window(app: AppHandle) -> Result<(), String> {
    open_overlay(&app)
}

#[tauri::command]
pub fn close_overlay_window(app: AppHandle) -> Result<(), String> {
    close_overlay(&app)
}

// --- 窗口操作命令 ---

#[tauri::command]
pub fn minimize_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn toggle_maximize_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        if win.is_maximized().unwrap_or(false) {
            win.unmaximize().map_err(|e| e.to_string())?;
        } else {
            win.maximize().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn is_window_maximized(app: AppHandle) -> bool {
    if let Some(win) = app.get_webview_window("main") {
        win.is_maximized().unwrap_or(false)
    } else {
        false
    }
}

#[tauri::command]
pub fn close_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
pub fn set_always_on_top(app: AppHandle, on_top: bool) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        win.set_always_on_top(on_top).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn set_mini_mode(app: AppHandle, enable: bool) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        if enable {
            let _ = win.set_size(tauri::LogicalSize::new(420.0, 56.0));
            let _ = win.set_always_on_top(true);
        } else {
            let _ = win.set_size(tauri::LogicalSize::new(880.0, 700.0));
            let _ = win.set_always_on_top(false);
        }
    }
    Ok(())
}

#[tauri::command]
pub fn open_browser(url: String) -> Result<(), String> {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let _ = std::process::Command::new("cmd")
            .args(["/c", "start", "", &url])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn();
    }
    Ok(())
}
