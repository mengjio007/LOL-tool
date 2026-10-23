package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

// VideoPlatform 结构体，持久化存储各视频网站配置与独立环境目录
type VideoPlatform struct {
	ID           int64     `json:"id"`
	Key          string    `json:"key"`          // "douyin", "bilibili", "iqiyi", "custom"
	Name         string    `json:"name"`         // 平台展示名
	URL          string    `json:"url"`          // 默认加载地址
	WindowWidth  int       `json:"windowWidth"`  // 视窗宽度 (默认 1080)
	WindowHeight int       `json:"windowHeight"` // 视窗高度 (默认 820)
	ProfileDir   string    `json:"profileDir"`   // 专属独立 Chromium 用户目录，确保各站点 Cookie 会话隔离
	IsActive     bool      `json:"isActive"`     // 是否为当前选中的网页视频源
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// VideoHistory 阵亡与测试播放日志记录
type VideoHistory struct {
	ID           int64     `json:"id"`
	PlatformKey  string    `json:"platformKey"`
	TriggerType  string    `json:"triggerType"` // "death", "test"
	ChampionName string    `json:"championName"`
	DurationSec  int       `json:"durationSec"`
	CreatedAt    time.Time `json:"createdAt"`
}

type Store struct {
	db *sql.DB
}

var globalStore *Store

// InitDB 初始化本地 SQLite 数据库，位于 %APPDATA%/lol-helper/app_data.db
func InitDB() (*Store, error) {
	appData := os.Getenv("APPDATA")
	if appData == "" {
		appData = os.TempDir()
	}
	dbDir := filepath.Join(appData, "lol-helper")
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return nil, err
	}

	dbPath := filepath.Join(dbDir, "app_data.db")
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	// 开启 WAL 模式加速并发读写
	_, _ = db.Exec(`PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;`)

	s := &Store{db: db}
	if err := s.migrate(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("failed to migrate tables: %w", err)
	}

	globalStore = s
	return s, nil
}

func GetStore() *Store {
	return globalStore
}

func (s *Store) Close() error {
	if s.db != nil {
		return s.db.Close()
	}
	return nil
}

func (s *Store) migrate() error {
	schema := `
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
		champion_name TEXT,
		duration_sec INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS app_settings (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	if _, err := s.db.Exec(schema); err != nil {
		return err
	}

	// 初始预置 4 大平台：抖音、哔哩哔哩、爱奇艺、自定义流
	seeds := []VideoPlatform{
		{
			Key:          "douyin",
			Name:         "抖音推荐流",
			URL:          "https://www.douyin.com/?recommend=1",
			WindowWidth:  1080,
			WindowHeight: 820,
			ProfileDir:   "douyin_profile",
			IsActive:     true,
		},
		{
			Key:          "bilibili",
			Name:         "哔哩哔哩 (B站)",
			URL:          "https://www.bilibili.com",
			WindowWidth:  1100,
			WindowHeight: 840,
			ProfileDir:   "bilibili_profile",
			IsActive:     false,
		},
		{
			Key:          "iqiyi",
			Name:         "爱奇艺视频",
			URL:          "https://www.iqiyi.com",
			WindowWidth:  1100,
			WindowHeight: 840,
			ProfileDir:   "iqiyi_profile",
			IsActive:     false,
		},
		{
			Key:          "custom",
			Name:         "自定义视频站",
			URL:          "https://www.douyin.com/?recommend=1",
			WindowWidth:  1080,
			WindowHeight: 820,
			ProfileDir:   "custom_profile",
			IsActive:     false,
		},
	}

	for _, seed := range seeds {
		_, _ = s.db.Exec(`
			INSERT OR IGNORE INTO video_platforms (key, name, url, window_width, window_height, profile_dir, is_active)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`, seed.Key, seed.Name, seed.URL, seed.WindowWidth, seed.WindowHeight, seed.ProfileDir, boolToInt(seed.IsActive))
	}

	return nil
}

func (s *Store) GetPlatforms() ([]VideoPlatform, error) {
	rows, err := s.db.Query(`
		SELECT id, key, name, url, window_width, window_height, profile_dir, is_active, created_at, updated_at
		FROM video_platforms ORDER BY id ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []VideoPlatform
	for rows.Next() {
		var p VideoPlatform
		var isActiveInt int
		if err := rows.Scan(&p.ID, &p.Key, &p.Name, &p.URL, &p.WindowWidth, &p.WindowHeight, &p.ProfileDir, &isActiveInt, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		p.IsActive = isActiveInt == 1
		list = append(list, p)
	}
	return list, nil
}

func (s *Store) GetActivePlatform() (*VideoPlatform, error) {
	var p VideoPlatform
	var isActiveInt int
	err := s.db.QueryRow(`
		SELECT id, key, name, url, window_width, window_height, profile_dir, is_active, created_at, updated_at
		FROM video_platforms WHERE is_active = 1 LIMIT 1
	`).Scan(&p.ID, &p.Key, &p.Name, &p.URL, &p.WindowWidth, &p.WindowHeight, &p.ProfileDir, &isActiveInt, &p.CreatedAt, &p.UpdatedAt)

	if err == sql.ErrNoRows {
		// 默认回退抖音
		return s.GetPlatformByKey("douyin")
	}
	if err != nil {
		return nil, err
	}
	p.IsActive = true
	return &p, nil
}

func (s *Store) GetPlatformByKey(key string) (*VideoPlatform, error) {
	var p VideoPlatform
	var isActiveInt int
	err := s.db.QueryRow(`
		SELECT id, key, name, url, window_width, window_height, profile_dir, is_active, created_at, updated_at
		FROM video_platforms WHERE key = ? LIMIT 1
	`, key).Scan(&p.ID, &p.Key, &p.Name, &p.URL, &p.WindowWidth, &p.WindowHeight, &p.ProfileDir, &isActiveInt, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	p.IsActive = isActiveInt == 1
	return &p, nil
}

func (s *Store) SetActivePlatform(key string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`UPDATE video_platforms SET is_active = 0`); err != nil {
		return err
	}
	if _, err := tx.Exec(`UPDATE video_platforms SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE key = ?`, key); err != nil {
		return err
	}
	return tx.Commit()
}

func (s *Store) UpdatePlatformConfig(key, name, url string, width, height int) error {
	_, err := s.db.Exec(`
		UPDATE video_platforms 
		SET name = ?, url = ?, window_width = ?, window_height = ?, updated_at = CURRENT_TIMESTAMP
		WHERE key = ?
	`, name, url, width, height, key)
	return err
}

func (s *Store) RecordHistory(platformKey, triggerType, championName string, durationSec int) error {
	_, err := s.db.Exec(`
		INSERT INTO video_history (platform_key, trigger_type, champion_name, duration_sec, created_at)
		VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
	`, platformKey, triggerType, championName, durationSec)
	return err
}

func (s *Store) GetHistory(limit int) ([]VideoHistory, error) {
	if limit <= 0 {
		limit = 20
	}
	rows, err := s.db.Query(`
		SELECT id, platform_key, trigger_type, champion_name, duration_sec, created_at
		FROM video_history ORDER BY id DESC LIMIT ?
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []VideoHistory
	for rows.Next() {
		var h VideoHistory
		if err := rows.Scan(&h.ID, &h.PlatformKey, &h.TriggerType, &h.ChampionName, &h.DurationSec, &h.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, h)
	}
	return list, nil
}

func (s *Store) SaveSetting(key, value string) error {
	_, err := s.db.Exec(`
		INSERT INTO app_settings (key, value, updated_at)
		VALUES (?, ?, CURRENT_TIMESTAMP)
		ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
	`, key, value)
	return err
}

func (s *Store) GetSetting(key string) (string, error) {
	var val string
	err := s.db.QueryRow(`SELECT value FROM app_settings WHERE key = ?`, key).Scan(&val)
	if err != nil {
		return "", err
	}
	return val, nil
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
