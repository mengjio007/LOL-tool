package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
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
	if s, err := db.InitDB(); err == nil {
		// 双轨容灾加载：优先检测 SQLite 中持久化存储的算法与应用设置
		if val, err := s.GetSetting("app_config"); err == nil && val != "" {
			var dbCfg config.Config
			if err := json.Unmarshal([]byte(val), &dbCfg); err == nil {
				_ = config.Update(dbCfg)
			}
		}
	} else {
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
	err := config.Update(cfg)
	// 双轨容灾保存：实时持久化到 SQLite 数据库 (%APPDATA%\lol-helper\app_data.db)
	if store := db.GetStore(); store != nil {
		if data, err := json.Marshal(cfg); err == nil {
			_ = store.SaveSetting("app_config", string(data))
		}
	}
	return err
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
	modKernel32                 = syscall.NewLazyDLL("kernel32.dll")
	procEnumWindows             = modUser32.NewProc("EnumWindows")
	procGetWindowThreadProcessId = modUser32.NewProc("GetWindowThreadProcessId")
	procSetWindowPos            = modUser32.NewProc("SetWindowPos")
	procIsWindowVisible         = modUser32.NewProc("IsWindowVisible")
	procGetWindowTextLengthW    = modUser32.NewProc("GetWindowTextLengthW")
	procGetWindowTextW          = modUser32.NewProc("GetWindowTextW")
	procPostMessageW            = modUser32.NewProc("PostMessageW")
	procGetSystemMetrics        = modUser32.NewProc("GetSystemMetrics")
	procBringWindowToTop        = modUser32.NewProc("BringWindowToTop")
	procSetForegroundWindow     = modUser32.NewProc("SetForegroundWindow")
	procGetForegroundWindow     = modUser32.NewProc("GetForegroundWindow")
	procAttachThreadInput       = modUser32.NewProc("AttachThreadInput")
	procGetClassNameW           = modUser32.NewProc("GetClassNameW")
	procGetCurrentThreadId      = modKernel32.NewProc("GetCurrentThreadId")
)

const (
	hwndTopmost   = ^uintptr(0) // -1: HWND_TOPMOST (全局最上层置顶)
	swpNoMove     = 0x0002
	swpNoSize     = 0x0001
	swpShowWindow = 0x0040
	swpNoActivate = 0x0010
	wmClose       = 0x0010      // WM_CLOSE 消息
)

var (
	centeredWindows = make(map[uintptr]bool)
	centeredMu      sync.Mutex
)

func getScreenResolution() (int, int) {
	w, _, _ := procGetSystemMetrics.Call(0) // SM_CXSCREEN (主屏幕宽度)
	h, _, _ := procGetSystemMetrics.Call(1) // SM_CYSCREEN (主屏幕高度)
	if w == 0 || h == 0 {
		return 1920, 1080
	}
	return int(w), int(h)
}

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

// forceForegroundWindow 强制突破 Windows 焦点限制，将指定窗口无视前台独占置于最顶层
func forceForegroundWindow(hwnd uintptr) {
	fgHwnd, _, _ := procGetForegroundWindow.Call()
	if fgHwnd != 0 && fgHwnd != hwnd {
		var fgPid uint32
		fgThreadId, _, _ := procGetWindowThreadProcessId.Call(fgHwnd, uintptr(unsafe.Pointer(&fgPid)))
		curThreadId, _, _ := procGetCurrentThreadId.Call()
		if fgThreadId != 0 && curThreadId != 0 && fgThreadId != curThreadId {
			procAttachThreadInput.Call(curThreadId, fgThreadId, 1)
			procBringWindowToTop.Call(hwnd)
			procSetForegroundWindow.Call(hwnd)
			procAttachThreadInput.Call(curThreadId, fgThreadId, 0)
		} else {
			procBringWindowToTop.Call(hwnd)
			procSetForegroundWindow.Call(hwnd)
		}
	} else {
		procBringWindowToTop.Call(hwnd)
		procSetForegroundWindow.Call(hwnd)
	}
}

// pinProcessWindowsTopmost 寻找属于该目标进程或其子进程的可见窗口并强行居中且置顶 (浮现在英雄联盟等所有窗口最上层)
func pinProcessWindowsTopmost(targetPID int, targetX, targetY, targetWidth, targetHeight int) {
	if targetPID <= 0 {
		return
	}
	targetPIDs := getProcessTreePIDs(uint32(targetPID))
	if len(targetPIDs) == 0 {
		return
	}
	pidSet := make(map[uint32]bool)
	for _, p := range targetPIDs {
		pidSet[p] = true
	}

	cb := syscall.NewCallback(func(hwnd uintptr, lParam uintptr) uintptr {
		var pid uint32
		procGetWindowThreadProcessId.Call(hwnd, uintptr(unsafe.Pointer(&pid)))

		// 严格限定只处理属于 targetPID 自身进程树的窗口，严禁全局搜索标题，防止误干扰用户个人的浏览器
		if !pidSet[pid] {
			return 1
		}

		isVisible, _, _ := procIsWindowVisible.Call(hwnd)
		if isVisible != 0 {
			var clsBuf [256]uint16
			procGetClassNameW.Call(hwnd, uintptr(unsafe.Pointer(&clsBuf[0])), 256)
			cls := syscall.UTF16ToString(clsBuf[:])

			// 过滤 Edge 附属辅助窗口，精准锁定主网页窗口或有效独立窗口
			if cls == "UAC_InputIndicatorOverlayWnd" || cls == "UAC Input Indicator" || cls == "Touch Tooltip Window" {
				return 1
			}

			centeredMu.Lock()
			alreadyCentered := centeredWindows[hwnd]
			if !alreadyCentered {
				centeredWindows[hwnd] = true
			}
			centeredMu.Unlock()

			if !alreadyCentered && targetWidth > 0 && targetHeight > 0 {
				// 首次捕获该窗口：突破 Windows 焦点限制强制提升前台，定位到屏幕正中央并强行 HWND_TOPMOST 置顶
				forceForegroundWindow(hwnd)
				procSetWindowPos.Call(
					hwnd,
					hwndTopmost,
					uintptr(targetX),
					uintptr(targetY),
					uintptr(targetWidth),
					uintptr(targetHeight),
					swpShowWindow,
				)
			} else {
				// 后续维持置顶：BringWindowToTop 并在 Topmost Z-order 中维护，swpNoActivate 避免夺走玩家游戏键鼠焦点
				procBringWindowToTop.Call(hwnd)
				procSetWindowPos.Call(
					hwnd,
					hwndTopmost,
					0, 0, 0, 0,
					swpNoMove|swpNoSize|swpShowWindow|swpNoActivate,
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

	// 计算屏幕居中坐标 (确保弹出时精准位于屏幕正中央，而非左上方)
	scrWidth, scrHeight := getScreenResolution()
	posX := (scrWidth - platform.WindowWidth) / 2
	posY := (scrHeight - platform.WindowHeight) / 2
	if posX < 0 {
		posX = 0
	}
	if posY < 0 {
		posY = 0
	}

	cmd := exec.Command(edgePath,
		fmt.Sprintf("--app=%s", platform.URL),
		fmt.Sprintf("--user-data-dir=%s", profileDir),
		fmt.Sprintf("--window-size=%d,%d", platform.WindowWidth, platform.WindowHeight),
		fmt.Sprintf("--window-position=%d,%d", posX, posY),
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

	// 启动后台持续置顶维护 (在整个视频播放期间持续轮询置顶，确保在英雄联盟无边框游戏画面正中央持续浮现，绝不被游戏覆盖)
	go func(pid, x, y, w, h int) {
		ticker := time.NewTicker(300 * time.Millisecond)
		defer ticker.Stop()
		for range ticker.C {
			a.douyinMutex.Lock()
			running := (a.douyinCmd != nil && a.douyinCmd.Process != nil && a.douyinCmd.Process.Pid == pid)
			a.douyinMutex.Unlock()
			if !running {
				break
			}
			pinProcessWindowsTopmost(pid, x, y, w, h)
		}
	}(cmd.Process.Pid, posX, posY, platform.WindowWidth, platform.WindowHeight)

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

	// 清理居中记录
	centeredMu.Lock()
	centeredWindows = make(map[uintptr]bool)
	centeredMu.Unlock()

	// 关键安全校验：若当前程序并未唤起视频子进程，直接返回，绝对不枚举全局窗口
	if a.douyinCmd == nil || a.douyinCmd.Process == nil {
		return nil
	}

	rootPID := uint32(a.douyinCmd.Process.Pid)
	a.douyinCmd = nil

	targetPIDs := getProcessTreePIDs(rootPID)
	if len(targetPIDs) == 0 {
		return nil
	}

	pidSet := make(map[uint32]bool)
	for _, p := range targetPIDs {
		pidSet[p] = true
	}

	// 1. 仅枚举属于本程序唤起的视频进程树的窗口，通过 Win32 PostMessage 发送 WM_CLOSE 毫秒级关闭
	// 这样 Edge/Chrome 会正常将 session、cookies 和进度安全写盘入库
	// 严格按 pidSet[pid] 匹配，绝对不按标题搜索，彻底杜绝误伤用户的个人浏览器！
	cb := syscall.NewCallback(func(hwnd uintptr, lParam uintptr) uintptr {
		var pid uint32
		procGetWindowThreadProcessId.Call(hwnd, uintptr(unsafe.Pointer(&pid)))

		if pidSet[pid] {
			procPostMessageW.Call(hwnd, wmClose, 0, 0)
		}
		return 1
	})
	procEnumWindows.Call(cb, 0)

	// 2. 给予浏览器 350ms 充分保存登录态写盘后，使用纯 Win32 API 静默清理可能残留的孤儿进程
	// 绝不调用 taskkill 或 powershell，彻底杜绝黑色控制台窗口闪烁
	pidsToClean := make([]uint32, len(targetPIDs))
	copy(pidsToClean, targetPIDs)
	go func() {
		time.Sleep(350 * time.Millisecond)
		killProcessTreePIDs(pidsToClean)
	}()

	return nil
}

// CloseDouyinWindow 兼容旧前端调用
func (a *App) CloseDouyinWindow() error {
	return a.CloseWebVideoWindow()
}


