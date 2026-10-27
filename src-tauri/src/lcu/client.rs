use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde_json::Value;

#[derive(Clone)]
pub struct LcuClient {
    client: reqwest::Client,
    base_url: String,
    auth_header: String,
}

impl LcuClient {
    pub fn new(port: u16, token: &str) -> Result<Self, String> {
        let mut headers = HeaderMap::new();
        let auth_str = format!("riot:{}", token);
        let encoded_auth = format!("Basic {}", BASE64.encode(auth_str.as_bytes()));

        let mut auth_val = HeaderValue::from_str(&encoded_auth).map_err(|e| e.to_string())?;
        auth_val.set_sensitive(true);
        headers.insert(AUTHORIZATION, auth_val);
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        let client = reqwest::Client::builder()
            .danger_accept_invalid_certs(true)
            .default_headers(headers)
            .build()
            .map_err(|e| e.to_string())?;

        Ok(Self {
            client,
            base_url: format!("https://127.0.0.1:{}", port),
            auth_header: encoded_auth,
        })
    }

    pub fn get_auth_header(&self) -> &str {
        &self.auth_header
    }

    pub async fn get(&self, endpoint: &str) -> Result<Value, String> {
        let url = format!("{}{}", self.base_url, endpoint);
        let res = self.client.get(&url).send().await.map_err(|e| e.to_string())?;
        let status = res.status();
        if !status.is_success() {
            return Err(format!("LCU request failed with status {}", status));
        }
        res.json::<Value>().await.map_err(|e| e.to_string())
    }

    pub async fn post(&self, endpoint: &str, body: Option<&Value>) -> Result<Value, String> {
        let url = format!("{}{}", self.base_url, endpoint);
        let req = self.client.post(&url);
        let req = if let Some(b) = body { req.json(b) } else { req };
        let res = req.send().await.map_err(|e| e.to_string())?;
        if !res.status().is_success() {
            return Err(format!("LCU POST failed with status {}", res.status()));
        }
        let val = res.json::<Value>().await.unwrap_or(Value::Null);
        Ok(val)
    }

    pub async fn delete(&self, endpoint: &str) -> Result<(), String> {
        let url = format!("{}{}", self.base_url, endpoint);
        let res = self.client.delete(&url).send().await.map_err(|e| e.to_string())?;
        if !res.status().is_success() {
            return Err(format!("LCU DELETE failed with status {}", res.status()));
        }
        Ok(())
    }

    // --- 高级业务封装 ---

    pub async fn get_gameflow_phase(&self) -> Result<String, String> {
        let val = self.get("/lol-gameflow/v1/gameflow-phase").await?;
        Ok(val.as_str().unwrap_or("None").to_string())
    }

    pub async fn get_current_summoner(&self) -> Result<Value, String> {
        self.get("/lol-summoner/v1/current-summoner").await
    }

    pub async fn accept_match(&self) -> Result<(), String> {
        let _ = self.post("/lol-matchmaking/v1/ready-check/accept", None).await?;
        Ok(())
    }

    pub async fn start_matchmaking(&self) -> Result<(), String> {
        let _ = self.post("/lol-matchmaking/v1/search", None).await?;
        Ok(())
    }

    pub async fn stop_matchmaking(&self) -> Result<(), String> {
        self.delete("/lol-matchmaking/v1/search").await
    }

    pub async fn get_champ_select_session(&self) -> Result<Value, String> {
        self.get("/lol-champ-select/v1/session").await
    }

    pub async fn get_match_history(&self, puuid: &str, beg_index: i32, end_index: i32) -> Result<Value, String> {
        let endpoint = format!("/lol-match-history/v1/products/lol/{}/matches?begIndex={}&endIndex={}", puuid, beg_index, end_index);
        self.get(&endpoint).await
    }
}
