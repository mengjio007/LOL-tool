use crate::analysis::model::{MatchAnalysisResult, SummonerInfo};
use crate::config::get_config;
use crate::lcu::client::LcuClient;
use crate::lcu::scanner::find_lcu_credentials;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub time: String,
    pub level: String, // "info" | "success" | "warn" | "error"
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ServiceStatus {
    pub connected: bool,
    pub port: u16,
    pub phase: String,
    pub summoner: Option<SummonerInfo>,
}

pub struct ServiceManager {
    app_handle: AppHandle,
    status: Arc<RwLock<ServiceStatus>>,
    logs: Arc<RwLock<Vec<LogEntry>>>,
    analysis: Arc<RwLock<MatchAnalysisResult>>,
    client: Arc<RwLock<Option<LcuClient>>>,
    running: Arc<AtomicBool>,
}

impl ServiceManager {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            app_handle,
            status: Arc::new(RwLock::new(ServiceStatus::default())),
            logs: Arc::new(RwLock::new(Vec::new())),
            analysis: Arc::new(RwLock::new(MatchAnalysisResult::default())),
            client: Arc::new(RwLock::new(None)),
            running: Arc::new(AtomicBool::new(true)),
        }
    }

    pub fn start(&self) {
        let app = self.app_handle.clone();
        let status_arc = self.status.clone();
        let logs_arc = self.logs.clone();
        let client_arc = self.client.clone();
        let running_arc = self.running.clone();

        tauri::async_runtime::spawn(async move {
            let mut last_phase = String::new();

            while running_arc.load(Ordering::Relaxed) {
                let has_client = client_arc.read().await.is_some();

                if !has_client {
                    if let Some(creds) = find_lcu_credentials() {
                        match LcuClient::new(creds.port, &creds.token) {
                            Ok(c) => {
                                // 尝试获取当前召唤师信息
                                let summoner_info = match c.get_current_summoner().await {
                                    Ok(v) => Some(SummonerInfo {
                                        display_name: v["displayName"].as_str().unwrap_or("").to_string(),
                                        game_name: v["gameName"].as_str().unwrap_or("").to_string(),
                                        tag_line: v["tagLine"].as_str().unwrap_or("").to_string(),
                                        profile_icon_id: v["profileIconId"].as_i64().unwrap_or(0),
                                        summoner_level: v["summonerLevel"].as_i64().unwrap_or(0) as i32,
                                    }),
                                    Err(_) => None,
                                };

                                let new_status = ServiceStatus {
                                    connected: true,
                                    port: creds.port,
                                    phase: "Connected".to_string(),
                                    summoner: summoner_info,
                                };

                                *status_arc.write().await = new_status.clone();
                                *client_arc.write().await = Some(c);

                                let _ = app.emit("service:status", &new_status);
                                Self::append_log(&logs_arc, &app, "success", &format!("成功连接到英雄联盟客户端 (端口: {})", creds.port)).await;
                            }
                            Err(e) => {
                                Self::append_log(&logs_arc, &app, "warn", &format!("初始化客户端连接失败: {}", e)).await;
                            }
                        }
                    }
                } else {
                    // 已连接状态：轮询对局 phase
                    let opt_client = client_arc.read().await.clone();
                    if let Some(c) = opt_client {
                        match c.get_gameflow_phase().await {
                            Ok(phase) => {
                                if phase != last_phase {
                                    last_phase = phase.clone();
                                    let mut s = status_arc.write().await;
                                    s.phase = phase.clone();
                                    let _ = app.emit("service:status", &*s);
                                    let _ = app.emit("game:phase", &phase);
                                    Self::append_log(&logs_arc, &app, "info", &format!("对局状态更新: {}", phase)).await;

                                    // 自动接受对局
                                    if phase == "ReadyCheck" {
                                        let cfg = get_config();
                                        if cfg.auto_accept {
                                            let delay = cfg.accept_delay_ms.max(100) as u64;
                                            let c_clone = c.clone();
                                            let logs_clone = logs_arc.clone();
                                            let app_clone = app.clone();
                                            tauri::async_runtime::spawn(async move {
                                                tokio::time::sleep(Duration::from_millis(delay)).await;
                                                if let Ok(_) = c_clone.accept_match().await {
                                                    Self::append_log(&logs_clone, &app_clone, "success", "自动接受对局成功！").await;
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                            Err(_) => {
                                // 客户端可能已退出
                                *client_arc.write().await = None;
                                let mut s = status_arc.write().await;
                                s.connected = false;
                                s.phase = "None".to_string();
                                s.summoner = None;
                                let _ = app.emit("service:status", &*s);
                                Self::append_log(&logs_arc, &app, "warn", "英雄联盟客户端已断开").await;
                                last_phase.clear();
                            }
                        }
                    }
                }

                tokio::time::sleep(Duration::from_millis(1500)).await;
            }
        });
    }

    pub async fn append_log(logs: &Arc<RwLock<Vec<LogEntry>>>, app: &AppHandle, level: &str, msg: &str) {
        let entry = LogEntry {
            time: chrono_time_now(),
            level: level.to_string(),
            message: msg.to_string(),
        };
        {
            let mut list = logs.write().await;
            list.push(entry.clone());
            if list.len() > 100 {
                list.remove(0);
            }
        }
        let _ = app.emit("service:log", &entry);
    }

    pub async fn get_status(&self) -> ServiceStatus {
        self.status.read().await.clone()
    }

    pub async fn get_logs(&self) -> Vec<LogEntry> {
        self.logs.read().await.clone()
    }

    pub async fn clear_logs(&self) {
        self.logs.write().await.clear();
    }

    pub async fn get_analysis(&self) -> MatchAnalysisResult {
        self.analysis.read().await.clone()
    }

    pub async fn accept_match(&self) -> Result<(), String> {
        if let Some(c) = self.client.read().await.as_ref() {
            c.accept_match().await
        } else {
            Err("客户端未连接".to_string())
        }
    }

    pub async fn start_matchmaking(&self) -> Result<(), String> {
        if let Some(c) = self.client.read().await.as_ref() {
            c.start_matchmaking().await
        } else {
            Err("客户端未连接".to_string())
        }
    }

    pub async fn stop_matchmaking(&self) -> Result<(), String> {
        if let Some(c) = self.client.read().await.as_ref() {
            c.stop_matchmaking().await
        } else {
            Err("客户端未连接".to_string())
        }
    }
}

fn chrono_time_now() -> String {
    // 简易格式化时间
    let now = std::time::SystemTime::now();
    let duration = now.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
    let secs = duration.as_secs();
    let hours = (secs / 3600 + 8) % 24; // UTC+8
    let mins = (secs % 3600) / 60;
    let s = secs % 60;
    format!("{:02}:{:02}:{:02}", hours, mins, s)
}
