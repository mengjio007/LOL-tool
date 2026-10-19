package analysis

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"lol/internal/lcu"
)

type ChampionStat struct {
	ChampionID   int     `json:"championId"`
	ChampionName string  `json:"championName"`
	Games        int     `json:"games"`
	Wins         int     `json:"wins"`
	WinRate      float64 `json:"winRate"`
}

type PlayerAnalysis struct {
	SummonerID   int64          `json:"summonerId"`
	Puuid        string         `json:"puuid"`
	SummonerName string         `json:"summonerName"`
	Team         string         `json:"team"` // "blue" or "red"
	IsSelf       bool           `json:"isSelf"`
	Role         string         `json:"role"`
	RankTier     string         `json:"rankTier"` // e.g. "钻石 II"
	TotalGames   int            `json:"totalGames"`
	Wins         int            `json:"wins"`
	Losses       int            `json:"losses"`
	WinRate      float64        `json:"winRate"` // 0.0 ~ 100.0
	AvgKills     float64        `json:"avgKills"`
	AvgDeaths    float64        `json:"avgDeaths"`
	AvgAssists   float64        `json:"avgAssists"`
	AvgKP        float64        `json:"avgKp"`
	KDA          float64        `json:"kda"`
	HorseTier    string         `json:"horseTier"` // "top", "mid", "bottom"
	HorseName    string         `json:"horseName"` // "上等马", "中等马", "下等马"
	HorseTag     string         `json:"horseTag"`  // e.g. "大爹通天代", "队伍突破口"
	Tags         []string       `json:"tags"`
	TopChampions []ChampionStat `json:"topChampions"`
}

type MatchAnalysisResult struct {
	Phase       string           `json:"phase"`
	HasData     bool             `json:"hasData"`
	BlueTeam    []PlayerAnalysis `json:"blueTeam"`
	RedTeam     []PlayerAnalysis `json:"redTeam"`
	LastUpdated string           `json:"lastUpdated"`
}

type Analyzer struct {
	client       *lcu.Client
	championsMu  sync.RWMutex
	championDict map[int]string
}

func NewAnalyzer(client *lcu.Client) *Analyzer {
	return &Analyzer{
		client:       client,
		championDict: make(map[int]string),
	}
}

// LoadChampions caches champion ID to Chinese name mapping
func (a *Analyzer) LoadChampions() {
	defer func() {
		if r := recover(); r != nil {
			// ignore panic in background champion loading
		}
	}()
	if a == nil || a.client == nil {
		return
	}
	status, body, err := a.client.Request(http.MethodGet, "/lol-game-data/assets/v1/champion-summary.json", nil)
	if err != nil || status != http.StatusOK {
		return
	}

	var champions []struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	}
	if err := json.Unmarshal(body, &champions); err == nil {
		a.championsMu.Lock()
		for _, c := range champions {
			a.championDict[c.ID] = c.Name
		}
		a.championsMu.Unlock()
	}
}

func (a *Analyzer) getChampionName(id int) string {
	if a == nil {
		return fmt.Sprintf("英雄%d", id)
	}
	a.championsMu.RLock()
	defer a.championsMu.RUnlock()
	if name, ok := a.championDict[id]; ok && name != "" {
		return name
	}
	return fmt.Sprintf("英雄%d", id)
}

func (a *Analyzer) getRankTier(puuid string) string {
	if a == nil || a.client == nil || puuid == "" {
		return "未定级"
	}
	status, body, err := a.client.Request(http.MethodGet, fmt.Sprintf("/lol-ranked/v1/ranked-stats/%s", puuid), nil)
	if err != nil || status != http.StatusOK {
		return "未定级"
	}

	var ranked struct {
		Queues []struct {
			QueueType    string `json:"queueType"`
			Tier         string `json:"tier"`
			Division     string `json:"division"`
			LeaguePoints int    `json:"leaguePoints"`
		} `json:"queues"`
	}
	if err := json.Unmarshal(body, &ranked); err != nil {
		return "未定级"
	}

	tierMap := map[string]string{
		"IRON": "黑铁", "BRONZE": "青铜", "SILVER": "白银", "GOLD": "黄金",
		"PLATINUM": "铂金", "EMERALD": "翡翠", "DIAMOND": "钻石",
		"MASTER": "大师", "GRANDMASTER": "宗师", "CHALLENGER": "王者",
	}

	for _, q := range ranked.Queues {
		if q.QueueType == "RANKED_SOLO_5x5" && q.Tier != "" && q.Tier != "NONE" {
			cnTier := tierMap[q.Tier]
			if cnTier == "" {
				cnTier = q.Tier
			}
			if q.Division != "" && q.Division != "NA" {
				return fmt.Sprintf("%s %s (%d LP)", cnTier, q.Division, q.LeaguePoints)
			}
			return fmt.Sprintf("%s (%d LP)", cnTier, q.LeaguePoints)
		}
	}
	return "无单排段位"
}

// resolvePlayerInfo retrieves the player's Riot ID (GameName#TagLine) or displayName
func (a *Analyzer) resolvePlayerInfo(summonerID int64, puuid string) (resolvedName string, resolvedPuuid string, resolvedID int64) {
	defer func() {
		if r := recover(); r != nil {
			resolvedName = ""
		}
	}()
	resolvedPuuid = puuid
	resolvedID = summonerID

	if a == nil || a.client == nil {
		return "", resolvedPuuid, resolvedID
	}

	// 1. Try v2 puuid endpoint if puuid is present
	if puuid != "" {
		status, body, err := a.client.Request(http.MethodGet, fmt.Sprintf("/lol-summoner/v2/summoners/puuid/%s", puuid), nil)
		if err == nil && status == http.StatusOK {
			var summ struct {
				SummonerID  int64  `json:"summonerId"`
				Puuid       string `json:"puuid"`
				DisplayName string `json:"displayName"`
				GameName    string `json:"gameName"`
				TagLine     string `json:"tagLine"`
			}
			if err := json.Unmarshal(body, &summ); err == nil {
				if summ.SummonerID > 0 && resolvedID == 0 {
					resolvedID = summ.SummonerID
				}
				if summ.GameName != "" {
					if summ.TagLine != "" {
						resolvedName = fmt.Sprintf("%s#%s", summ.GameName, summ.TagLine)
					} else {
						resolvedName = summ.GameName
					}
					return resolvedName, resolvedPuuid, resolvedID
				} else if summ.DisplayName != "" {
					resolvedName = summ.DisplayName
					return resolvedName, resolvedPuuid, resolvedID
				}
			}
		}
	}

	// 2. Try v1 summonerId endpoint if summonerID is present
	if summonerID > 0 {
		status, body, err := a.client.Request(http.MethodGet, fmt.Sprintf("/lol-summoner/v1/summoners/%d", summonerID), nil)
		if err == nil && status == http.StatusOK {
			var summ struct {
				SummonerID  int64  `json:"summonerId"`
				Puuid       string `json:"puuid"`
				DisplayName string `json:"displayName"`
				GameName    string `json:"gameName"`
				TagLine     string `json:"tagLine"`
			}
			if err := json.Unmarshal(body, &summ); err == nil {
				if summ.Puuid != "" && resolvedPuuid == "" {
					resolvedPuuid = summ.Puuid
				}
				if summ.GameName != "" {
					if summ.TagLine != "" {
						resolvedName = fmt.Sprintf("%s#%s", summ.GameName, summ.TagLine)
					} else {
						resolvedName = summ.GameName
					}
					return resolvedName, resolvedPuuid, resolvedID
				} else if summ.DisplayName != "" {
					resolvedName = summ.DisplayName
					return resolvedName, resolvedPuuid, resolvedID
				}
			}
		}
	}

	return "", resolvedPuuid, resolvedID
}

// AnalyzePlayer evaluates a single player's recent 10 games
func (a *Analyzer) AnalyzePlayer(summonerID int64, puuid, name, team, role string) (res PlayerAnalysis) {
	defer func() {
		if r := recover(); r != nil {
			res = PlayerAnalysis{
				SummonerID:   summonerID,
				Puuid:        puuid,
				SummonerName: name,
				Team:         team,
				Role:         role,
				RankTier:     "分析异常",
				Tags:         make([]string, 0),
				TopChampions: make([]ChampionStat, 0),
				HorseTier:    "mid",
				HorseName:    "中等马",
				HorseTag:     "数据异常",
			}
		}
	}()

	res = PlayerAnalysis{
		SummonerID:   summonerID,
		Puuid:        puuid,
		SummonerName: name,
		Team:         team,
		Role:         role,
		RankTier:     "查询中...",
		Tags:         make([]string, 0),
		TopChampions: make([]ChampionStat, 0),
		HorseTier:    "mid",
		HorseName:    "中等马",
		HorseTag:     "稳健发挥",
	}

	if a == nil || a.client == nil {
		res.HorseTag = "客户端未连接"
		return res
	}

	// Always resolve name if empty or generic placeholder
	if res.SummonerName == "" || res.SummonerName == "队友" || res.SummonerName == "对手" || res.SummonerName == "未知玩家" {
		rName, rPuuid, rID := a.resolvePlayerInfo(summonerID, puuid)
		if rName != "" {
			res.SummonerName = rName
		}
		if puuid == "" && rPuuid != "" {
			puuid = rPuuid
			res.Puuid = rPuuid
		}
		if res.SummonerID == 0 && rID > 0 {
			res.SummonerID = rID
		}
	}

	if puuid == "" {
		res.HorseTag = "未获取到ID"
		return res
	}

	// Fetch rank tier
	res.RankTier = a.getRankTier(puuid)

	// Fetch recent 20 matches (大样本检验)
	url := fmt.Sprintf("/lol-match-history/v1/products/lol/%s/matches?begIndex=0&endIndex=19", puuid)
	status, body, err := a.client.Request(http.MethodGet, url, nil)
	if err != nil || status != http.StatusOK {
		res.HorseTag = "战绩不公开或无记录"
		return res
	}

	var matchData struct {
		Games struct {
			Games []struct {
				GameMode              string `json:"gameMode"`
				Participants          []struct {
					ChampionID int `json:"championId"`
					Stats      struct {
						Win     bool `json:"win"`
						Kills   int  `json:"kills"`
						Deaths  int  `json:"deaths"`
						Assists int  `json:"assists"`
					} `json:"stats"`
				} `json:"participants"`
				ParticipantIdentities []struct {
					ParticipantID int `json:"participantId"`
					Player        struct {
						Puuid        string `json:"puuid"`
						GameName     string `json:"gameName"`
						TagLine      string `json:"tagLine"`
						SummonerName string `json:"summonerName"`
					} `json:"player"`
				} `json:"participantIdentities"`
			} `json:"games"`
		} `json:"games"`
	}

	if err := json.Unmarshal(body, &matchData); err != nil || len(matchData.Games.Games) == 0 {
		res.HorseTag = "暂无近期对局"
		return res
	}

	games := matchData.Games.Games
	totalKills, totalDeaths, totalAssists := 0, 0, 0
	champMap := make(map[int]*ChampionStat)
	streak := 0
	streakDecided := false

	for i, g := range games {
		targetPartID := -1
		for _, pi := range g.ParticipantIdentities {
			if pi.Player.Puuid == puuid {
				targetPartID = pi.ParticipantID
				// If name still unresolved, take from match history player record
				if res.SummonerName == "" || res.SummonerName == "队友" || res.SummonerName == "对手" || res.SummonerName == "未知玩家" {
					if pi.Player.GameName != "" {
						if pi.Player.TagLine != "" {
							res.SummonerName = fmt.Sprintf("%s#%s", pi.Player.GameName, pi.Player.TagLine)
						} else {
							res.SummonerName = pi.Player.GameName
						}
					} else if pi.Player.SummonerName != "" {
						res.SummonerName = pi.Player.SummonerName
					}
				}
				break
			}
		}

		if targetPartID == -1 && len(g.Participants) > 0 {
			targetPartID = 1
		}

		for idx, p := range g.Participants {
			if idx+1 == targetPartID || len(g.Participants) == 1 {
				res.TotalGames++
				if p.Stats.Win {
					res.Wins++
					if !streakDecided {
						if streak >= 0 {
							streak++
						} else {
							streakDecided = true
						}
					}
				} else {
					res.Losses++
					if !streakDecided {
						if streak <= 0 {
							streak--
						} else {
							streakDecided = true
						}
					}
				}

				totalKills += p.Stats.Kills
				totalDeaths += p.Stats.Deaths
				totalAssists += p.Stats.Assists

				// Record champion
				cStat, exists := champMap[p.ChampionID]
				if !exists {
					cStat = &ChampionStat{
						ChampionID:   p.ChampionID,
						ChampionName: a.getChampionName(p.ChampionID),
					}
					champMap[p.ChampionID] = cStat
				}
				cStat.Games++
				if p.Stats.Win {
					cStat.Wins++
				}
				break
			}
		}
		if i >= 19 {
			break
		}
	}

	if res.TotalGames > 0 {
		res.WinRate = float64(res.Wins) / float64(res.TotalGames) * 100.0
		res.AvgKills = float64(totalKills) / float64(res.TotalGames)
		res.AvgDeaths = float64(totalDeaths) / float64(res.TotalGames)
		res.AvgAssists = float64(totalAssists) / float64(res.TotalGames)
		res.AvgKP = res.AvgKills + res.AvgAssists
		if totalDeaths > 0 {
			res.KDA = float64(totalKills+totalAssists) / float64(totalDeaths)
		} else {
			res.KDA = float64(totalKills + totalAssists)
		}
	}

	// Top champions
	champList := make([]ChampionStat, 0, len(champMap))
	for _, cs := range champMap {
		if cs.Games > 0 {
			cs.WinRate = float64(cs.Wins) / float64(cs.Games) * 100.0
		}
		champList = append(champList, *cs)
	}
	sort.Slice(champList, func(i, j int) bool {
		return champList[i].Games > champList[j].Games
	})
	if len(champList) > 3 {
		champList = champList[:3]
	}
	res.TopChampions = champList

	// Horse Rating Evaluation (海克斯大乱斗专属规则)
	tags := make([]string, 0)
	if streak >= 3 {
		tags = append(tags, fmt.Sprintf("%d连胜 🔥", streak))
	} else if streak <= -3 {
		tags = append(tags, fmt.Sprintf("%d连败 ⚠️", -streak))
	}

	if len(champList) > 0 && champList[0].Games >= 3 {
		tags = append(tags, fmt.Sprintf("常玩%s", champList[0].ChampionName))
	}

	isHighRank := strings.Contains(res.RankTier, "王者") ||
		strings.Contains(res.RankTier, "宗师") ||
		strings.Contains(res.RankTier, "大师") ||
		strings.Contains(res.RankTier, "钻石")

	// 评级逻辑（专为海克斯大乱斗量身定制）：
	// 1. 上等马 (Top Horse):
	//    - 胜率 >= 65% 必须至少经历 15~20 场大样本检验（防止运气好连赢几把虚高）
	//    - 高段位玩家单排段位降维打击
	//    - 极度强力的团战发动机（高参团率 + 高胜率）
	//    - 手感滚烫的真大连胜
	if (res.TotalGames >= 15 && res.WinRate >= 65.0) ||
		(isHighRank && res.WinRate >= 50.0 && res.AvgKP >= 22.0) ||
		(res.KDA >= 3.2 && res.AvgKP >= 28.0 && res.WinRate >= 55.0 && res.TotalGames >= 10) ||
		(streak >= 4 && res.WinRate >= 60.0 && res.TotalGames >= 10) {
		res.HorseTier = "top"
		res.HorseName = "上等马"
		if res.TotalGames >= 18 && res.WinRate >= 70.0 {
			res.HorseTag = "通天代/乱斗大爹"
		} else if isHighRank {
			res.HorseTag = "高分段降维打击"
		} else if res.AvgKP >= 30.0 {
			res.HorseTag = "团战发动机/输出拉满"
		} else {
			res.HorseTag = "大样本稳健上等马"
		}
	} else if (res.TotalGames >= 12 && res.WinRate <= 35.0) ||
		(res.AvgDeaths >= 9.0 && res.AvgKP <= 18.0 && res.WinRate <= 45.0) ||
		(streak <= -4 && res.WinRate <= 45.0) ||
		(res.AvgKP <= 14.0 && res.WinRate <= 40.0 && res.TotalGames >= 8) {
		res.HorseTier = "bottom"
		res.HorseName = "下等马"
		if res.AvgDeaths >= 9.0 && res.AvgKP <= 18.0 {
			res.HorseTag = "纯送提款机/无效阵亡"
		} else if streak <= -4 {
			res.HorseTag = "连败破防/状态崩盘"
		} else if res.AvgKP <= 14.0 {
			res.HorseTag = "逛街OB怪/零参团"
		} else {
			res.HorseTag = "胜率低迷/乱斗黑洞"
		}
	} else {
		res.HorseTier = "mid"
		res.HorseName = "中等马"
		// 在大乱斗中，死得多但参团极高，是极具价值的肉身开团手
		if res.AvgDeaths >= 8.0 && res.AvgKP >= 26.0 {
			res.HorseTag = "敢打敢开/肉身献祭流"
		} else if res.KDA >= 2.5 {
			res.HorseTag = "表现稳健/团队基石"
		} else {
			res.HorseTag = "均势发挥/常规选手"
		}
	}

	res.Tags = tags
	return res
}

// AnalyzeCurrentMatch inspects champ select or live in-progress game
func (a *Analyzer) AnalyzeCurrentMatch() (*MatchAnalysisResult, error) {
	if a.client == nil {
		return nil, fmt.Errorf("LCU客户端未连接")
	}

	a.LoadChampions()

	// Get local summoner info to accurately detect ally team vs enemy team
	localPuuid := ""
	var localSummID int64
	if curr, err := a.client.GetCurrentSummoner(); err == nil && curr != nil {
		localPuuid = curr.Puuid
		localSummID = curr.SummonerID
	}

	result := &MatchAnalysisResult{
		HasData:     false,
		BlueTeam:    make([]PlayerAnalysis, 0),
		RedTeam:     make([]PlayerAnalysis, 0),
		LastUpdated: time.Now().Format("15:04:05"),
	}

	// 1. Try Champ Select
	csStatus, csBody, err := a.client.Request(http.MethodGet, "/lol-champ-select/v1/session", nil)
	if err == nil && csStatus == http.StatusOK {
		var cs struct {
			MyTeam []struct {
				SummonerID       int64  `json:"summonerId"`
				Puuid            string `json:"puuid"`
				AssignedPosition string `json:"assignedPosition"`
			} `json:"myTeam"`
			TheirTeam []struct {
				SummonerID       int64  `json:"summonerId"`
				Puuid            string `json:"puuid"`
				AssignedPosition string `json:"assignedPosition"`
			} `json:"theirTeam"`
		}

		if err := json.Unmarshal(csBody, &cs); err == nil && len(cs.MyTeam) > 0 {
			result.Phase = "ChampSelect"
			result.HasData = true

			// Check if myTeam members have missing puuids (e.g. ranked solo queue anonymity)
			hasMissingPuuid := false
			for _, m := range cs.MyTeam {
				if m.SummonerID == 0 && m.Puuid == "" {
					hasMissingPuuid = true
					break
				}
			}

			type ChatMember struct {
				Puuid    string `json:"puuid"`
				GameName string `json:"game_name"`
				GameTag  string `json:"game_tag"`
			}
			chatMembers := make([]ChatMember, 0)

			if hasMissingPuuid {
				cStatus, cBody, cErr := a.client.Request(http.MethodGet, "/lol-chat/v1/conversations", nil)
				if cErr == nil && cStatus == http.StatusOK {
					var convs []struct {
						ID   string `json:"id"`
						Type string `json:"type"`
					}
					if json.Unmarshal(cBody, &convs) == nil {
						for _, c := range convs {
							if c.Type == "championSelect" {
								pStatus, pBody, pErr := a.client.Request(http.MethodGet, fmt.Sprintf("/lol-chat/v1/conversations/%s/participants", c.ID), nil)
								if pErr == nil && pStatus == http.StatusOK {
									json.Unmarshal(pBody, &chatMembers)
								}
								break
							}
						}
					}
				}
			}

			var wg sync.WaitGroup
			var mu sync.Mutex

			if len(chatMembers) > 0 {
				for _, cm := range chatMembers {
					if cm.Puuid != "" {
						wg.Add(1)
						go func(pId, gName, gTag string) {
							defer wg.Done()
							defer func() {
								if r := recover(); r != nil {
									// ignore individual player panic
								}
							}()
							fullName := gName
							if gName != "" && gTag != "" {
								fullName = fmt.Sprintf("%s#%s", gName, gTag)
							}
							p := a.AnalyzePlayer(0, pId, fullName, "blue", "")
							if pId == localPuuid {
								p.IsSelf = true
							}
							mu.Lock()
							result.BlueTeam = append(result.BlueTeam, p)
							mu.Unlock()
						}(cm.Puuid, cm.GameName, cm.GameTag)
					}
				}
			} else {
				// Analyze My Team (Blue / Teammates)
				for _, m := range cs.MyTeam {
					if m.SummonerID > 0 || m.Puuid != "" {
						wg.Add(1)
						go func(sId int64, pId, role string) {
							defer wg.Done()
							defer func() {
								if r := recover(); r != nil {
								}
							}()
							p := a.AnalyzePlayer(sId, pId, "", "blue", role)
							if (pId != "" && pId == localPuuid) || (sId > 0 && sId == localSummID) {
								p.IsSelf = true
							}
							mu.Lock()
							result.BlueTeam = append(result.BlueTeam, p)
							mu.Unlock()
						}(m.SummonerID, m.Puuid, m.AssignedPosition)
					}
				}
			}

			// Analyze Their Team (Red / Opponents if visible)
			for _, m := range cs.TheirTeam {
				if m.SummonerID > 0 || m.Puuid != "" {
					wg.Add(1)
					go func(sId int64, pId, role string) {
						defer wg.Done()
						defer func() {
							if r := recover(); r != nil {
							}
						}()
						p := a.AnalyzePlayer(sId, pId, "", "red", role)
						mu.Lock()
						result.RedTeam = append(result.RedTeam, p)
						mu.Unlock()
					}(m.SummonerID, m.Puuid, m.AssignedPosition)
				}
			}

			wg.Wait()
			return result, nil
		}
	}

	// 2. Try In-Game Gameflow Session
	gfStatus, gfBody, err := a.client.Request(http.MethodGet, "/lol-gameflow/v1/session", nil)
	if err == nil && gfStatus == http.StatusOK {
		var gf struct {
			Phase    string `json:"phase"`
			GameData struct {
				TeamOne []struct {
					SummonerID   int64  `json:"summonerId"`
					SummonerName string `json:"summonerName"`
					Puuid        string `json:"puuid"`
					SelectedRole string `json:"selectedRole"`
				} `json:"teamOne"`
				TeamTwo []struct {
					SummonerID   int64  `json:"summonerId"`
					SummonerName string `json:"summonerName"`
					Puuid        string `json:"puuid"`
					SelectedRole string `json:"selectedRole"`
				} `json:"teamTwo"`
			} `json:"gameData"`
		}

		if err := json.Unmarshal(gfBody, &gf); err == nil && (len(gf.GameData.TeamOne) > 0 || len(gf.GameData.TeamTwo) > 0) {
			result.Phase = gf.Phase
			result.HasData = true

			// Check which team contains the local player:
			// If local player is in TeamTwo, then TeamTwo is 我方 (BlueTeam / "blue") and TeamOne is 敌方 (RedTeam / "red")
			// If local player is in TeamOne (or default), TeamOne is 我方 (BlueTeam / "blue") and TeamTwo is 敌方 (RedTeam / "red")
			isLocalInTeamTwo := false
			for _, p := range gf.GameData.TeamTwo {
				if (localPuuid != "" && p.Puuid == localPuuid) ||
					(localSummID > 0 && p.SummonerID == localSummID) {
					isLocalInTeamTwo = true
					break
				}
			}

			teamOneRoleTag := "blue"
			teamTwoRoleTag := "red"
			if isLocalInTeamTwo {
				teamOneRoleTag = "red"
				teamTwoRoleTag = "blue"
			}

			var wg sync.WaitGroup
			var mu sync.Mutex

			for _, p := range gf.GameData.TeamOne {
				if p.SummonerID > 0 || p.Puuid != "" {
					wg.Add(1)
					go func(sId int64, puuid, name, role string) {
						defer wg.Done()
						defer func() {
							if r := recover(); r != nil {
							}
						}()
						item := a.AnalyzePlayer(sId, puuid, name, teamOneRoleTag, role)
						if (puuid != "" && puuid == localPuuid) || (sId > 0 && sId == localSummID) {
							item.IsSelf = true
						}
						mu.Lock()
						if teamOneRoleTag == "blue" {
							result.BlueTeam = append(result.BlueTeam, item)
						} else {
							result.RedTeam = append(result.RedTeam, item)
						}
						mu.Unlock()
					}(p.SummonerID, p.Puuid, p.SummonerName, p.SelectedRole)
				}
			}

			for _, p := range gf.GameData.TeamTwo {
				if p.SummonerID > 0 || p.Puuid != "" {
					wg.Add(1)
					go func(sId int64, puuid, name, role string) {
						defer wg.Done()
						defer func() {
							if r := recover(); r != nil {
							}
						}()
						item := a.AnalyzePlayer(sId, puuid, name, teamTwoRoleTag, role)
						if (puuid != "" && puuid == localPuuid) || (sId > 0 && sId == localSummID) {
							item.IsSelf = true
						}
						mu.Lock()
						if teamTwoRoleTag == "blue" {
							result.BlueTeam = append(result.BlueTeam, item)
						} else {
							result.RedTeam = append(result.RedTeam, item)
						}
						mu.Unlock()
					}(p.SummonerID, p.Puuid, p.SummonerName, p.SelectedRole)
				}
			}

			wg.Wait()
			return result, nil
		}
	}

	return result, nil
}

// GenerateHorseReport generates a clean, concise team horse analysis summary string
func (a *Analyzer) GenerateHorseReport(res *MatchAnalysisResult) (report string) {
	defer func() {
		if r := recover(); r != nil {
			report = "【马匹战报】解析异常"
		}
	}()
	if res == nil || !res.HasData {
		return "【马匹战报】暂无对局数据"
	}

	var allyBottom []string
	var allyTop []string
	var enemyTop []string
	var enemyBottom []string

	for _, p := range res.BlueTeam {
		name := p.SummonerName
		if idx := strings.Index(name, "#"); idx != -1 {
			name = name[:idx]
		}
		if p.HorseTier == "bottom" && !p.IsSelf {
			allyBottom = append(allyBottom, fmt.Sprintf("%s(%s,胜率%.0f%%)", name, p.HorseTag, p.WinRate))
		} else if p.HorseTier == "top" && !p.IsSelf {
			allyTop = append(allyTop, fmt.Sprintf("%s(%s)", name, p.HorseTag))
		}
	}

	for _, p := range res.RedTeam {
		name := p.SummonerName
		if idx := strings.Index(name, "#"); idx != -1 {
			name = name[:idx]
		}
		if p.HorseTier == "top" {
			enemyTop = append(enemyTop, fmt.Sprintf("%s(%s,%s)", name, p.RankTier, p.HorseTag))
		} else if p.HorseTier == "bottom" {
			enemyBottom = append(enemyBottom, fmt.Sprintf("%s(突破口)", name))
		}
	}

	var parts []string
	if len(allyBottom) > 0 {
		parts = append(parts, fmt.Sprintf("⚠️我方注意防崩: %s", strings.Join(allyBottom, "; ")))
	}
	if len(enemyTop) > 0 {
		parts = append(parts, fmt.Sprintf("🚨敌方通天代: %s", strings.Join(enemyTop, "; ")))
	}
	if len(enemyBottom) > 0 {
		parts = append(parts, fmt.Sprintf("🎯敌方突破口: %s", strings.Join(enemyBottom, "; ")))
	}
	if len(allyTop) > 0 {
		parts = append(parts, fmt.Sprintf("💪我方核心: %s", strings.Join(allyTop, "; ")))
	}

	if len(parts) == 0 {
		return "【马匹分析】双方均为均势中等马，正常稳健发挥！"
	}
	return "【马匹战报】" + strings.Join(parts, " | ")
}
