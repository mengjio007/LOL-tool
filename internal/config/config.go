package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

type AlgorithmConfig struct {
	CustomWeightsEnabled bool `json:"customWeightsEnabled"` // 是否开启自定义权重
	DamageWeight         int  `json:"damageWeight"`         // 01 输出压制贡献 (默认 22)
	TankWeight           int  `json:"tankWeight"`           // 02 承伤抗压贡献 (默认 14)
	HealWeight           int  `json:"healWeight"`           // 03 治疗护盾贡献 (默认 8)
	KdaWeight            int  `json:"kdaWeight"`            // 04 参团/KDA (默认 14)
	WinRateWeight        int  `json:"winRateWeight"`        // 05 胜率基石 (默认 16)
	StreakWeight         int  `json:"streakWeight"`         // 06 连胜/连败心态 (默认 12)
	GuardianWeight       int  `json:"guardianWeight"`       // 07 出装与理解 (默认 6)
	RankTierWeight       int  `json:"rankTierWeight"`       // 08 排位段位 (默认 4)
	HighlightWeight      int  `json:"highlightWeight"`      // 09 高光爆发与推塔 (默认 4)
	StrictTiltPenalty    bool `json:"strictTiltPenalty"`    // 连败破防熔断降级 (默认 true)
}

type DeathVideoConfig struct {
	Enabled            bool   `json:"enabled"`            // 是否开启死亡视频弹窗
	Source             string `json:"source"`             // "local" 或 "douyin" (默认 "local")
	LocalFolder        string `json:"localFolder"`        // 本地自定义视频文件夹路径
	Volume             int    `json:"volume"`             // 默认音量 (0-100, 默认 40)
	AutoCloseOnRespawn bool   `json:"autoCloseOnRespawn"` // 复活自动关闭 (默认 true)
	ShowCountdown      bool   `json:"showCountdown"`      // 显示复活倒计时条 (默认 true)
}

type Config struct {
	AutoAccept     bool             `json:"autoAccept"`
	AcceptDelayMs  int              `json:"acceptDelayMs"`
	AutoQueue      bool             `json:"autoQueue"`
	TargetMembers  int              `json:"targetMembers"` // 0: 不限, 1: 单人, 2: 双排, 3: 三排, 4: 四排, 5: 五黑
	AutoPlayAgain  bool             `json:"autoPlayAgain"`
	AutoHonor      bool             `json:"autoHonor"`
	StartWithOS    bool             `json:"startWithOS"`
	MinimizeToTray bool             `json:"minimizeToTray"`
	AlwaysOnTop    bool             `json:"alwaysOnTop"`
	Algorithm      AlgorithmConfig  `json:"algorithm"`
	DeathVideo     DeathVideoConfig `json:"deathVideo"`
}

var (
	DefaultAlgorithm = AlgorithmConfig{
		CustomWeightsEnabled: false,
		DamageWeight:         22,
		TankWeight:           14,
		HealWeight:           8,
		KdaWeight:            14,
		WinRateWeight:        16,
		StreakWeight:         12,
		GuardianWeight:       6,
		RankTierWeight:       4,
		HighlightWeight:      4,
		StrictTiltPenalty:    true,
	}

	DefaultDeathVideo = DeathVideoConfig{
		Enabled:            true,
		Source:             "local",
		LocalFolder:        "",
		Volume:             40,
		AutoCloseOnRespawn: true,
		ShowCountdown:      true,
	}

	defaultConfig = Config{
		AutoAccept:     true,
		AcceptDelayMs:  800,
		AutoQueue:      true,
		TargetMembers:  1,
		AutoPlayAgain:  true,
		AutoHonor:      true,
		StartWithOS:    false,
		MinimizeToTray: true,
		AlwaysOnTop:    false,
		Algorithm:      DefaultAlgorithm,
		DeathVideo:     DefaultDeathVideo,
	}
	cfgMu      sync.RWMutex
	currentCfg Config
	configPath string
)

func init() {
	currentCfg = defaultConfig
	exePath, err := os.Executable()
	if err == nil {
		configPath = filepath.Join(filepath.Dir(exePath), "config.json")
	} else {
		configPath = "config.json"
	}
	_ = Load()
}

func Get() Config {
	cfgMu.RLock()
	defer cfgMu.RUnlock()
	return currentCfg
}

func Update(newCfg Config) error {
	cfgMu.Lock()
	currentCfg = newCfg
	cfgMu.Unlock()
	return Save()
}

func Load() error {
	cfgMu.Lock()
	defer cfgMu.Unlock()

	data, err := os.ReadFile(configPath)
	if err != nil {
		currentCfg = defaultConfig
		return nil
	}

	var loaded Config
	if err := json.Unmarshal(data, &loaded); err != nil {
		return err
	}

	// 补全缺失的 2.0 模块默认值
	if loaded.Algorithm.DamageWeight == 0 && loaded.Algorithm.WinRateWeight == 0 {
		loaded.Algorithm = DefaultAlgorithm
	}
	if loaded.DeathVideo.Source == "" {
		loaded.DeathVideo = DefaultDeathVideo
	}

	currentCfg = loaded
	return nil
}

func Save() error {
	cfgMu.RLock()
	data, err := json.MarshalIndent(currentCfg, "", "  ")
	cfgMu.RUnlock()
	if err != nil {
		return err
	}

	return os.WriteFile(configPath, data, 0644)
}
