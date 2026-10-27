// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  // 设置 v3.0 专属的独立 WebView2 运行时目录，彻底杜绝与其他浏览器或旧版本发生 0x800700AA 锁冲突
  if let Some(local_app_data) = dirs::data_local_dir() {
    let webview_dir = local_app_data.join("lol-helper-v3").join("webview");
    let _ = std::fs::create_dir_all(&webview_dir);
    unsafe {
      std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", webview_dir);
    }
  }

  lol_helper_lib::run();
}
