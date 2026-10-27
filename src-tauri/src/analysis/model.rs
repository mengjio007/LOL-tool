use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ChampionStat {
    pub champion_id: i64,
    pub champion_name: String,
    pub games: i32,
    pub wins: i32,
    pub win_rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PlayerAnalysis {
    pub summoner_id: i64,
    pub puuid: String,
    pub summoner_name: String,
    pub team: String, // "blue" | "red"
    pub is_self: Option<bool>,
    pub role: String,
    pub rank_tier: String,
    pub total_games: i32,
    pub wins: i32,
    pub losses: i32,
    pub win_rate: f64,
    pub avg_kills: f64,
    pub avg_deaths: f64,
    pub avg_assists: f64,
    pub avg_kp: Option<f64>,
    pub kda: f64,
    pub score: Option<f64>,
    pub horse_tier: String, // "s_plus" | "s" | "a" | "b" | "c" | "d"
    pub horse_rank: Option<String>,
    pub horse_name: String,
    pub horse_tag: String,
    pub avg_damage: Option<f64>,
    pub avg_damage_taken: Option<f64>,
    pub avg_mitigated: Option<f64>,
    pub avg_heal: Option<f64>,
    pub avg_turret_damage: Option<f64>,
    pub damage_share: Option<f64>,
    pub damage_taken_share: Option<f64>,
    pub heal_share: Option<f64>,
    pub guardian_ratio: Option<f64>,
    pub penta_count: Option<i32>,
    pub quadra_count: Option<i32>,
    pub triple_count: Option<i32>,
    pub streak: Option<i32>,
    pub is_tilted: Option<bool>,
    pub tags: Vec<String>,
    pub top_champions: Vec<ChampionStat>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MatchAnalysisResult {
    pub phase: String,
    pub has_data: bool,
    pub blue_team: Vec<PlayerAnalysis>,
    pub red_team: Vec<PlayerAnalysis>,
    pub last_updated: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SummonerInfo {
    pub display_name: String,
    pub game_name: String,
    pub tag_line: String,
    pub profile_icon_id: i64,
    pub summoner_level: i32,
}
