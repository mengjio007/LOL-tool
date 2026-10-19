package service

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sync"
	"time"

	"lol/internal/analysis"
	"lol/internal/config"
	"lol/internal/lcu"

	"github.com/gorilla/websocket"
)

type LogEntry struct {
	Time    string `json:"time"`
	Level   string `json:"level"` // "info", "success", "warn", "error"
	Message string `json:"message"`
}

type ServiceStatus struct {
	Connected bool              `json:"connected"`
	Port      int               `json:"port"`
	Phase     string            `json:"phase"`
	Summoner  *lcu.SummonerInfo `json:"summoner"`
}

type Manager struct {
	mu           sync.RWMutex
	client       *lcu.Client
	analyzer     *analysis.Analyzer
	lastAnalysis *analysis.MatchAnalysisResult
	status       ServiceStatus
	logs         []LogEntry
	maxLogs      int
	eventEmitter func(eventName string, data ...interface{})

	// Automation flow states
	isSearching          bool
	isPlayAgainTriggered bool
	queueCancel          context.CancelFunc
	playAgainCancel      context.CancelFunc
	stopChan             chan struct{}
}

func NewManager(eventEmitter func(eventName string, data ...interface{})) *Manager {
	return &Manager{
		eventEmitter: eventEmitter,
		maxLogs:      200,
		logs:         make([]LogEntry, 0, 200),
		status: ServiceStatus{
			Connected: false,
			Phase:     "None",
		},
		stopChan: make(chan struct{}),
	}
}

func (m *Manager) AddLog(level, format string, a ...interface{}) {
	msg := fmt.Sprintf(format, a...)
	now := time.Now().Format("15:04:05")
	entry := LogEntry{
		Time:    now,
		Level:   level,
		Message: msg,
	}

	m.mu.Lock()
	m.logs = append(m.logs, entry)
	if len(m.logs) > m.maxLogs {
		m.logs = m.logs[1:]
	}
	m.mu.Unlock()

	if m.eventEmitter != nil {
		m.eventEmitter("log:new", entry)
	}
}

func (m *Manager) GetLogs() []LogEntry {
	m.mu.RLock()
	defer m.mu.RUnlock()
	copied := make([]LogEntry, len(m.logs))
	copy(copied, m.logs)
	return copied
}

func (m *Manager) ClearLogs() {
	m.mu.Lock()
	m.logs = make([]LogEntry, 0, m.maxLogs)
	m.mu.Unlock()
	if m.eventEmitter != nil {
		m.eventEmitter("log:clear", true)
	}
}

func (m *Manager) GetStatus() ServiceStatus {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.status
}

func (m *Manager) setConnected(connected bool, port int, client *lcu.Client) {
	m.mu.Lock()
	m.status.Connected = connected
	m.status.Port = port
	m.client = client
	if connected {
		m.analyzer = analysis.NewAnalyzer(client)
	} else {
		m.analyzer = nil
		m.status.Phase = "None"
		m.status.Summoner = nil
	}
	currStatus := m.status
	m.mu.Unlock()

	if m.eventEmitter != nil {
		m.eventEmitter("status:change", currStatus)
	}
}

func (m *Manager) setPhase(phase string) {
	m.mu.Lock()
	m.status.Phase = phase
	currStatus := m.status
	m.mu.Unlock()

	if m.eventEmitter != nil {
		m.eventEmitter("status:change", currStatus)
	}
}

func (m *Manager) updateSummoner(info *lcu.SummonerInfo) {
	m.mu.Lock()
	m.status.Summoner = info
	currStatus := m.status
	m.mu.Unlock()

	if m.eventEmitter != nil {
		m.eventEmitter("status:change", currStatus)
	}
}

// Start launches background monitoring loop
func (m *Manager) Start() {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				m.AddLog("error", "后台监控发生未捕获异常: %v，5秒后重启监控...", r)
				time.Sleep(5 * time.Second)
				m.Start()
			}
		}()

		for {
			select {
			case <-m.stopChan:
				return
			default:
			}

			port, token, err := lcu.GetCredentials()
			if err != nil {
				m.setConnected(false, 0, nil)
				time.Sleep(2 * time.Second)
				continue
			}

			client := lcu.NewClient(port, token)
			m.setConnected(true, port, client)
			m.AddLog("info", "检测到英雄联盟客户端 (端口: %d)，正在建立长连接...", port)

			// Fetch summoner profile
			go func() {
				defer func() {
					if r := recover(); r != nil {
						// ignore summoner fetch panic
					}
				}()
				time.Sleep(1 * time.Second)
				if client == nil {
					return
				}
				if summoner, err := client.GetCurrentSummoner(); err == nil {
					m.updateSummoner(summoner)
					m.AddLog("info", "欢迎召唤师: %s (Lv.%d)", summoner.DisplayName, summoner.SummonerLevel)
				}
			}()

			// Query initial gameflow phase immediately
			go func() {
				defer func() {
					if r := recover(); r != nil {
						// ignore initial phase panic
					}
				}()
				time.Sleep(500 * time.Millisecond)
				if client == nil {
					return
				}
				status, body, err := client.Request(http.MethodGet, "/lol-gameflow/v1/gameflow-phase", nil)
				if err == nil && status == http.StatusOK {
					var initialPhase string
					if err := json.Unmarshal(body, &initialPhase); err == nil && initialPhase != "" {
						m.handlePhaseChange(initialPhase, client)
					}
				}
			}()

			if err := m.listenWebSocket(port, token, client); err != nil {
				m.AddLog("warn", "与客户端连接断开: %v，准备重连...", err)
				m.setConnected(false, 0, nil)
				time.Sleep(3 * time.Second)
			}
		}
	}()
}

func (m *Manager) Stop() {
	close(m.stopChan)
}

func (m *Manager) listenWebSocket(port int, token string, client *lcu.Client) error {
	wsURL := fmt.Sprintf("wss://127.0.0.1:%d", port)
	auth := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s:%s", "riot", token)))

	header := http.Header{}
	header.Set("Authorization", "Basic "+auth)

	dialer := websocket.Dialer{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}

	u, _ := url.Parse(wsURL)
	conn, _, err := dialer.Dial(u.String(), header)
	if err != nil {
		return err
	}
	defer conn.Close()

	m.AddLog("success", "已成功订阅 LCU 事件总线，自动化引擎就绪！")

	// Subscribe to OnJsonApiEvent
	if err := conn.WriteMessage(websocket.TextMessage, []byte(`[5, "OnJsonApiEvent"]`)); err != nil {
		return err
	}

	type lcuEventMsg struct {
		Data      json.RawMessage `json:"data"`
		EventType string          `json:"event_type"`
		Uri       string          `json:"uri"`
	}

	for {
		msgType, message, err := conn.ReadMessage()
		if err != nil {
			return err
		}

		if msgType != websocket.TextMessage {
			continue
		}

		prefix := []byte(`[8,"OnJsonApiEvent",`)
		idx := bytes.Index(message, prefix)
		if idx == -1 {
			continue
		}

		rawJSON := message[idx+len(prefix) : len(message)-1]
		var evt lcuEventMsg
		if err := json.Unmarshal(rawJSON, &evt); err != nil {
			continue
		}

		// Gameflow Phase Listener
		if evt.Uri == "/lol-gameflow/v1/gameflow-phase" {
			var phase string
			if err := json.Unmarshal(evt.Data, &phase); err == nil {
				m.handlePhaseChange(phase, client)
			}
		}
	}
}

func (m *Manager) handlePhaseChange(phase string, client *lcu.Client) {
	defer func() {
		if r := recover(); r != nil {
			m.AddLog("error", "处理阶段转换异常: %v", r)
		}
	}()

	if client == nil {
		return
	}

	cfg := config.Get()
	m.setPhase(phase)
	m.AddLog("info", "游戏阶段状态转换 ➔ %s", phase)

	// Whenever leaving Lobby, cancel active auto-queue immediately
	m.mu.Lock()
	if phase != "Lobby" && m.queueCancel != nil {
		m.queueCancel()
		m.queueCancel = nil
		m.isSearching = false
	}
	if phase == "Lobby" && m.playAgainCancel != nil {
		m.playAgainCancel()
		m.playAgainCancel = nil
	}
	m.mu.Unlock()

	switch phase {
	case "Lobby":
		m.mu.Lock()
		m.isPlayAgainTriggered = false
		if m.queueCancel != nil {
			m.queueCancel()
			m.queueCancel = nil
		}
		if !cfg.AutoQueue {
			m.isSearching = false
			m.mu.Unlock()
			return
		}
		ctx, cancel := context.WithCancel(context.Background())
		m.queueCancel = cancel
		m.isSearching = true
		m.mu.Unlock()

		go func() {
			defer func() {
				if r := recover(); r != nil {
					m.AddLog("error", "智能排队协程异常: %v", r)
				}
				m.mu.Lock()
				m.isSearching = false
				m.queueCancel = nil
				m.mu.Unlock()
			}()
			m.AddLog("info", "[智能排队] 检测到处于房间中，将在 2 秒后确认全员就绪...")
			select {
			case <-ctx.Done():
				return
			case <-time.After(2 * time.Second):
			}
			m.executeAutoQueue(ctx, client)
		}()

	case "Matchmaking":
		m.mu.Lock()
		m.isSearching = true
		m.mu.Unlock()

	case "ReadyCheck":
		m.mu.Lock()
		m.isSearching = false
		m.mu.Unlock()

		if !cfg.AutoAccept {
			m.AddLog("info", "[对局就绪] 自动接受已关闭，请手动点击接受。")
			return
		}

		delay := cfg.AcceptDelayMs
		if delay < 0 {
			delay = 0
		}
		m.AddLog("warn", "[对局就绪] 发现匹配对局！将在 %d ms 后自动接受...", delay)

		go func() {
			defer func() {
				if r := recover(); r != nil {
					m.AddLog("error", "自动接受协程异常: %v", r)
				}
			}()
			time.Sleep(time.Duration(delay) * time.Millisecond)
			if client == nil {
				return
			}
			if err := client.AcceptMatch(); err != nil {
				m.AddLog("error", "[自动接受失败] %v", err)
			} else {
				m.AddLog("success", "[自动接受成功] >>> 已成功自动接受对局！<<<")
			}
		}()

	case "ChampSelect", "InProgress":
		m.mu.Lock()
		m.isSearching = false
		m.isPlayAgainTriggered = false
		m.mu.Unlock()
		go func() {
			defer func() {
				if r := recover(); r != nil {
					m.AddLog("error", "战绩评估协程异常: %v", r)
				}
			}()
			time.Sleep(1500 * time.Millisecond)
			m.AddLog("info", "[战绩分析] 进入选人/对局阶段，正在自动评估玩家最近10场战绩...")
			if res, err := m.GetMatchAnalysis(); err == nil && res != nil && res.HasData {
				m.AddLog("success", "[战绩分析] 玩家战绩与马匹评定已完成！(蓝方:%d人, 红方:%d人)", len(res.BlueTeam), len(res.RedTeam))
			}
		}()

	case "WaitingForStats":
		m.mu.Lock()
		m.isSearching = false
		m.mu.Unlock()
		m.AddLog("info", "[对局结算] 游戏已结束，正在等待客户端加载战绩数据...")

	case "PreEndOfGame":
		m.mu.Lock()
		m.isSearching = false
		m.mu.Unlock()
		if cfg.AutoPlayAgain {
			go func() {
				defer func() {
					if r := recover(); r != nil {
					}
				}()
				m.AddLog("info", "[对局结算] 检测到荣誉点赞界面，正在自动跳过...")
				if client != nil {
					_, _, _ = client.Request(http.MethodPost, "/lol-pre-end-of-game/v1/skip-pre-end-of-game", nil)
				}
			}()
		}

	case "EndOfGame":
		m.mu.Lock()
		m.isSearching = false
		if !m.isPlayAgainTriggered && cfg.AutoPlayAgain {
			m.isPlayAgainTriggered = true
			if m.playAgainCancel != nil {
				m.playAgainCancel()
			}
			ctx, cancel := context.WithCancel(context.Background())
			m.playAgainCancel = cancel
			m.mu.Unlock()
			go func() {
				defer func() {
					if r := recover(); r != nil {
						m.AddLog("error", "再来一局协程异常: %v", r)
					}
					m.mu.Lock()
					m.playAgainCancel = nil
					m.mu.Unlock()
				}()
				m.AddLog("info", "[对局结算] 已进入战绩结算界面，正在点击【再来一局】返回组队房间...")
				for i := 0; i < 8; i++ {
					select {
					case <-ctx.Done():
						return
					case <-time.After(1 * time.Second):
					}
					if client == nil {
						return
					}
					_, _, _ = client.Request(http.MethodPost, "/lol-pre-end-of-game/v1/skip-pre-end-of-game", nil)
					status, _, err := client.Request(http.MethodPost, "/lol-lobby/v2/play-again", nil)
					if err == nil && (status == http.StatusOK || status == http.StatusNoContent) {
						m.AddLog("success", "[对局结算] >>> 已成功点击【再来一局】，正在返回组队房间... <<<")
						return
					}
				}
				m.AddLog("warn", "[对局结算] 自动点击【再来一局】未响应，请手动点击。")
			}()
		} else {
			m.mu.Unlock()
		}

	default:
		m.mu.Lock()
		m.isSearching = false
		m.mu.Unlock()
	}
}

func (m *Manager) executeAutoQueue(ctx context.Context, client *lcu.Client) {
	defer func() {
		if r := recover(); r != nil {
			m.AddLog("error", "自动排队执行异常: %v", r)
		}
	}()

	if client == nil {
		return
	}

	cfg := config.Get()
	targetMembers := cfg.TargetMembers
	lastLoggedMembers := -1
	lastStatusTime := time.Time{}

	for i := 0; i < 45; i++ {
		select {
		case <-ctx.Done():
			return
		default:
		}

		st, err := client.GetLobbyStatus()
		if err != nil || st == nil {
			m.AddLog("info", "[智能排队] 已退出组队房间，已停止自动排队。")
			return
		}

		// 人数要求判定：若 targetMembers > 0，必须达到目标人数才开；0为不限人数
		countSatisfied := (targetMembers <= 0) || (st.MemberCount >= targetMembers)

		if countSatisfied && st.CanStartActivity {
			if targetMembers > 0 {
				m.AddLog("success", "[智能排队] >>> 房间已达目标人数 (%d/%d人) 且全员就绪！立即发起排队... <<<", st.MemberCount, targetMembers)
			} else {
				m.AddLog("success", "[智能排队] >>> 房间全员就绪 (%d人)！立即发起排队... <<<", st.MemberCount)
			}

			if err := client.StartMatchmaking(); err != nil {
				m.AddLog("error", "[智能排队] 发起排队失败: %v", err)
			} else {
				m.AddLog("success", "[智能排队] >>> 已成功进入排队队列！<<<")
			}
			return
		}

		// 限制日志刷屏频率：仅在人数变动或每隔10秒心跳时输出一次提示
		now := time.Now()
		shouldLog := (st.MemberCount != lastLoggedMembers) || now.Sub(lastStatusTime) >= 10*time.Second
		if shouldLog {
			lastLoggedMembers = st.MemberCount
			lastStatusTime = now

			if !countSatisfied {
				m.AddLog("info", "[智能排队] 目标人数 %d 人，当前房间 %d 人，等待队友进房... (%d/45秒)", targetMembers, st.MemberCount, i+1)
			} else {
				m.AddLog("info", "[智能排队] 房间人数已达标 (%d人)，正在等待全员就绪/选定分路... (%d/45秒)", st.MemberCount, i+1)
			}
		}

		select {
		case <-ctx.Done():
			return
		case <-time.After(1 * time.Second):
		}
	}

	m.AddLog("warn", "[智能排队超时] 等待房间人数或就绪条件超时 (45秒)，已取消本次自动排队。")
}

func (m *Manager) TriggerMatchmaking() error {
	m.mu.RLock()
	client := m.client
	m.mu.RUnlock()
	if client == nil {
		return fmt.Errorf("客户端未连接")
	}
	m.AddLog("info", "[手动排队] 正在发起寻找对局...")
	return client.StartMatchmaking()
}

func (m *Manager) CancelMatchmaking() error {
	m.mu.RLock()
	client := m.client
	m.mu.RUnlock()
	if client == nil {
		return fmt.Errorf("客户端未连接")
	}
	m.AddLog("info", "[手动取消] 正在取消寻找对局...")
	return client.StopMatchmaking()
}

func (m *Manager) TriggerAccept() error {
	m.mu.RLock()
	client := m.client
	m.mu.RUnlock()
	if client == nil {
		return fmt.Errorf("客户端未连接")
	}
	m.AddLog("info", "[手动接受] 正在点击接受对局...")
	return client.AcceptMatch()
}

func (m *Manager) GetMatchAnalysis() (*analysis.MatchAnalysisResult, error) {
	m.mu.RLock()
	analyzer := m.analyzer
	last := m.lastAnalysis
	m.mu.RUnlock()

	if analyzer == nil {
		return last, fmt.Errorf("客户端未连接")
	}

	res, err := analyzer.AnalyzeCurrentMatch()
	if err == nil && res != nil {
		m.mu.Lock()
		m.lastAnalysis = res
		m.mu.Unlock()
		if m.eventEmitter != nil {
			m.eventEmitter("analysis:update", res)
		}
		return res, nil
	}
	return last, err
}

func (m *Manager) SendChatMessage(msg string) error {
	m.mu.RLock()
	client := m.client
	m.mu.RUnlock()
	if client == nil {
		return fmt.Errorf("客户端未连接")
	}
	m.AddLog("info", "[手动发言] 正在发送战报到房间聊天: %s", msg)
	return client.SendChatMessage(msg)
}

func (m *Manager) GenerateHorseReport() string {
	m.mu.RLock()
	analyzer := m.analyzer
	last := m.lastAnalysis
	m.mu.RUnlock()
	if analyzer == nil || last == nil {
		return ""
	}
	return analyzer.GenerateHorseReport(last)
}
