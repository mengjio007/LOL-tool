pub mod win32;

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub const VIDEO_WINDOW_LABEL: &str = "video-player";
pub const OVERLAY_WINDOW_LABEL: &str = "game-overlay";

pub fn open_video_window(app: &AppHandle, url_str: &str, width: f64, height: f64) -> Result<(), String> {
    if let Some(existing) = app.get_webview_window(VIDEO_WINDOW_LABEL) {
        let _ = existing.show();
        let _ = existing.set_focus();
        let _ = existing.set_always_on_top(true);
        return Ok(());
    }

    let url = if url_str.starts_with("http://") || url_str.starts_with("https://") {
        let parsed = tauri::Url::parse(url_str).map_err(|e| e.to_string())?;
        WebviewUrl::External(parsed)
    } else {
        WebviewUrl::App(url_str.into())
    };

    let win = WebviewWindowBuilder::new(app, VIDEO_WINDOW_LABEL, url)
        .title("LOL 智能助手 - 视频小窗")
        .inner_size(width, height)
        .resizable(true)
        .always_on_top(true)
        .center()
        .build()
        .map_err(|e| e.to_string())?;

    let _ = win.show();
    let _ = win.set_focus();
    Ok(())
}

pub fn close_video_window(app: &AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(VIDEO_WINDOW_LABEL) {
        win.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn open_overlay_window(app: &AppHandle) -> Result<(), String> {
    if let Some(existing) = app.get_webview_window(OVERLAY_WINDOW_LABEL) {
        let _ = existing.show();
        return Ok(());
    }

    let win = WebviewWindowBuilder::new(app, OVERLAY_WINDOW_LABEL, WebviewUrl::App("index.html".into()))
        .title("LOL HUD Overlay")
        .inner_size(360.0, 180.0)
        .resizable(false)
        .decorations(false)
        .always_on_top(true)
        .transparent(true)
        .build()
        .map_err(|e| e.to_string())?;

    let _ = win.show();
    Ok(())
}

pub fn close_overlay_window(app: &AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(OVERLAY_WINDOW_LABEL) {
        win.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}
