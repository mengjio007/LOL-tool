use std::fs;
use std::path::{Path, PathBuf};
use windows::core::PWSTR;
use windows::Win32::Foundation::CloseHandle;
use windows::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS,
};
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_FORMAT, PROCESS_QUERY_LIMITED_INFORMATION,
};

#[derive(Debug, Clone)]
pub struct LcuCredentials {
    pub pid: u32,
    pub port: u16,
    pub token: String,
}

pub fn find_lcu_credentials() -> Option<LcuCredentials> {
    // 1. 通过 Win32 API 快速寻找 LeagueClientUx.exe 进程
    if let Some((pid, exe_path)) = find_league_process() {
        if let Some(parent_dir) = exe_path.parent() {
            let lockfile_path = parent_dir.join("lockfile");
            if let Some(creds) = parse_lockfile(&lockfile_path, pid) {
                return Some(creds);
            }
        }
    }

    // 2. 常见国服/外服默认安装目录探测
    let common_dirs = [
        r"C:\Riot Games\League of Legends",
        r"D:\Riot Games\League of Legends",
        r"D:\WeGameApps\英雄联盟",
        r"E:\WeGameApps\英雄联盟",
        r"C:\Program Files\Tencent\英雄联盟",
        r"D:\Program Files\Tencent\英雄联盟",
    ];

    for dir in &common_dirs {
        let lockfile = Path::new(dir).join("lockfile");
        if lockfile.exists() {
            if let Some(creds) = parse_lockfile(&lockfile, 0) {
                return Some(creds);
            }
        }
    }

    None
}

fn parse_lockfile(path: &Path, default_pid: u32) -> Option<LcuCredentials> {
    if !path.exists() {
        return None;
    }
    let content = fs::read_to_string(path).ok()?;
    let parts: Vec<&str> = content.split(':').collect();
    if parts.len() >= 4 {
        let pid: u32 = parts[1].parse().unwrap_or(default_pid);
        let port: u16 = parts[2].parse().ok()?;
        let token = parts[3].to_string();
        return Some(LcuCredentials { pid, port, token });
    }
    None
}

fn find_league_process() -> Option<(u32, PathBuf)> {
    unsafe {
        let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0).ok()?;
        let mut entry = PROCESSENTRY32W::default();
        entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;

        if Process32FirstW(snapshot, &mut entry).is_ok() {
            loop {
                let name = String::from_utf16_lossy(&entry.szExeFile)
                    .trim_matches('\0')
                    .to_string();

                if name.eq_ignore_ascii_case("LeagueClientUx.exe") {
                    let pid = entry.th32ProcessID;
                    let path = get_process_image_path(pid);
                    let _ = CloseHandle(snapshot);
                    return Some((pid, path.unwrap_or_default()));
                }

                if Process32NextW(snapshot, &mut entry).is_err() {
                    break;
                }
            }
        }
        let _ = CloseHandle(snapshot);
    }
    None
}

fn get_process_image_path(pid: u32) -> Option<PathBuf> {
    unsafe {
        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;
        let mut buf = [0u16; 1024];
        let mut size = buf.len() as u32;

        let res = QueryFullProcessImageNameW(
            handle,
            PROCESS_NAME_FORMAT(0),
            PWSTR(buf.as_mut_ptr()),
            &mut size,
        );
        let _ = CloseHandle(handle);

        if res.is_ok() && size > 0 {
            let path_str = String::from_utf16_lossy(&buf[..size as usize]);
            return Some(PathBuf::from(path_str));
        }
    }
    None
}
