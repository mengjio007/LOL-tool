package livegame

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type DeathInfo struct {
	IsDead       bool    `json:"isDead"`
	RespawnTimer float64 `json:"respawnTimer"`
	ChampionName string  `json:"championName"`
	SummonerName string  `json:"summonerName"`
}

type LiveMonitor struct {
	client     *http.Client
	running    bool
	stopCh     chan struct{}
	mu         sync.Mutex
	wasDead    bool
	onDeath    func(info DeathInfo)
	onRespawn  func()
	onTick     func(info DeathInfo)
	activeName string
}

func NewLiveMonitor() *LiveMonitor {
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	return &LiveMonitor{
		client: &http.Client{
			Transport: tr,
			Timeout:   1200 * time.Millisecond,
		},
		stopCh: make(chan struct{}),
	}
}

func (m *LiveMonitor) SetCallbacks(onDeath func(info DeathInfo), onRespawn func(), onTick func(info DeathInfo)) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.onDeath = onDeath
	m.onRespawn = onRespawn
	m.onTick = onTick
}

func (m *LiveMonitor) Start() {
	m.mu.Lock()
	if m.running {
		m.mu.Unlock()
		return
	}
	m.running = true
	m.stopCh = make(chan struct{})
	m.wasDead = false
	m.mu.Unlock()

	go m.pollLoop()
}

func (m *LiveMonitor) Stop() {
	m.mu.Lock()
	if !m.running {
		m.mu.Unlock()
		return
	}
	m.running = false
	close(m.stopCh)
	m.mu.Unlock()
}

func (m *LiveMonitor) pollLoop() {
	ticker := time.NewTicker(600 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-m.stopCh:
			return
		case <-ticker.C:
			m.checkState()
		}
	}
}

func (m *LiveMonitor) checkState() {
	// 1. 获取当前玩家名字 (若尚未缓存)
	if m.activeName == "" {
		resp, err := m.client.Get("https://127.0.0.1:2999/liveclientdata/activeplayer")
		if err == nil && resp.StatusCode == http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			var act struct {
				SummonerName   string `json:"summonerName"`
				RiotIdGameName string `json:"riotIdGameName"`
			}
			if err := json.Unmarshal(body, &act); err == nil {
				if act.RiotIdGameName != "" {
					m.activeName = act.RiotIdGameName
				} else {
					m.activeName = act.SummonerName
				}
			}
		}
	}

	// 2. 获取 playerlist
	resp, err := m.client.Get("https://127.0.0.1:2999/liveclientdata/playerlist")
	if err != nil || resp.StatusCode != http.StatusOK {
		if resp != nil {
			resp.Body.Close()
		}
		return
	}
	body, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		return
	}

	var players []struct {
		SummonerName string  `json:"summonerName"`
		ChampionName string  `json:"championName"`
		IsDead       bool    `json:"isDead"`
		RespawnTimer float64 `json:"respawnTimer"`
	}
	if err := json.Unmarshal(body, &players); err != nil || len(players) == 0 {
		return
	}

	var mePlayer *struct {
		SummonerName string  `json:"summonerName"`
		ChampionName string  `json:"championName"`
		IsDead       bool    `json:"isDead"`
		RespawnTimer float64 `json:"respawnTimer"`
	}

	// 匹配自己
	if m.activeName != "" {
		for i := range players {
			p := &players[i]
			if strings.EqualFold(p.SummonerName, m.activeName) || strings.Contains(p.SummonerName, m.activeName) {
				mePlayer = p
				break
			}
		}
	}

	// 如果按名字找不到（或单人对局），降级取第一个
	if mePlayer == nil && len(players) > 0 {
		mePlayer = &players[0]
	}

	if mePlayer == nil {
		return
	}

	isDead := mePlayer.IsDead
	respawnTimer := mePlayer.RespawnTimer

	// 状态机翻转处理
	m.mu.Lock()
	wasDead := m.wasDead
	onDeath := m.onDeath
	onRespawn := m.onRespawn
	onTick := m.onTick
	m.mu.Unlock()

	info := DeathInfo{
		IsDead:       isDead,
		RespawnTimer: respawnTimer,
		ChampionName: mePlayer.ChampionName,
		SummonerName: mePlayer.SummonerName,
	}

	if isDead && !wasDead {
		// 死亡发生瞬间
		m.mu.Lock()
		m.wasDead = true
		m.mu.Unlock()
		if onDeath != nil {
			onDeath(info)
		}
	} else if wasDead && (!isDead || respawnTimer <= 0) {
		// 复活瞬间
		m.mu.Lock()
		m.wasDead = false
		m.mu.Unlock()
		if onRespawn != nil {
			onRespawn()
		}
	} else if wasDead && isDead {
		// 持续死亡中：派发倒计时 tick
		if onTick != nil {
			onTick(info)
		}
	}
}

// GetRandomVideoFromFolder 从指定文件夹中随机选取一个视频文件
func GetRandomVideoFromFolder(folder string) (string, error) {
	if folder == "" {
		return "", fmt.Errorf("视频文件夹路径为空")
	}

	entries, err := os.ReadDir(folder)
	if err != nil {
		return "", fmt.Errorf("读取视频目录失败: %w", err)
	}

	validExts := map[string]bool{
		".mp4":  true,
		".webm": true,
		".mkv":  true,
		".mov":  true,
		".avi":  true,
	}

	var videoFiles []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(e.Name()))
		if validExts[ext] {
			videoFiles = append(videoFiles, filepath.Join(folder, e.Name()))
		}
	}

	if len(videoFiles) == 0 {
		return "", fmt.Errorf("目录中未找到支持的视频文件 (.mp4/.webm)")
	}

	rand.Seed(time.Now().UnixNano())
	chosen := videoFiles[rand.Intn(len(videoFiles))]
	return chosen, nil
}
