package lcu

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const authUsername = "riot"

type Client struct {
	Port       int
	Token      string
	httpClient *http.Client
}

func NewClient(port int, token string) *Client {
	return &Client{
		Port:  port,
		Token: token,
		httpClient: &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
			},
			Timeout: 5 * time.Second,
		},
	}
}

func (c *Client) Request(method, endpoint string, body []byte) (statusCode int, respBytes []byte, err error) {
	defer func() {
		if r := recover(); r != nil {
			statusCode = 0
			respBytes = nil
			err = fmt.Errorf("LCU 请求异常: %v", r)
		}
	}()

	if c == nil || c.httpClient == nil {
		return 0, nil, fmt.Errorf("LCU 客户端未初始化")
	}

	targetURL := fmt.Sprintf("https://127.0.0.1:%d%s", c.Port, endpoint)
	var reqBody io.Reader
	if body != nil {
		reqBody = bytes.NewReader(body)
	}

	req, err := http.NewRequest(method, targetURL, reqBody)
	if err != nil {
		return 0, nil, err
	}

	auth := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s:%s", authUsername, c.Token)))
	req.Header.Set("Authorization", "Basic "+auth)
	req.Header.Set("Content-Type", "application/json")

	httpResp, err := c.httpClient.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer httpResp.Body.Close()

	bodyBytes, err := io.ReadAll(httpResp.Body)
	return httpResp.StatusCode, bodyBytes, err
}

type SummonerInfo struct {
	SummonerID    int64  `json:"summonerId"`
	Puuid         string `json:"puuid"`
	DisplayName   string `json:"displayName"`
	GameName      string `json:"gameName"`
	TagLine       string `json:"tagLine"`
	ProfileIconID int    `json:"profileIconId"`
	SummonerLevel int    `json:"summonerLevel"`
}

// GetCurrentSummoner fetches current player profile
func (c *Client) GetCurrentSummoner() (*SummonerInfo, error) {
	status, body, err := c.Request(http.MethodGet, "/lol-summoner/v1/current-summoner", nil)
	if err != nil || status != http.StatusOK {
		return nil, fmt.Errorf("获取召唤师信息失败 (HTTP %d): %w", status, err)
	}
	var info SummonerInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return nil, err
	}
	if info.DisplayName == "" && info.GameName != "" {
		if info.TagLine != "" {
			info.DisplayName = fmt.Sprintf("%s#%s", info.GameName, info.TagLine)
		} else {
			info.DisplayName = info.GameName
		}
	}
	return &info, nil
}

// AcceptMatch accepts ready check
func (c *Client) AcceptMatch() error {
	status, body, err := c.Request(http.MethodPost, "/lol-matchmaking/v1/ready-check/accept", nil)
	if err != nil {
		return err
	}
	if status == http.StatusOK || status == http.StatusNoContent {
		return nil
	}
	return fmt.Errorf("接受失败，状态码: %d, 响应: %s", status, string(body))
}

type LobbyStatus struct {
	CanStartActivity bool `json:"canStartActivity"`
	MemberCount      int  `json:"memberCount"`
}

// GetLobbyStatus returns current lobby readiness and member count
func (c *Client) GetLobbyStatus() (*LobbyStatus, error) {
	status, body, err := c.Request(http.MethodGet, "/lol-lobby/v2/lobby", nil)
	if err != nil || status != http.StatusOK {
		return nil, err
	}

	var lobby struct {
		CanStartActivity bool `json:"canStartActivity"`
		Members          []struct {
			SummonerID int64 `json:"summonerId"`
		} `json:"members"`
	}
	if err := json.Unmarshal(body, &lobby); err != nil {
		return nil, err
	}
	return &LobbyStatus{
		CanStartActivity: lobby.CanStartActivity,
		MemberCount:      len(lobby.Members),
	}, nil
}

// CheckLobbyReady returns whether the lobby is ready to start matchmaking
func (c *Client) CheckLobbyReady() (bool, error) {
	st, err := c.GetLobbyStatus()
	if err != nil {
		return false, err
	}
	return st.CanStartActivity, nil
}

// StartMatchmaking searches for a match
func (c *Client) StartMatchmaking() error {
	sStatus, _, sErr := c.Request(http.MethodPost, "/lol-lobby/v2/lobby/matchmaking/search", nil)
	if sErr == nil && (sStatus == http.StatusOK || sStatus == http.StatusNoContent) {
		return nil
	}
	// Fallback to /lol-matchmaking/v1/search
	sStatus, sBody, sErr := c.Request(http.MethodPost, "/lol-matchmaking/v1/search", nil)
	if sErr == nil && (sStatus == http.StatusOK || sStatus == http.StatusNoContent) {
		return nil
	}
	return fmt.Errorf("发起排队失败 (HTTP %d): %s", sStatus, string(sBody))
}

// StopMatchmaking cancels searching for a match
func (c *Client) StopMatchmaking() error {
	sStatus, _, sErr := c.Request(http.MethodDelete, "/lol-lobby/v2/lobby/matchmaking/search", nil)
	if sErr == nil && (sStatus == http.StatusOK || sStatus == http.StatusNoContent) {
		return nil
	}
	sStatus, sBody, sErr := c.Request(http.MethodDelete, "/lol-matchmaking/v1/search", nil)
	if sErr == nil && (sStatus == http.StatusOK || sStatus == http.StatusNoContent) {
		return nil
	}
	return fmt.Errorf("取消排队失败 (HTTP %d): %s", sStatus, string(sBody))
}

// PlayAgain skips end-of-game screens and clicks play again
// PlayAgain skips honor screen and requests to return to lobby with party
func (c *Client) PlayAgain() error {
	// 1. 跳过荣誉点赞/过渡动画
	_, _, _ = c.Request(http.MethodPost, "/lol-pre-end-of-game/v1/skip-pre-end-of-game", nil)

	// 2. 点击“再来一局”返回组队房间
	// 注意：切勿调用 /lol-end-of-game/v1/state/dismiss-stats，因为 dismiss-stats 是退出房间回到主页！
	status, body, err := c.Request(http.MethodPost, "/lol-lobby/v2/play-again", nil)
	if err == nil && (status == http.StatusOK || status == http.StatusNoContent) {
		return nil
	}
	return fmt.Errorf("返回房间未就绪 (HTTP %d): %s", status, string(body))
}

// SendChatMessage sends a message to an active chat conversation (e.g. championSelect, customGame, postGame)
func (c *Client) SendChatMessage(message string) error {
	status, body, err := c.Request(http.MethodGet, "/lol-chat/v1/conversations", nil)
	if err != nil || status != http.StatusOK {
		return fmt.Errorf("获取聊天列表失败 (HTTP %d): %w", status, err)
	}

	var convs []struct {
		ID   string `json:"id"`
		Type string `json:"type"`
	}
	if err := json.Unmarshal(body, &convs); err != nil {
		return err
	}

	targetID := ""
	for _, conv := range convs {
		if conv.Type == "championSelect" {
			targetID = conv.ID
			break
		}
	}
	if targetID == "" {
		for _, conv := range convs {
			if conv.Type == "postGame" || conv.Type == "customGame" {
				targetID = conv.ID
				break
			}
		}
	}

	if targetID == "" {
		return fmt.Errorf("当前不在选人房间或结算房间中，请使用一键复制在游戏内粘贴")
	}

	payload := map[string]string{
		"body": message,
		"type": "chat",
	}
	reqBytes, _ := json.Marshal(payload)
	endpoint := fmt.Sprintf("/lol-chat/v1/conversations/%s/messages", targetID)
	sendCode, sendResp, err := c.Request(http.MethodPost, endpoint, reqBytes)
	if err != nil {
		return err
	}
	if sendCode != http.StatusOK && sendCode != http.StatusCreated && sendCode != http.StatusNoContent {
		return fmt.Errorf("发送失败 (HTTP %d): %s", sendCode, string(sendResp))
	}
	return nil
}
