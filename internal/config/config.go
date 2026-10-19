package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

type Config struct {
	AutoAccept     bool `json:"autoAccept"`
	AcceptDelayMs  int  `json:"acceptDelayMs"`
	AutoQueue      bool `json:"autoQueue"`
	TargetMembers  int  `json:"targetMembers"` // 0: 不限, 1: 单人, 2: 双排, 3: 三排, 4: 四排, 5: 五黑
	AutoPlayAgain  bool `json:"autoPlayAgain"`
	AutoHonor      bool `json:"autoHonor"`
	StartWithOS    bool `json:"startWithOS"`
	MinimizeToTray bool `json:"minimizeToTray"`
	AlwaysOnTop    bool `json:"alwaysOnTop"`
}

var (
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
