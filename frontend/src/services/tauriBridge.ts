import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface AlgorithmConfig {
  customWeightsEnabled: boolean;
  damageWeight: number;    // 01 输出压制 (默认 22)
  tankWeight: number;      // 02 承伤抗压 (默认 14)
  healWeight: number;      // 03 治疗护盾 (默认 8)
  kdaWeight: number;       // 04 参团/KDA (默认 14)
  winRateWeight: number;   // 05 胜率基石 (默认 16)
  streakWeight: number;    // 06 连胜/连败心态 (默认 12)
  guardianWeight: number;  // 07 出装理解 (默认 6)
  rankTierWeight: number;  // 08 排位段位 (默认 4)
  highlightWeight: number; // 09 高光爆发与拆塔 (默认 4)
  strictTiltPenalty: boolean; // 连败熔断降级 (默认 true)
}

export interface VideoPlatform {
  id: number;
  key: string;
  name: string;
  url: string;
  windowWidth: number;
  windowHeight: number;
  profileDir: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VideoHistory {
  id: number;
  platformKey: string;
  triggerType: string;
  championName: string;
  durationSec: number;
  createdAt: string;
}

export interface DeathVideoConfig {
  enabled: boolean;
  source: 'local' | 'douyin';
  localFolder: string;
  volume: number; // 0-100
  autoCloseOnRespawn: boolean;
  showCountdown: boolean;
}

export interface Config {
  autoAccept: boolean;
  acceptDelayMs: number;
  autoQueue: boolean;
  targetMembers: number; // 0: 不限, 1: 单排, 2: 双排, 3: 三排, 4: 四排, 5: 五黑
  autoPlayAgain: boolean;
  autoHonor: boolean;
  startWithOS: boolean;
  minimizeToTray: boolean;
  alwaysOnTop: boolean;
  theme?: 'hextech' | 'aurora' | 'arcane' | 'crimson' | 'azure' | 'iris' | 'slate-white' | 'titanium';
  fontScale?: 'auto' | 'compact' | 'standard' | 'large' | 'extra-large';
  algorithm: AlgorithmConfig;
  deathVideo: DeathVideoConfig;
}

export interface DeathInfo {
  isDead: boolean;
  respawnTimer: number;
  championName: string;
  summonerName: string;
}

export interface SummonerInfo {
  displayName: string;
  gameName: string;
  tagLine: string;
  profileIconId: number;
  summonerLevel: number;
}

export interface ServiceStatus {
  connected: boolean;
  port: number;
  phase: string;
  summoner?: SummonerInfo | null;
}

export interface LogEntry {
  time: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export interface ChampionStat {
  championId: number;
  championName: string;
  games: number;
  wins: number;
  winRate: number;
}

export interface PlayerAnalysis {
  summonerId: number;
  puuid: string;
  summonerName: string;
  team: string; // "blue" or "red"
  isSelf?: boolean;
  role: string;
  rankTier: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgKp?: number;
  kda: number;
  score?: number;
  horseTier: 's_plus' | 's' | 'a' | 'b' | 'c' | 'd' | 'top' | 'mid' | 'bottom';
  horseRank?: string;
  horseName: string;
  horseTag: string;
  avgDamage?: number;
  avgDamageTaken?: number;
  avgMitigated?: number;
  avgHeal?: number;
  avgTurretDamage?: number;
  damageShare?: number;
  damageTakenShare?: number;
  healShare?: number;
  guardianRatio?: number;
  pentaCount?: number;
  quadraCount?: number;
  tripleCount?: number;
  streak?: number;
  isTilted?: boolean;
  tags: string[];
  topChampions: ChampionStat[];
}

export interface MatchAnalysisResult {
  phase: string;
  hasData: boolean;
  blueTeam: PlayerAnalysis[];
  redTeam: PlayerAnalysis[];
  lastUpdated: string;
}

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseName: string;
  releaseNotes: string;
  releaseUrl: string;
  gitCodeUrl?: string;
  downloadUrl: string;
  assetSize: number;
  publishedAt: string;
  sourceChannel?: string;
}

export interface UpdateProgress {
  percent: number;
  downloaded: number;
  total: number;
}

export const defaultAlgorithmConfig: AlgorithmConfig = {
  customWeightsEnabled: false,
  damageWeight: 22,
  tankWeight: 14,
  healWeight: 8,
  kdaWeight: 14,
  winRateWeight: 16,
  streakWeight: 12,
  guardianWeight: 6,
  rankTierWeight: 4,
  highlightWeight: 4,
  strictTiltPenalty: true,
};

export const defaultDeathVideoConfig: DeathVideoConfig = {
  enabled: true,
  source: 'local',
  localFolder: '',
  volume: 40,
  autoCloseOnRespawn: true,
  showCountdown: true,
};

export const TauriBridge = {
  async getConfig(): Promise<Config> {
    try {
      const cfg = await invoke<Config>('get_config');
      return {
        ...cfg,
        algorithm: cfg.algorithm || defaultAlgorithmConfig,
        deathVideo: cfg.deathVideo || defaultDeathVideoConfig,
      };
    } catch (e) {
      console.error('Tauri get_config error:', e);
      return {
        autoAccept: true,
        acceptDelayMs: 800,
        autoQueue: true,
        targetMembers: 1,
        autoPlayAgain: true,
        autoHonor: true,
        startWithOS: false,
        minimizeToTray: true,
        alwaysOnTop: false,
        algorithm: defaultAlgorithmConfig,
        deathVideo: defaultDeathVideoConfig,
      };
    }
  },

  async saveConfig(cfg: Config): Promise<void> {
    try {
      await invoke('save_config', { cfg });
    } catch (e) {
      console.error('Tauri save_config error:', e);
    }
  },

  async getStatus(): Promise<ServiceStatus> {
    try {
      return await invoke<ServiceStatus>('get_status');
    } catch {
      return {
        connected: false,
        port: 0,
        phase: 'None',
      };
    }
  },

  async getLogs(): Promise<LogEntry[]> {
    try {
      return await invoke<LogEntry[]>('get_logs');
    } catch {
      return [];
    }
  },

  async clearLogs(): Promise<void> {
    try {
      await invoke('clear_logs');
    } catch (e) {
      console.error('clear_logs error:', e);
    }
  },

  async minimize(): Promise<void> {
    try {
      await invoke('minimize_window');
    } catch (e) {
      console.error('minimize error:', e);
    }
  },

  async toggleMaximize(): Promise<void> {
    try {
      await invoke('toggle_maximize_window');
    } catch (e) {
      console.error('toggleMaximize error:', e);
    }
  },

  async isMaximized(): Promise<boolean> {
    try {
      return await invoke<boolean>('is_window_maximized');
    } catch {
      return false;
    }
  },

  async close(): Promise<void> {
    try {
      await invoke('close_app');
    } catch (e) {
      console.error('close error:', e);
    }
  },

  async setAlwaysOnTop(onTop: boolean): Promise<void> {
    try {
      await invoke('set_always_on_top', { onTop });
    } catch (e) {
      console.error('setAlwaysOnTop error:', e);
    }
  },

  async setMiniMode(enable: boolean): Promise<void> {
    try {
      await invoke('set_mini_mode', { enable });
    } catch (e) {
      console.error('setMiniMode error:', e);
    }
  },

  async selectDirectory(): Promise<string> {
    return '';
  },

  async getRandomVideoURL(_folder: string): Promise<string> {
    return '';
  },

  async triggerTestDeath(_durationSec = 20): Promise<void> {},

  async triggerTestRespawn(): Promise<void> {},

  async startMatchmaking(): Promise<void> {
    try {
      await invoke('start_matchmaking');
    } catch (e) {
      console.error('startMatchmaking error:', e);
    }
  },

  async stopMatchmaking(): Promise<void> {
    try {
      await invoke('stop_matchmaking');
    } catch (e) {
      console.error('stopMatchmaking error:', e);
    }
  },

  async acceptMatch(): Promise<void> {
    try {
      await invoke('accept_match');
    } catch (e) {
      console.error('acceptMatch error:', e);
    }
  },

  async getMatchAnalysis(): Promise<MatchAnalysisResult | null> {
    try {
      return await invoke<MatchAnalysisResult>('get_match_analysis');
    } catch {
      return null;
    }
  },

  async sendChatMessage(_msg: string): Promise<void> {},

  async generateHorseReport(): Promise<string> {
    try {
      return await invoke<string>('get_horse_report');
    } catch {
      return '';
    }
  },

  async searchPlayerAnalysis(_query: string): Promise<PlayerAnalysis | null> {
    return null;
  },

  async checkForUpdate(): Promise<UpdateInfo | null> {
    return null;
  },

  async downloadAndApplyUpdate(_downloadUrl: string): Promise<void> {},

  async openBrowser(url: string): Promise<void> {
    try {
      await invoke('open_browser', { url });
    } catch {
      window.open(url, '_blank');
    }
  },

  async openDouyinWindow(): Promise<void> {
    await this.openWebVideoWindow('douyin');
  },

  async closeDouyinWindow(): Promise<void> {
    await this.closeWebVideoWindow();
  },

  async getVideoPlatforms(): Promise<VideoPlatform[]> {
    try {
      return await invoke<VideoPlatform[]>('get_video_platforms');
    } catch {
      return [];
    }
  },

  async setActiveVideoPlatform(_key: string): Promise<void> {},

  async updateVideoPlatformConfig(_key: string, _name: string, _url: string, _width: number, _height: number): Promise<void> {},

  async getVideoHistory(): Promise<VideoHistory[]> {
    try {
      return await invoke<VideoHistory[]>('get_video_history', { limit: 20 });
    } catch {
      return [];
    }
  },

  async openWebVideoWindow(platformKey?: string): Promise<void> {
    try {
      await invoke('open_web_video_window', { platformKey: platformKey || null });
    } catch (e) {
      console.error('openWebVideoWindow error:', e);
    }
  },

  async closeWebVideoWindow(): Promise<void> {
    try {
      await invoke('close_web_video_window');
    } catch (e) {
      console.error('closeWebVideoWindow error:', e);
    }
  },

  onPlayerDied(_callback: (info: DeathInfo) => void): () => void {
    return () => {};
  },

  onPlayerRespawned(_callback: () => void): () => void {
    return () => {};
  },

  onLiveTick(_callback: (info: DeathInfo) => void): () => void {
    return () => {};
  },

  onUpdateProgress(_callback: (progress: UpdateProgress) => void): () => void {
    return () => {};
  },

  onStatusChange(callback: (status: ServiceStatus) => void): () => void {
    let unlistenFn: (() => void) | null = null;
    listen<ServiceStatus>('service:status', (event) => callback(event.payload)).then((fn) => {
      unlistenFn = fn;
    });
    return () => {
      if (unlistenFn) unlistenFn();
    };
  },

  onAnalysisUpdate(callback: (result: MatchAnalysisResult) => void): () => void {
    let unlistenFn: (() => void) | null = null;
    listen<MatchAnalysisResult>('match:analysis', (event) => callback(event.payload)).then((fn) => {
      unlistenFn = fn;
    });
    return () => {
      if (unlistenFn) unlistenFn();
    };
  },

  onNewLog(callback: (log: LogEntry) => void): () => void {
    let unlistenFn: (() => void) | null = null;
    listen<LogEntry>('service:log', (event) => callback(event.payload)).then((fn) => {
      unlistenFn = fn;
    });
    return () => {
      if (unlistenFn) unlistenFn();
    };
  },

  onClearLogs(_callback: () => void): () => void {
    return () => {};
  },
};

// 兼容别名导出
export const WailsBridge = TauriBridge;
