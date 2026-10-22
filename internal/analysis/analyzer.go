package analysis

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
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
	SummonerID       int64          `json:"summonerId"`
	Puuid            string         `json:"puuid"`
	SummonerName     string         `json:"summonerName"`
	Team             string         `json:"team"` // "blue" or "red"
	IsSelf           bool           `json:"isSelf"`
	Role             string         `json:"role"`
	RankTier         string         `json:"rankTier"` // e.g. "钻石 II"
	TotalGames       int            `json:"totalGames"`
	Wins             int            `json:"wins"`
	Losses           int            `json:"losses"`
	WinRate          float64        `json:"winRate"` // 0.0 ~ 100.0
	AvgKills         float64        `json:"avgKills"`
	AvgDeaths        float64        `json:"avgDeaths"`
	AvgAssists       float64        `json:"avgAssists"`
	AvgKP            float64        `json:"avgKp"`
	KDA              float64        `json:"kda"`

	// 6-Tier Architecture & Composite Score
	Score            int            `json:"score"`           // 综合战力分，基准 100
	HorseTier        string         `json:"horseTier"`       // "s_plus", "s", "a", "b", "c", "d"
	HorseRank        string         `json:"horseRank"`       // "S+ 特等", "S 上等", "A 中等", "B 次等", "C 下等", "D 劣等"
	HorseName        string         `json:"horseName"`       // "降维通天代", "全场掌舵者", "中流砥柱", "状态摇摆者", "红温突破口", "下水道纯牛马"
	HorseTag         string         `json:"horseTag"`        // e.g. "输出占比35%/五杀收割"

	// Tactical & Combat Metrics
	AvgDamage        int            `json:"avgDamage"`       // 场均输出伤害
	AvgDamageTaken   int            `json:"avgDamageTaken"`  // 场均承伤
	AvgMitigated     int            `json:"avgMitigated"`    // 场均伤害减免
	AvgHeal          int            `json:"avgHeal"`         // 场均治疗与护盾
	AvgTurretDamage  int            `json:"avgTurretDamage"` // 场均拆塔伤害
	DamageShare      float64        `json:"damageShare"`     // 全队伤害占比 (0.0 ~ 100.0)
	DamageTakenShare float64        `json:"damageTakenShare"`// 全队承伤占比 (0.0 ~ 100.0)
	HealShare        float64        `json:"healShare"`       // 全队治疗占比 (0.0 ~ 100.0)
	GuardianRatio    float64        `json:"guardianRatio"`   // 守护者系列出装占比 (0.0 ~ 100.0)
	PentaCount       int            `json:"pentaCount"`      // 近期五杀次数
	QuadraCount      int            `json:"quadraCount"`     // 近期四杀次数
	TripleCount      int            `json:"tripleCount"`     // 近期三杀次数
	Streak           int            `json:"streak"`          // 当前连胜(>0)或连败(<0)
	IsTilted         bool           `json:"isTilted"`        // 是否当天连败破防

	Tags             []string       `json:"tags"`
	TopChampions     []ChampionStat `json:"topChampions"`
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
				GameMode     string `json:"gameMode"`
				GameDuration int    `json:"gameDuration"`
				Participants []struct {
					ParticipantID int `json:"participantId"`
					TeamID        int `json:"teamId"`
					ChampionID    int `json:"championId"`
					Stats         struct {
						Win                         bool `json:"win"`
						Kills                       int  `json:"kills"`
						Deaths                      int  `json:"deaths"`
						Assists                     int  `json:"assists"`
						TotalDamageDealtToChampions int  `json:"totalDamageDealtToChampions"`
						TotalDamageTaken            int  `json:"totalDamageTaken"`
						DamageSelfMitigated         int  `json:"damageSelfMitigated"`
						TotalHeal                   int  `json:"totalHeal"`
						DamageDealtToTurrets        int  `json:"damageDealtToTurrets"`
						TimeCCingOthers             int  `json:"timeCCingOthers"`
						Item0                       int  `json:"item0"`
						Item1                       int  `json:"item1"`
						Item2                       int  `json:"item2"`
						Item3                       int  `json:"item3"`
						Item4                       int  `json:"item4"`
						Item5                       int  `json:"item5"`
						Item6                       int  `json:"item6"`
						PentaKills                  int  `json:"pentaKills"`
						QuadraKills                 int  `json:"quadraKills"`
						TripleKills                 int  `json:"tripleKills"`
						FirstBloodKill              bool `json:"firstBloodKill"`
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
		res.HorseRank = "B 次等"
		res.HorseTier = "b"
		res.HorseName = "状态摇摆者"
		res.HorseTag = "暂无近期对局"
		return res
	}

	games := matchData.Games.Games
	totalKills, totalDeaths, totalAssists := 0, 0, 0
	totalDmg, totalTank, totalMitigated, totalHeal, totalTurretDmg, totalCC := 0, 0, 0, 0, 0, 0
	pentaCount, quadraCount, tripleCount, fbCount := 0, 0, 0, 0
	dmgShareSum, tankShareSum, healShareSum := 0.0, 0.0, 0.0
	shareCount := 0
	guardianGamesCount := 0
	validGuardianGamesCount := 0
	streakDeathsSum := 0

	champMap := make(map[int]*ChampionStat)
	streak := 0
	streakDecided := false

	for i, g := range games {
		targetPartID := -1
		for _, pi := range g.ParticipantIdentities {
			if pi.Player.Puuid == puuid {
				targetPartID = pi.ParticipantID
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

		// Find target team ID and calculate team totals
		targetTeamID := 100
		for idx, p := range g.Participants {
			pID := p.ParticipantID
			if pID == 0 {
				pID = idx + 1
			}
			if pID == targetPartID {
				if p.TeamID != 0 {
					targetTeamID = p.TeamID
				} else if idx >= 5 {
					targetTeamID = 200
				}
				break
			}
		}

		teamDmg, teamTank, teamHeal := 0, 0, 0
		for idx, p := range g.Participants {
			pTeam := p.TeamID
			if pTeam == 0 {
				if idx < 5 {
					pTeam = 100
				} else {
					pTeam = 200
				}
			}
			if pTeam == targetTeamID {
				teamDmg += p.Stats.TotalDamageDealtToChampions
				teamTank += p.Stats.TotalDamageTaken
				teamHeal += p.Stats.TotalHeal
			}
		}

		for idx, p := range g.Participants {
			pID := p.ParticipantID
			if pID == 0 {
				pID = idx + 1
			}
			if pID == targetPartID || len(g.Participants) == 1 {
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
							streakDeathsSum += p.Stats.Deaths
						} else {
							streakDecided = true
						}
					}
				}

				totalKills += p.Stats.Kills
				totalDeaths += p.Stats.Deaths
				totalAssists += p.Stats.Assists

				totalDmg += p.Stats.TotalDamageDealtToChampions
				totalTank += p.Stats.TotalDamageTaken
				totalMitigated += p.Stats.DamageSelfMitigated
				totalHeal += p.Stats.TotalHeal
				totalTurretDmg += p.Stats.DamageDealtToTurrets
				totalCC += p.Stats.TimeCCingOthers

				pentaCount += p.Stats.PentaKills
				quadraCount += p.Stats.QuadraKills
				tripleCount += p.Stats.TripleKills
				if p.Stats.FirstBloodKill {
					fbCount++
				}

				// Calculate team shares
				if teamDmg > 0 {
					dmgShareSum += (float64(p.Stats.TotalDamageDealtToChampions) / float64(teamDmg)) * 100.0
					tankShareSum += (float64(p.Stats.TotalDamageTaken) / float64(teamTank)) * 100.0
					if teamHeal > 0 {
						healShareSum += (float64(p.Stats.TotalHeal) / float64(teamHeal)) * 100.0
					}
					shareCount++
				}

				// Check Guardian Items: 2051(号角), 3112(宝珠), 3177(战刃), 3184(战锤)
				hasGuardian := false
				inventory := []int{p.Stats.Item0, p.Stats.Item1, p.Stats.Item2, p.Stats.Item3, p.Stats.Item4, p.Stats.Item5}
				completedItemsCount := 0
				for _, itemID := range inventory {
					if itemID == 2051 || itemID == 3112 || itemID == 3177 || itemID == 3184 {
						hasGuardian = true
					}
					if itemID > 0 {
						completedItemsCount++
					}
				}

				// Duration-aware Guardian evaluation:
				// If game duration is >= 20 mins (1200s) and player has 5-6 full items, selling Guardian is standard; don't penalize.
				if hasGuardian {
					guardianGamesCount++
					validGuardianGamesCount++
				} else if g.GameDuration < 1140 || completedItemsCount < 5 {
					// Game ended before full build, so missing guardian was an intentional choice
					validGuardianGamesCount++
				}

				// Record champion stat
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

		res.AvgDamage = totalDmg / res.TotalGames
		res.AvgDamageTaken = totalTank / res.TotalGames
		res.AvgMitigated = totalMitigated / res.TotalGames
		res.AvgHeal = totalHeal / res.TotalGames
		res.AvgTurretDamage = totalTurretDmg / res.TotalGames
		res.PentaCount = pentaCount
		res.QuadraCount = quadraCount
		res.TripleCount = tripleCount
		res.Streak = streak

		if shareCount > 0 {
			res.DamageShare = dmgShareSum / float64(shareCount)
			res.DamageTakenShare = tankShareSum / float64(shareCount)
			res.HealShare = healShareSum / float64(shareCount)
		} else {
			res.DamageShare = 20.0
			res.DamageTakenShare = 20.0
		}

		if validGuardianGamesCount > 0 {
			res.GuardianRatio = (float64(guardianGamesCount) / float64(validGuardianGamesCount)) * 100.0
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

	// Check Tilt (连败破防红温状态)
	if streak <= -3 {
		avgDeathsInStreak := float64(streakDeathsSum) / float64(-streak)
		if avgDeathsInStreak >= 7.5 || res.AvgKP <= 14.0 {
			res.IsTilted = true
		}
	}

	// ==========================================
	// 5大支柱战力评分引擎 (Base: 100)
	// ==========================================
	score := 100

	// 1. 战术占比维度 (Role Tactical Share: -25 ~ +25)
	carryScore := 0
	if res.DamageShare >= 31.0 {
		carryScore = 25
	} else if res.DamageShare >= 26.0 {
		carryScore = 16
	} else if res.DamageShare >= 21.0 {
		carryScore = 6
	} else if res.DamageShare >= 17.0 {
		carryScore = 0
	} else if res.DamageShare >= 13.0 {
		carryScore = -12
	} else {
		carryScore = -22
	}

	tankScore := 0
	if res.DamageTakenShare >= 35.0 || (res.AvgMitigated >= 26000 && res.DamageTakenShare >= 28.0) {
		tankScore = 25
	} else if res.DamageTakenShare >= 29.0 {
		tankScore = 16
	} else if res.DamageTakenShare >= 23.0 {
		tankScore = 6
	} else if res.DamageTakenShare >= 18.0 {
		tankScore = 0
	} else {
		tankScore = -14
	}

	healScore := 0
	if res.HealShare >= 45.0 && res.AvgHeal >= 14000 {
		healScore = 24
	} else if res.HealShare >= 30.0 {
		healScore = 14
	}

	tacticalBonus := carryScore
	if tankScore > tacticalBonus {
		tacticalBonus = tankScore
	}
	if healScore > tacticalBonus {
		tacticalBonus = healScore
	}
	score += tacticalBonus

	// 2. 装备与时长认知维度 (Itemization: -12 ~ +15)
	if res.GuardianRatio >= 35.0 {
		score += 15
	} else if res.GuardianRatio >= 20.0 {
		score += 8
	} else if res.GuardianRatio >= 10.0 {
		score += 3
	} else if res.GuardianRatio == 0.0 && res.AvgDeaths >= 8.5 && res.WinRate <= 45.0 {
		score -= 12
	}

	// 3. 心态与即时状态维度 (Tilt & Streak: -25 ~ +15)
	if streak >= 4 {
		score += 15
	} else if streak >= 2 {
		score += 7
	} else if streak <= -4 {
		score -= 25
		res.IsTilted = true
	} else if streak <= -2 {
		score -= 10
	}

	// 4. 高光爆发与拆塔维度 (Highlights: 0 ~ +15)
	if res.PentaCount >= 1 {
		score += 10
	}
	if res.QuadraCount >= 1 {
		score += 5
	}
	if res.TripleCount >= 2 {
		score += 3
	}
	if res.AvgTurretDamage >= 3200 {
		score += 4
	}

	// 5. 极端胜率激活与段位基石 (-20 ~ +20)
	if res.TotalGames >= 10 {
		if res.WinRate >= 70.0 {
			score += 20
		} else if res.WinRate >= 60.0 {
			score += 8
		} else if res.WinRate <= 35.0 {
			score -= 20
		} else if res.WinRate <= 42.0 {
			score -= 8
		}
	}

	if strings.Contains(res.RankTier, "王者") || strings.Contains(res.RankTier, "宗师") {
		score += 10
	} else if strings.Contains(res.RankTier, "大师") {
		score += 7
	} else if strings.Contains(res.RankTier, "钻石") {
		score += 4
	}

	// Tilt penalty override
	if res.IsTilted && score >= 90 {
		score = 80 // 连败破防选手强制降级
	}

	res.Score = score

	// ==========================================
	// 6 档战力金字塔映射 (S+ / S / A / B / C / D)
	// ==========================================
	if score >= 140 {
		res.HorseTier = "s_plus"
		res.HorseRank = "S+ 特等"
		res.HorseName = "降维通天代"
	} else if score >= 120 {
		res.HorseTier = "s"
		res.HorseRank = "S 上等"
		res.HorseName = "全场掌舵者"
	} else if score >= 100 {
		res.HorseTier = "a"
		res.HorseRank = "A 中等"
		res.HorseName = "中流砥柱"
	} else if score >= 85 {
		res.HorseTier = "b"
		res.HorseRank = "B 次等"
		res.HorseName = "状态摇摆者"
	} else if score >= 70 {
		res.HorseTier = "c"
		res.HorseRank = "C 下等"
		res.HorseName = "红温突破口"
	} else {
		res.HorseTier = "d"
		res.HorseRank = "D 劣等"
		res.HorseName = "下水道纯牛马"
	}

	// Descriptive Tag Generation
	if res.PentaCount >= 1 {
		res.HorseTag = fmt.Sprintf("五杀弑神大爹(Penta×%d)", res.PentaCount)
	} else if res.DamageShare >= 30.0 {
		res.HorseTag = fmt.Sprintf("全队输出占比%.0f%%/绝对大核", res.DamageShare)
	} else if res.DamageTakenShare >= 34.0 {
		res.HorseTag = fmt.Sprintf("全队承伤占比%.0f%%/钢铁真前排", res.DamageTakenShare)
	} else if res.HealShare >= 40.0 {
		res.HorseTag = fmt.Sprintf("全队治愈占比%.0f%%/救赎天使", res.HealShare)
	} else if res.IsTilted {
		res.HorseTag = fmt.Sprintf("当天%d连败红温破防", -streak)
	} else if res.GuardianRatio >= 35.0 {
		res.HorseTag = fmt.Sprintf("守护者信仰(%.0f%%)/顶级理解", res.GuardianRatio)
	} else if score >= 120 {
		res.HorseTag = "核心掌舵/大局稳健"
	} else if score < 70 {
		res.HorseTag = "连败送头/下水道天坑"
	} else {
		res.HorseTag = "均势发挥/稳健基石"
	}

	// Generate visual tags
	tags := make([]string, 0)
	if streak >= 3 {
		tags = append(tags, fmt.Sprintf("%d连胜 🔥", streak))
	} else if streak <= -3 {
		tags = append(tags, fmt.Sprintf("%d连败 ⚠️", -streak))
	}

	if res.PentaCount > 0 {
		tags = append(tags, fmt.Sprintf("👑 五杀×%d", res.PentaCount))
	} else if res.QuadraCount > 0 {
		tags = append(tags, fmt.Sprintf("⚔️ 四杀×%d", res.QuadraCount))
	}

	if res.GuardianRatio >= 25.0 {
		tags = append(tags, fmt.Sprintf("🛡️ 守护者偏好 %.0f%%", res.GuardianRatio))
	}

	if res.DamageShare >= 26.0 {
		tags = append(tags, fmt.Sprintf("💥 伤害占比 %.0f%%", res.DamageShare))
	} else if res.DamageTakenShare >= 30.0 {
		tags = append(tags, fmt.Sprintf("🛡️ 承伤占比 %.0f%%", res.DamageTakenShare))
	}

	if res.AvgTurretDamage >= 3200 {
		tags = append(tags, "🏰 拆塔分奴")
	}

	if len(champList) > 0 && champList[0].Games >= 3 {
		tags = append(tags, fmt.Sprintf("常玩%s", champList[0].ChampionName))
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
			report = "【对局战报】解析异常"
		}
	}()
	if res == nil || !res.HasData {
		return "【对局战报】暂无对局数据"
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
		if (p.HorseTier == "d" || p.HorseTier == "c") && !p.IsSelf {
			allyBottom = append(allyBottom, fmt.Sprintf("%s(%s,%s)", name, p.HorseRank, p.HorseTag))
		} else if (p.HorseTier == "s_plus" || p.HorseTier == "s") && !p.IsSelf {
			allyTop = append(allyTop, fmt.Sprintf("%s(%s,%s)", name, p.HorseRank, p.HorseTag))
		}
	}

	for _, p := range res.RedTeam {
		name := p.SummonerName
		if idx := strings.Index(name, "#"); idx != -1 {
			name = name[:idx]
		}
		if p.HorseTier == "s_plus" || p.HorseTier == "s" {
			enemyTop = append(enemyTop, fmt.Sprintf("%s(%s,%s)", name, p.HorseRank, p.HorseTag))
		} else if p.HorseTier == "d" || p.HorseTier == "c" {
			enemyBottom = append(enemyBottom, fmt.Sprintf("%s(%s,突破口)", name, p.HorseRank))
		}
	}

	var parts []string
	if len(allyTop) > 0 {
		parts = append(parts, fmt.Sprintf("💪我方大核: %s", strings.Join(allyTop, "; ")))
	}
	if len(allyBottom) > 0 {
		parts = append(parts, fmt.Sprintf("⚠️我方防崩: %s", strings.Join(allyBottom, "; ")))
	}
	if len(enemyTop) > 0 {
		parts = append(parts, fmt.Sprintf("🚨敌方通天大爹: %s", strings.Join(enemyTop, "; ")))
	}
	if len(enemyBottom) > 0 {
		parts = append(parts, fmt.Sprintf("🎯敌方下水道突破口: %s", strings.Join(enemyBottom, "; ")))
	}

	if len(parts) == 0 {
		return "【对局战报】双方战力均衡，均为 A/B 级中流砥柱，稳扎稳打即可！"
	}
	return "【对局战报】" + strings.Join(parts, " | ")
}

// SearchAndAnalyzePlayer searches for a summoner by name, riot id, or puuid, and runs the 6-tier combat analysis
func (a *Analyzer) SearchAndAnalyzePlayer(query string) (*PlayerAnalysis, error) {
	defer func() {
		if r := recover(); r != nil {
			// recover from any unexpected panic
		}
	}()

	if a == nil || a.client == nil {
		return nil, fmt.Errorf("英雄联盟客户端未连接，请先启动游戏客户端")
	}

	query = strings.TrimSpace(query)

	var targetSummonerID int64
	var targetPuuid string
	var targetName string

	// 1. If query is empty or asking for self, fetch current summoner
	if query == "" || query == "我" || query == "self" || query == "当前账号" || query == "我自己" {
		curr, err := a.client.GetCurrentSummoner()
		if err != nil {
			return nil, fmt.Errorf("获取当前登录账号失败: %w", err)
		}
		targetSummonerID = curr.SummonerID
		targetPuuid = curr.Puuid
		targetName = curr.DisplayName
	} else if len(query) > 40 && !strings.Contains(query, "#") && !strings.Contains(query, " ") {
		// 2. Query looks like a PUUID
		targetPuuid = query
	} else {
		// 3. Query is a summoner name or Riot ID (e.g. "GameName#Tag" or "Name")
		// Strategy A: /lol-summoner/v1/summoners?name=<name>
		status, body, err := a.client.Request(http.MethodGet, "/lol-summoner/v1/summoners?name="+url.QueryEscape(query), nil)
		if err == nil && status == http.StatusOK {
			var s lcu.SummonerInfo
			if json.Unmarshal(body, &s) == nil && (s.SummonerID > 0 || s.Puuid != "") {
				targetSummonerID = s.SummonerID
				targetPuuid = s.Puuid
				targetName = s.DisplayName
			}
		}

		// Strategy B: If query contains '#', try searching by gameName
		if targetSummonerID == 0 && targetPuuid == "" && strings.Contains(query, "#") {
			parts := strings.SplitN(query, "#", 2)
			gameName := parts[0]
			status, body, err := a.client.Request(http.MethodGet, "/lol-summoner/v1/summoners?name="+url.QueryEscape(gameName), nil)
			if err == nil && status == http.StatusOK {
				var s lcu.SummonerInfo
				if json.Unmarshal(body, &s) == nil && (s.SummonerID > 0 || s.Puuid != "") {
					targetSummonerID = s.SummonerID
					targetPuuid = s.Puuid
					targetName = s.DisplayName
				}
			}
		}

		// Strategy C: POST /lol-summoner/v2/summoners/names with [query]
		if targetSummonerID == 0 && targetPuuid == "" {
			reqBody, _ := json.Marshal([]string{query})
			status, body, err := a.client.Request(http.MethodPost, "/lol-summoner/v2/summoners/names", reqBody)
			if err == nil && status == http.StatusOK {
				var list []lcu.SummonerInfo
				if json.Unmarshal(body, &list) == nil && len(list) > 0 {
					targetSummonerID = list[0].SummonerID
					targetPuuid = list[0].Puuid
					targetName = list[0].DisplayName
				}
			}
		}

		// Strategy D: Search friend list /lol-chat/v1/friends
		if targetSummonerID == 0 && targetPuuid == "" {
			status, body, err := a.client.Request(http.MethodGet, "/lol-chat/v1/friends", nil)
			if err == nil && status == http.StatusOK {
				var friends []struct {
					SummonerID int64  `json:"summonerId"`
					Puuid      string `json:"puuid"`
					Name       string `json:"name"`
					GameName   string `json:"gameName"`
					GameTag    string `json:"gameTag"`
				}
				if json.Unmarshal(body, &friends) == nil {
					lowerQuery := strings.ToLower(query)
					for _, f := range friends {
						fullName := strings.ToLower(fmt.Sprintf("%s#%s", f.GameName, f.GameTag))
						if strings.ToLower(f.Name) == lowerQuery || strings.ToLower(f.GameName) == lowerQuery || fullName == lowerQuery {
							targetSummonerID = f.SummonerID
							targetPuuid = f.Puuid
							if f.GameName != "" {
								targetName = fmt.Sprintf("%s#%s", f.GameName, f.GameTag)
							} else {
								targetName = f.Name
							}
							break
						}
					}
				}
			}
		}
	}

	if targetSummonerID == 0 && targetPuuid == "" {
		return nil, fmt.Errorf("未找到召唤师「%s」，请确认名称是否正确", query)
	}

	// Run player analysis using the 5-pillar composite scoring engine
	res := a.AnalyzePlayer(targetSummonerID, targetPuuid, targetName, "blue", "NONE")
	if res.TotalGames == 0 && res.SummonerName == "" {
		return nil, fmt.Errorf("未能拉取到该玩家近期的有效对局记录")
	}

	return &res, nil
}
