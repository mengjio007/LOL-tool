use windows::Win32::Foundation::HWND;
use windows::Win32::UI::WindowsAndMessaging::{
    GetSystemMetrics, GetWindowLongW, SetWindowLongW, GWL_EXSTYLE, SM_CXSCREEN, SM_CYSCREEN,
    WS_EX_LAYERED, WS_EX_TRANSPARENT,
};

pub fn get_screen_resolution() -> (i32, i32) {
    unsafe {
        let w = GetSystemMetrics(SM_CXSCREEN);
        let h = GetSystemMetrics(SM_CYSCREEN);
        if w > 0 && h > 0 {
            (w, h)
        } else {
            (1920, 1080)
        }
    }
}

pub fn make_window_click_through(hwnd: HWND) {
    unsafe {
        let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
        SetWindowLongW(
            hwnd,
            GWL_EXSTYLE,
            ex_style | (WS_EX_LAYERED.0 | WS_EX_TRANSPARENT.0) as i32,
        );
    }
}
