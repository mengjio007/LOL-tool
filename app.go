package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"
	"unsafe"
	"lol/internal/analysis"
	"lol/internal/config"
	"lol/internal/livegame"
	"lol/internal/service"
	"lol/internal/updater"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx         context.Context
	manager     *service.Manager
	douyinCmd   *exec.Cmd
	douyinMutex sync.Mutex
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
	_ = a.CloseDouyinWindow()
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

var (
	modUser32                   = syscall.NewLazyDLL("user32.dll")
	procEnumWindows             = modUser32.NewProc("EnumWindows")
	procGetWindowThreadProcessId = modUser32.NewProc("GetWindowThreadProcessId")
	procSetWindowPos            = modUser32.NewProc("SetWindowPos")
	procIsWindowVisible         = modUser32.NewProc("IsWindowVisible")
	procGetWindowTextLengthW    = modUser32.NewProc("GetWindowTextLengthW")
	procGetWindowTextW          = modUser32.NewProc("GetWindowTextW")
	procPostMessageW            = modUser32.NewProc("PostMessageW")
)

const (
	hwndTopmost   = ^uintptr(0) // -1: HWND_TOPMOST (全局最上层置顶)
	swpNoMove     = 0x0002
	swpNoSize     = 0x0001
	swpShowWindow = 0x0040
	wmClose       = 0x0010      // WM_CLOSE 消息
)

// pinProcessWindowsTopmost 寻找属于该目标进程或包含抖音标题的可见窗口并强行置顶 (浮现在英雄联盟等所有窗口最上层)
func pinProcessWindowsTopmost(targetPID int) {
	cb := syscall.NewCallback(func(hwnd uintptr, lParam uintptr) uintptr {
		var pid uint32
		procGetWindowThreadProcessId.Call(hwnd, uintptr(unsafe.Pointer(&pid)))

		isTarget := int(pid) == targetPID
		if !isTarget {
			length, _, _ := procGetWindowTextLengthW.Call(hwnd)
			if length > 0 {
				buf := make([]uint16, length+1)
				procGetWindowTextW.Call(hwnd, uintptr(unsafe.Pointer(&buf[0])), length+1)
				title := syscall.UTF16ToString(buf)
				if strings.Contains(title, "抖音") || strings.Contains(title, "Douyin") {
					isTarget = true
				}
			}
		}

		if isTarget {
			isVisible, _, _ := procIsWindowVisible.Call(hwnd)
			if isVisible != 0 {
				// 强行设为 HWND_TOPMOST
				procSetWindowPos.Call(
					hwnd,
					hwndTopmost,
					0, 0, 0, 0,
					swpNoMove|swpNoSize|swpShowWindow,
				)
			}
		}
		return 1 // 继续遍历
	})
	procEnumWindows.Call(cb, 0)
}

// OpenDouyinWindow 唤起系统级极简画中画小窗播放抖音推荐流 (无边框app模式，彻底绕过iframe的X-Frame-Options封禁，尺寸620x880，置顶于游戏最上层)
func (a *App) OpenDouyinWindow() error {
	a.douyinMutex.Lock()
	defer a.douyinMutex.Unlock()

	// 若已存在打开的窗口，无需重复唤起
	if a.douyinCmd != nil && a.douyinCmd.Process != nil {
		return nil
	}

	edgePath := `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
	if _, err := os.Stat(edgePath); os.IsNotExist(err) {
		edgePath = `C:\Program Files\Microsoft\Edge\Application\msedge.exe`
	}
	if _, err := os.Stat(edgePath); os.IsNotExist(err) {
		edgePath = `C:\Program Files\Google\Chrome\Application\chrome.exe`
	}
	if _, err := os.Stat(edgePath); os.IsNotExist(err) {
		edgePath = `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
	}

	// 使用持久化用户目录保留登录会话与关闭弹窗后的状态，避免每次重复弹出登录引导
	appData := os.Getenv("APPDATA")
	if appData == "" {
		appData = os.TempDir()
	}
	profileDir := filepath.Join(appData, "lol-helper", "douyin_profile")
	_ = os.MkdirAll(profileDir, 0755)

	// 窗口横向拉宽至 1080×820：
	// 彻底匹配抖音 PC Web 端的 1080px 响应式断点，登录弹窗、右上角关闭按钮 (X) 与推荐视频流全部完整呈现，绝不横向截断
	cmd := exec.Command(edgePath,
		"--app=https://www.douyin.com/?recommend=1",
		fmt.Sprintf("--user-data-dir=%s", profileDir),
		"--window-size=1080,820",
		"--disable-notifications",
		"--disable-features=Translate",
		"--disable-blink-features=AutomationControlled",
	)

	if err := cmd.Start(); err != nil {
		return err
	}
	a.douyinCmd = cmd

	// 启动后台轮询置顶 (Edge 启动后可能需要200~600ms完成HWND创建，持续轮询确保窗口在游戏最顶层)
	go func(pid int) {
		for i := 0; i < 15; i++ {
			time.Sleep(200 * time.Millisecond)
			a.douyinMutex.Lock()
			running := (a.douyinCmd != nil && a.douyinCmd.Process != nil && a.douyinCmd.Process.Pid == pid)
			a.douyinMutex.Unlock()
			if !running {
				break
			}
			pinProcessWindowsTopmost(pid)
		}
	}(cmd.Process.Pid)

	go func() {
		_ = cmd.Wait()
		a.douyinMutex.Lock()
		a.douyinCmd = nil
		a.douyinMutex.Unlock()
	}()

	return nil
}

// CloseDouyinWindow 阵亡复活或用户关闭时毫秒级瞬闭抖音小窗并保存登录会话
func (a *App) CloseDouyinWindow() error {
	a.douyinMutex.Lock()
	defer a.douyinMutex.Unlock()

	// 1. 如果有持有的直接句柄，杀掉进程树
	if a.douyinCmd != nil && a.douyinCmd.Process != nil {
		pid := a.douyinCmd.Process.Pid
		_ = exec.Command("taskkill", "/F", "/T", "/PID", fmt.Sprintf("%d", pid)).Run()
		_ = a.douyinCmd.Process.Kill()
		a.douyinCmd = nil
	}

	// 2. 枚举所有带抖音标题的窗口，通过 Win32 API 发送 WM_CLOSE 让窗口以 0ms 瞬间关闭
	cb := syscall.NewCallback(func(hwnd uintptr, lParam uintptr) uintptr {
		length, _, _ := procGetWindowTextLengthW.Call(hwnd)
		if length > 0 {
			buf := make([]uint16, length+1)
			procGetWindowTextW.Call(hwnd, uintptr(unsafe.Pointer(&buf[0])), length+1)
			title := syscall.UTF16ToString(buf)
			if strings.Contains(title, "抖音") || strings.Contains(title, "Douyin") {
				procPostMessageW.Call(hwnd, wmClose, 0, 0)
			}
		}
		return 1
	})
	procEnumWindows.Call(cb, 0)

	// 3. 异步查杀所有携带 douyin_profile 参数的孤儿 Chromium 进程，确保 100% 不留任何后台进程
	go func() {
		killCmd := `Get-CimInstance Win32_Process -Filter "Name = 'msedge.exe' or Name = 'chrome.exe'" | Where-Object { $_.CommandLine -like "*douyin_profile*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`
		_ = exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", killCmd).Run()
	}()

	return nil
}


