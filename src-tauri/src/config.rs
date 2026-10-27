use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlgorithmConfig {
    pub custom_weights_enabled: bool,
    pub damage_weight: i32,
    pub tank_weight: i32,
    pub heal_weight: i32,
    pub kda_weight: i32,
    pub win_rate_weight: i32,
    pub streak_weight: i32,
    pub guardian_weight: i32,
    pub rank_tier_weight: i32,
    pub highlight_weight: i32,
    pub strict_tilt_penalty: bool,
}

impl Default for AlgorithmConfig {
    fn default() -> Self {
        Self {
            custom_weights_enabled: false,
            damage_weight: 22,
            tank_weight: 14,
            heal_weight: 8,
            kda_weight: 14,
            win_rate_weight: 16,
            streak_weight: 12,
            guardian_weight: 6,
            rank_tier_weight: 4,
            highlight_weight: 4,
            strict_tilt_penalty: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeathVideoConfig {
    pub enabled: bool,
    pub source: String, // "local" | "douyin"
    pub local_folder: String,
    pub volume: i32,
    pub auto_close_on_respawn: bool,
    pub show_countdown: bool,
}

impl Default for DeathVideoConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            source: "local".to_string(),
            local_folder: String::new(),
            volume: 40,
            auto_close_on_respawn: true,
            show_countdown: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Config {
    pub auto_accept: bool,
    pub accept_delay_ms: i32,
    pub auto_queue: bool,
    pub target_members: i32,
    pub auto_play_again: bool,
    pub auto_honor: bool,
    pub start_with_os: bool,
    pub minimize_to_tray: bool,
    pub always_on_top: bool,
    pub theme: String,
    pub font_scale: String,
    pub algorithm: AlgorithmConfig,
    pub death_video: DeathVideoConfig,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            auto_accept: true,
            accept_delay_ms: 800,
            auto_queue: true,
            target_members: 1,
            auto_play_again: true,
            auto_honor: true,
            start_with_os: false,
            minimize_to_tray: true,
            always_on_top: false,
            theme: "azure".to_string(),
            font_scale: "auto".to_string(),
            algorithm: AlgorithmConfig::default(),
            death_video: DeathVideoConfig::default(),
        }
    }
}

static CURRENT_CONFIG: RwLock<Option<Config>> = RwLock::new(None);

fn get_config_path() -> PathBuf {
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            return dir.join("config.json");
        }
    }
    PathBuf::from("config.json")
}

pub fn get_config() -> Config {
    if let Ok(guard) = CURRENT_CONFIG.read() {
        if let Some(ref cfg) = *guard {
            return cfg.clone();
        }
    }

    let path = get_config_path();
    let loaded: Config = if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            serde_json::from_str(&content).unwrap_or_default()
        } else {
            Config::default()
        }
    } else {
        Config::default()
    };

    if let Ok(mut guard) = CURRENT_CONFIG.write() {
        *guard = Some(loaded.clone());
    }
    loaded
}

pub fn save_config(cfg: Config) -> Result<(), String> {
    let path = get_config_path();
    let json = serde_json::to_string_pretty(&cfg).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())?;

    if let Ok(mut guard) = CURRENT_CONFIG.write() {
        *guard = Some(cfg);
    }
    Ok(())
}
