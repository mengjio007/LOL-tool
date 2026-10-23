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
	"lol/internal/db"
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
	if _, err := db.InitDB(); err != nil {
		println("SQLite Init Error:", err.Error())
	}
	a.manager = service.NewManager(func(eventName string, data ...interface{}) {
		if a.ctx != nil {
			wailsRuntime.EventsEmit(a.ctx, eventName, data...)
		}
	})
	a.manager.Start()
}

// shutdown is called when the app stops
func (a *App) shutdown(ctx context.Context) {
	_ = a.CloseWebVideoWindow()
	if store := db.GetStore(); store != nil {
		_ = store.Close()
	}
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

// getProcessTreePIDs 使用 Win32 Toolhelp 快照枚举 rootPID 及其所有派生的子进程 PID
func getProcessTreePIDs(rootPID uint32) []uint32 {
	if rootPID == 0 {
		return nil
	}
	snapshot, err := syscall.CreateToolhelp32Snapshot(syscall.TH32CS_SNAPPROCESS, 0)
	if err != nil {
		return []uint32{rootPID}
	}
	defer syscall.CloseHandle(snapshot)

	var entry syscall.ProcessEntry32
	entry.Size = uint32(unsafe.Sizeof(entry))

	parentMap := make(map[uint32][]uint32)
	if err := syscall.Process32First(snapshot, &entry); err == nil {
		for {
			parentMap[entry.ParentProcessID] = append(parentMap[entry.ParentProcessID], entry.ProcessID)
			if err := syscall.Process32Next(snapshot, &entry); err != nil {
				break
			}
		}
	}

	pids := []uint32{rootPID}
	queue := []uint32{rootPID}
	visited := map[uint32]bool{rootPID: true}

	for len(queue) > 0 {
		curr := queue[0]
		queue = queue[1:]
		for _, child := range parentMap[curr] {
			if !visited[child] {
				visited[child] = true
				pids = append(pids, child)
				queue = append(queue, child)
			}
		}
	}
	return pids
}

// killProcessTreePIDs 使用纯 Win32 API 静默结束进程，绝不调用 taskkill 或 powershell，0ms 响应且绝无控制台黑框弹出
func killProcessTreePIDs(pids []uint32) {
	const PROCESS_TERMINATE = 0x0001
	for _, pid := range pids {
		if pid <= 4 { // 保护系统关键进程
			continue
		}
		h, err := syscall.OpenProcess(PROCESS_TERMINATE, false, pid)
		if err == nil && h != 0 {
			_ = syscall.TerminateProcess(h, 0)
			_ = syscall.CloseHandle(h)
		}
	}
}

// pinProcessWindowsTopmost 寻找属于该目标进程或其子进程、或包含视频站标题的可见窗口并强行置顶 (浮现在英雄联盟等所有窗口最上层)
func pinProcessWindowsTopmost(targetPID int) {
	targetPIDs := getProcessTreePIDs(uint32(targetPID))
	pidSet := make(map[uint32]bool)
	for _, p := range targetPIDs {
		pidSet[p] = true
	}

	cb := syscall.NewCallback(func(hwnd uintptr, lParam uintptr) uintptr {
		var pid uint32
		procGetWindowThreadProcessId.Call(hwnd, uintptr(unsafe.Pointer(&pid)))

		isTarget := pidSet[pid]
		if !isTarget {
			length, _, _ := procGetWindowTextLengthW.Call(hwnd)
			if length > 0 {
				buf := make([]uint16, length+1)
				procGetWindowTextW.Call(hwnd, uintptr(unsafe.Pointer(&buf[0])), length+1)
				title := syscall.UTF16ToString(buf)
				if strings.Contains(title, "抖音") || strings.Contains(title, "Douyin") ||
					strings.Contains(title, "哔哩哔哩") || strings.Contains(title, "bilibili") ||
					strings.Contains(title, "爱奇艺") || strings.Contains(title, "iqiyi") {
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

// GetVideoPlatforms 从 SQLite 查询所有预置及自定义视频平台配置
func (a *App) GetVideoPlatforms() ([]db.VideoPlatform, error) {
	store := db.GetStore()
	if store == nil {
		return nil, fmt.Errorf("database not initialized")
	}
	return store.GetPlatforms()
}

// SetActiveVideoPlatform 设置当前死亡播放的激活视频源
func (a *App) SetActiveVideoPlatform(key string) error {
	store := db.GetStore()
	if store == nil {
		return fmt.Errorf("database not initialized")
	}
	return store.SetActivePlatform(key)
}

// UpdateVideoPlatformConfig 更新自定义视频平台的名称、URL、窗口大小
func (a *App) UpdateVideoPlatformConfig(key, name, url string, width, height int) error {
	store := db.GetStore()
	if store == nil {
		return fmt.Errorf("database not initialized")
	}
	return store.UpdatePlatformConfig(key, name, url, width, height)
}

// GetVideoHistory 查询播放历史日志
func (a *App) GetVideoHistory() ([]db.VideoHistory, error) {
	store := db.GetStore()
	if store == nil {
		return nil, fmt.Errorf("database not initialized")
	}
	return store.GetHistory(20)
}

// OpenWebVideoWindow 唤起系统级极简画中画小窗，支持抖音、B站、爱奇艺及自定义视频站 (各站点会话独立持久化，置顶于游戏最上层)
func (a *App) OpenWebVideoWindow(platformKey string) error {
	a.douyinMutex.Lock()
	defer a.douyinMutex.Unlock()

	// 若已存在打开的窗口，无需重复唤起
	if a.douyinCmd != nil && a.douyinCmd.Process != nil {
		return nil
	}

	store := db.GetStore()
	var platform *db.VideoPlatform
	var err error
	if store != nil {
		if platformKey != "" {
			platform, err = store.GetPlatformByKey(platformKey)
		} else {
			platform, err = store.GetActivePlatform()
		}
	}
	if err != nil || platform == nil {
		platform = &db.VideoPlatform{
			Key:          "douyin",
			Name:         "抖音推荐流",
			URL:          "https://www.douyin.com/?recommend=1",
			WindowWidth:  1080,
			WindowHeight: 820,
			ProfileDir:   "douyin_profile",
		}
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

	appData := os.Getenv("APPDATA")
	if appData == "" {
		appData = os.TempDir()
	}
	// 每个平台独立隔离的用户目录，各网站登录信息独立持久化且永不冲突
	profileDir := filepath.Join(appData, "lol-helper", platform.ProfileDir)
	_ = os.MkdirAll(profileDir, 0755)

	cmd := exec.Command(edgePath,
		fmt.Sprintf("--app=%s", platform.URL),
		fmt.Sprintf("--user-data-dir=%s", profileDir),
		fmt.Sprintf("--window-size=%d,%d", platform.WindowWidth, platform.WindowHeight),
		"--disable-notifications",
		"--disable-background-mode",
		"--disable-features=Translate,msStartupBoost",
		"--no-first-run",
		"--no-default-browser-check",
		"--disable-blink-features=AutomationControlled",
	)

	if err := cmd.Start(); err != nil {
		return err
	}
	a.douyinCmd = cmd

	// 记录到 SQLite 历史记录
	if store != nil {
		_ = store.RecordHistory(platform.Key, "launch", "Champion", 0)
	}

	// 启动后台轮询置顶 (Edge 启动后持续轮询确保窗口在游戏最顶层)
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

// OpenDouyinWindow 兼容旧前端调用
func (a *App) OpenDouyinWindow() error {
	return a.OpenWebVideoWindow("douyin")
}

// CloseWebVideoWindow 阵亡复活或用户关闭时毫秒级瞬闭小窗，纯 Win32 API 零黑框实现
func (a *App) CloseWebVideoWindow() error {
	a.douyinMutex.Lock()
	defer a.douyinMutex.Unlock()

	var targetPIDs []uint32
	if a.douyinCmd != nil && a.douyinCmd.Process != nil {
		rootPID := uint32(a.douyinCmd.Process.Pid)
		targetPIDs = getProcessTreePIDs(rootPID)
		a.douyinCmd = nil
	}

	pidSet := make(map[uint32]bool)
	for _, p := range targetPIDs {
		pidSet[p] = true
	}

	// 1. 枚举所有带视频站标题或属于目标进程树的窗口，通过 Win32 PostMessage 发送 WM_CLOSE 毫秒级关闭
	// 这样 Edge/Chrome 会正常将 session、cookies 和进度安全写盘入库
	cb := syscall.NewCallback(func(hwnd uintptr, lParam uintptr) uintptr {
		var pid uint32
		procGetWindowThreadProcessId.Call(hwnd, uintptr(unsafe.Pointer(&pid)))

		isTarget := pidSet[pid]
		if !isTarget {
			length, _, _ := procGetWindowTextLengthW.Call(hwnd)
			if length > 0 {
				buf := make([]uint16, length+1)
				procGetWindowTextW.Call(hwnd, uintptr(unsafe.Pointer(&buf[0])), length+1)
				title := syscall.UTF16ToString(buf)
				if strings.Contains(title, "抖音") || strings.Contains(title, "Douyin") ||
					strings.Contains(title, "哔哩哔哩") || strings.Contains(title, "bilibili") ||
					strings.Contains(title, "爱奇艺") || strings.Contains(title, "iqiyi") {
					isTarget = true
					if pid > 4 && !pidSet[pid] {
						pidSet[pid] = true
						targetPIDs = append(targetPIDs, pid)
					}
				}
			}
		}

		if isTarget {
			procPostMessageW.Call(hwnd, wmClose, 0, 0)
		}
		return 1
	})
	procEnumWindows.Call(cb, 0)

	// 2. 给予浏览器 350ms 充分保存登录态写盘后，使用纯 Win32 API 静默清理可能残留的孤儿进程
	// 绝不调用 taskkill 或 powershell，彻底杜绝黑色控制台窗口闪烁
	if len(targetPIDs) > 0 {
		pidsToClean := make([]uint32, len(targetPIDs))
		copy(pidsToClean, targetPIDs)
		go func() {
			time.Sleep(350 * time.Millisecond)
			killProcessTreePIDs(pidsToClean)
		}()
	}

	return nil
}

// CloseDouyinWindow 兼容旧前端调用
func (a *App) CloseDouyinWindow() error {
	return a.CloseWebVideoWindow()
}


