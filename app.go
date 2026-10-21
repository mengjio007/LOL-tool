package main

import (
	"context"
	"time"
	"lol/internal/analysis"
	"lol/internal/config"
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

