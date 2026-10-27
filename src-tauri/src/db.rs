use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoPlatform {
    pub id: i64,
    pub key: String,
    pub name: String,
    pub url: String,
    pub window_width: i32,
    pub window_height: i32,
    pub profile_dir: String,
    pub is_active: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoHistory {
    pub id: i64,
    pub platform_key: String,
    pub trigger_type: String,
    pub champion_name: String,
    pub duration_sec: i32,
    pub created_at: String,
}

#[derive(Clone)]
pub struct DbStore {
    conn: Arc<Mutex<Connection>>,
}

static GLOBAL_STORE: Mutex<Option<DbStore>> = Mutex::new(None);

impl DbStore {
    pub fn init() -> Result<Self, String> {
        let app_data = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
        let db_dir = app_data.join("lol-helper");
        let _ = fs::create_dir_all(&db_dir);
        let db_path = db_dir.join("app_data.db");

        let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

        // 启用 WAL 模式与高性能配置
        let _ = conn.execute_batch("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;");

        let store = DbStore {
            conn: Arc::new(Mutex::new(conn)),
        };

        store.migrate().map_err(|e| e.to_string())?;

        if let Ok(mut g) = GLOBAL_STORE.lock() {
            *g = Some(store.clone());
        }

        Ok(store)
    }

    fn migrate(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS video_platforms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                window_width INTEGER NOT NULL DEFAULT 1080,
                window_height INTEGER NOT NULL DEFAULT 820,
                profile_dir TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS video_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform_key TEXT NOT NULL,
                trigger_type TEXT NOT NULL,
                champion_name TEXT NOT NULL,
                duration_sec INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            "#,
        )?;

        // 初始化默认视频站点 (若表为空)
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM video_platforms", [], |row| row.get(0))?;
        if count == 0 {
            conn.execute(
                r#"INSERT INTO video_platforms (key, name, url, window_width, window_height, profile_dir, is_active)
                   VALUES ('douyin', '抖音推荐流', 'https://www.douyin.com/?recommend=1', 1080, 820, 'douyin_profile', 1)"#,
                [],
            )?;
            conn.execute(
                r#"INSERT INTO video_platforms (key, name, url, window_width, window_height, profile_dir, is_active)
                   VALUES ('bilibili', '哔哩哔哩', 'https://www.bilibili.com', 1280, 800, 'bilibili_profile', 0)"#,
                [],
            )?;
        }

        Ok(())
    }

    pub fn get_platforms(&self) -> Result<Vec<VideoPlatform>, String> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT id, key, name, url, window_width, window_height, profile_dir, is_active, created_at, updated_at FROM video_platforms ORDER BY id ASC")
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| {
                let is_active_int: i32 = row.get(7)?;
                Ok(VideoPlatform {
                    id: row.get(0)?,
                    key: row.get(1)?,
                    name: row.get(2)?,
                    url: row.get(3)?,
                    window_width: row.get(4)?,
                    window_height: row.get(5)?,
                    profile_dir: row.get(6)?,
                    is_active: is_active_int == 1,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut list = Vec::new();
        for r in rows {
            if let Ok(item) = r {
                list.push(item);
            }
        }
        Ok(list)
    }

    pub fn get_active_platform(&self) -> Result<VideoPlatform, String> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT id, key, name, url, window_width, window_height, profile_dir, is_active, created_at, updated_at FROM video_platforms WHERE is_active = 1 LIMIT 1")
            .map_err(|e| e.to_string())?;

        let res = stmt.query_row([], |row| {
            Ok(VideoPlatform {
                id: row.get(0)?,
                key: row.get(1)?,
                name: row.get(2)?,
                url: row.get(3)?,
                window_width: row.get(4)?,
                window_height: row.get(5)?,
                profile_dir: row.get(6)?,
                is_active: true,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        });

        match res {
            Ok(p) => Ok(p),
            Err(_) => Ok(VideoPlatform {
                id: 1,
                key: "douyin".to_string(),
                name: "抖音推荐流".to_string(),
                url: "https://www.douyin.com/?recommend=1".to_string(),
                window_width: 1080,
                window_height: 820,
                profile_dir: "douyin_profile".to_string(),
                is_active: true,
                created_at: None,
                updated_at: None,
            }),
        }
    }

    pub fn set_active_platform(&self, key: &str) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE video_platforms SET is_active = 0", []).map_err(|e| e.to_string())?;
        conn.execute("UPDATE video_platforms SET is_active = 1 WHERE key = ?1", params![key]).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_history(&self, limit: i32) -> Result<Vec<VideoHistory>, String> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT id, platform_key, trigger_type, champion_name, duration_sec, created_at FROM video_history ORDER BY id DESC LIMIT ?1")
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![limit], |row| {
                Ok(VideoHistory {
                    id: row.get(0)?,
                    platform_key: row.get(1)?,
                    trigger_type: row.get(2)?,
                    champion_name: row.get(3)?,
                    duration_sec: row.get(4)?,
                    created_at: row.get(5)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut list = Vec::new();
        for r in rows {
            if let Ok(item) = r {
                list.push(item);
            }
        }
        Ok(list)
    }

    pub fn record_history(&self, platform_key: &str, trigger_type: &str, champion_name: &str, duration_sec: i32) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO video_history (platform_key, trigger_type, champion_name, duration_sec) VALUES (?1, ?2, ?3, ?4)",
            params![platform_key, trigger_type, champion_name, duration_sec],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn save_setting(&self, key: &str, value: &str) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO app_settings (key, value, updated_at) VALUES (?1, ?2, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
            params![key, value],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_setting(&self, key: &str) -> Option<String> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT value FROM app_settings WHERE key = ?1",
            params![key],
            |row| row.get(0),
        )
        .ok()
    }
}

pub fn get_global_store() -> Option<DbStore> {
    GLOBAL_STORE.lock().unwrap().clone()
}
