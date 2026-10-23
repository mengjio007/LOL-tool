package main

import (
	"context"
	"time"
	"lol/internal/analysis"
	"lol/internal/config"
	"lol/internal/livegame"
	"lol/internal/service"
	"lol/internal/updater"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx     context.Context
	manager *service.Manager
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	updater.CleanupOldFiles()
	a.manager = service.NewManager(func(eventName string, data ...interface{}) {
		if a.ctx != nil {
			wailsRuntime.EventsEmit(a.ctx, eventName, data...)
		}
	})
	a.manager.Start()
}

// shutdown is called when the app stops
func (a *App) shutdown(ctx context.Context) {
	if a.manager != nil {
		a.manager.Stop()
	}
}

func (a *App) GetConfig() config.Config {
	return config.Get()
}

func (a *App) SaveConfig(cfg config.Config) error {
	return config.Update(cfg)
}

func (a *App) GetStatus() service.ServiceStatus {
	if a.manager == nil {
		return service.ServiceStatus{Connected: false, Phase: "None"}
	}
	return a.manager.GetStatus()
}

func (a *App) GetLogs() []service.LogEntry {
	if a.manager == nil {
		return nil
	}
	return a.manager.GetLogs()
}

func (a *App) ClearLogs() {
	if a.manager != nil {
		a.manager.ClearLogs()
	}
}

func (a *App) MinimizeWindow() {
	if a.ctx != nil {
		wailsRuntime.WindowMinimise(a.ctx)
	}
}

func (a *App) ToggleMaximizeWindow() {
	if a.ctx != nil {
		wailsRuntime.WindowToggleMaximise(a.ctx)
	}
}

func (a *App) IsWindowMaximized() bool {
	if a.ctx != nil {
		return wailsRuntime.WindowIsMaximised(a.ctx)
	}
	return false
}

func (a *App) HideWindow() {
	if a.ctx != nil {
		wailsRuntime.WindowHide(a.ctx)
	}
}

func (a *App) ShowWindow() {
	if a.ctx != nil {
		wailsRuntime.WindowShow(a.ctx)
	}
}

func (a *App) SetAlwaysOnTop(onTop bool) {
	if a.ctx != nil {
		wailsRuntime.WindowSetAlwaysOnTop(a.ctx, onTop)
	}
}

func (a *App) StartMatchmaking() error {
	if a.manager == nil {
		return nil
	}
	return a.manager.TriggerMatchmaking()
}

func (a *App) StopMatchmaking() error {
	if a.manager == nil {
		return nil
	}
	return a.manager.CancelMatchmaking()
}

func (a *App) AcceptMatch() error {
	if a.manager == nil {
		return nil
	}
	return a.manager.TriggerAccept()
}

func (a *App) GetMatchAnalysis() (*analysis.MatchAnalysisResult, error) {
	if a.manager == nil {
		return nil, nil
	}
	return a.manager.GetMatchAnalysis()
}

func (a *App) SendChatMessage(msg string) error {
	if a.manager == nil {
		return nil
	}
	return a.manager.SendChatMessage(msg)
}

func (a *App) GenerateHorseReport() string {
	if a.manager == nil {
		return ""
	}
	return a.manager.GenerateHorseReport()
}

func (a *App) SearchPlayerAnalysis(query string) (*analysis.PlayerAnalysis, error) {
	if a.manager == nil {
		return nil, nil
	}
	return a.manager.SearchPlayerAnalysis(query)
}

func (a *App) CloseApp() {
	if a.ctx != nil {
		wailsRuntime.Quit(a.ctx)
	}
}

func (a *App) CheckForUpdate() (*updater.UpdateInfo, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return updater.CheckUpdate(ctx)
}

func (a *App) DownloadAndApplyUpdate(downloadUrl string) error {
	ctx := context.Background()
	return updater.DownloadAndApplyUpdate(ctx, downloadUrl, func(percent int, downloadedBytes int64, totalBytes int64) {
		if a.ctx != nil {
			wailsRuntime.EventsEmit(a.ctx, "update:progress", map[string]interface{}{
				"percent":    percent,
				"downloaded": downloadedBytes,
				"total":      totalBytes,
			})
		}
	})
}

func (a *App) OpenBrowser(url string) {
	if a.ctx != nil {
		wailsRuntime.BrowserOpenURL(a.ctx, url)
	}
}

func (a *App) SelectDirectory() (string, error) {
	if a.ctx == nil {
		return "", nil
	}
	return wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "选择本地自定义视频文件夹 (存放 .mp4 / .webm)",
	})
}

func (a *App) GetRandomVideoURL(folder string) (string, error) {
	path, err := livegame.GetRandomVideoFromFolder(folder)
	if err != nil {
		return "", err
	}
	return livegame.GetMediaStreamURL(path), nil
}

func (a *App) SetMiniMode(enable bool) {
	if a.ctx == nil {
		return
	}
	if enable {
		wailsRuntime.WindowSetSize(a.ctx, 420, 56)
		wailsRuntime.WindowSetAlwaysOnTop(a.ctx, true)
	} else {
		wailsRuntime.WindowSetSize(a.ctx, 620, 720)
		cfg := config.Get()
		wailsRuntime.WindowSetAlwaysOnTop(a.ctx, cfg.AlwaysOnTop)
	}
}

// TriggerTestDeath 供用户本地测试死亡弹窗效果
func (a *App) TriggerTestDeath(durationSec int) {
	if a.ctx != nil {
		if durationSec <= 0 {
			durationSec = 20
		}
		wailsRuntime.EventsEmit(a.ctx, "live:player_died", map[string]interface{}{
			"isDead":       true,
			"respawnTimer": float64(durationSec),
			"championName": "Aatrox",
			"summonerName": "测试玩家",
		})
	}
}

// TriggerTestRespawn 供用户本地测试复活关闭效果
func (a *App) TriggerTestRespawn() {
	if a.ctx != nil {
		wailsRuntime.EventsEmit(a.ctx, "live:player_respawned", true)
	}
}


