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
  theme?: 'hextech' | 'aurora' | 'arcane' | 'crimson';
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

// Safely access Wails runtime and bound methods
declare global {
  interface Window {
    go?: {
      main?: {
        App?: {
          GetConfig: () => Promise<Config>;
          SaveConfig: (cfg: Config) => Promise<void>;
          GetStatus: () => Promise<ServiceStatus>;
          GetLogs: () => Promise<LogEntry[]>;
          ClearLogs: () => Promise<void>;
          MinimizeWindow: () => Promise<void>;
          ToggleMaximizeWindow: () => Promise<void>;
          IsWindowMaximized: () => Promise<boolean>;
          CloseApp: () => Promise<void>;
          SetAlwaysOnTop: (onTop: boolean) => Promise<void>;
          StartMatchmaking: () => Promise<void>;
          StopMatchmaking: () => Promise<void>;
          AcceptMatch: () => Promise<void>;
          GetMatchAnalysis: () => Promise<MatchAnalysisResult>;
          SendChatMessage: (msg: string) => Promise<void>;
          GenerateHorseReport: () => Promise<string>;
          SearchPlayerAnalysis: (query: string) => Promise<PlayerAnalysis>;
          CheckForUpdate: () => Promise<UpdateInfo>;
          DownloadAndApplyUpdate: (downloadUrl: string) => Promise<void>;
          OpenBrowser: (url: string) => Promise<void>;
          SelectDirectory: () => Promise<string>;
          GetRandomVideoURL: (folder: string) => Promise<string>;
          SetMiniMode: (enable: boolean) => Promise<void>;
          TriggerTestDeath: (durationSec: number) => Promise<void>;
          TriggerTestRespawn: () => Promise<void>;
          OpenDouyinWindow: () => Promise<void>;
          CloseDouyinWindow: () => Promise<void>;
          GetVideoPlatforms: () => Promise<VideoPlatform[]>;
          SetActiveVideoPlatform: (key: string) => Promise<void>;
          UpdateVideoPlatformConfig: (key: string, name: string, url: string, width: number, height: number) => Promise<void>;
          GetVideoHistory: () => Promise<VideoHistory[]>;
          OpenWebVideoWindow: (platformKey: string) => Promise<void>;
          CloseWebVideoWindow: () => Promise<void>;
        };
      };
    };
    runtime?: {
      EventsOn: (eventName: string, callback: (...args: any[]) => void) => () => void;
      EventsOff: (eventName: string) => void;
      WindowMinimise: () => void;
      WindowToggleMaximise: () => void;
      WindowIsMaximised: () => Promise<boolean>;
      Quit: () => void;
    };
  }
}

export const WailsBridge = {
  async getConfig(): Promise<Config> {
    if (window.go?.main?.App?.GetConfig) {
      const cfg = await window.go.main.App.GetConfig();
      return {
        ...cfg,
        algorithm: cfg.algorithm || defaultAlgorithmConfig,
        deathVideo: cfg.deathVideo || defaultDeathVideoConfig,
      };
    }
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
  },

  async saveConfig(cfg: Config): Promise<void> {
    if (window.go?.main?.App?.SaveConfig) {
      await window.go.main.App.SaveConfig(cfg);
    }
  },

  async getStatus(): Promise<ServiceStatus> {
    if (window.go?.main?.App?.GetStatus) {
      return await window.go.main.App.GetStatus();
    }
    return {
      connected: false,
      port: 0,
      phase: 'None',
    };
  },

  async getLogs(): Promise<LogEntry[]> {
    if (window.go?.main?.App?.GetLogs) {
      return await window.go.main.App.GetLogs();
    }
    return [];
  },

  async clearLogs(): Promise<void> {
    if (window.go?.main?.App?.ClearLogs) {
      await window.go.main.App.ClearLogs();
    }
  },

  async minimize(): Promise<void> {
    if (window.go?.main?.App?.MinimizeWindow) {
      await window.go.main.App.MinimizeWindow();
    } else if (window.runtime?.WindowMinimise) {
      window.runtime.WindowMinimise();
    }
  },

  async toggleMaximize(): Promise<void> {
    if (window.go?.main?.App?.ToggleMaximizeWindow) {
      await window.go.main.App.ToggleMaximizeWindow();
    } else if (window.runtime?.WindowToggleMaximise) {
      window.runtime.WindowToggleMaximise();
    }
  },

  async isMaximized(): Promise<boolean> {
    if (window.go?.main?.App?.IsWindowMaximized) {
      return await window.go.main.App.IsWindowMaximized();
    } else if (window.runtime?.WindowIsMaximised) {
      return await window.runtime.WindowIsMaximised();
    }
    return false;
  },

  async close(): Promise<void> {
    if (window.go?.main?.App?.CloseApp) {
      await window.go.main.App.CloseApp();
    } else if (window.runtime?.Quit) {
      window.runtime.Quit();
    }
  },

  async setAlwaysOnTop(onTop: boolean): Promise<void> {
    if (window.go?.main?.App?.SetAlwaysOnTop) {
      await window.go.main.App.SetAlwaysOnTop(onTop);
    }
  },

  async setMiniMode(enable: boolean): Promise<void> {
    if (window.go?.main?.App?.SetMiniMode) {
      await window.go.main.App.SetMiniMode(enable);
    }
  },

  async selectDirectory(): Promise<string> {
    if (window.go?.main?.App?.SelectDirectory) {
      return await window.go.main.App.SelectDirectory();
    }
    return '';
  },

  async getRandomVideoURL(folder: string): Promise<string> {
    if (window.go?.main?.App?.GetRandomVideoURL) {
      return await window.go.main.App.GetRandomVideoURL(folder);
    }
    return '';
  },

  async triggerTestDeath(durationSec = 20): Promise<void> {
    if (window.go?.main?.App?.TriggerTestDeath) {
      await window.go.main.App.TriggerTestDeath(durationSec);
    }
  },

  async triggerTestRespawn(): Promise<void> {
    if (window.go?.main?.App?.TriggerTestRespawn) {
      await window.go.main.App.TriggerTestRespawn();
    }
  },

  async startMatchmaking(): Promise<void> {
    if (window.go?.main?.App?.StartMatchmaking) {
      await window.go.main.App.StartMatchmaking();
    }
  },

  async stopMatchmaking(): Promise<void> {
    if (window.go?.main?.App?.StopMatchmaking) {
      await window.go.main.App.StopMatchmaking();
    }
  },

  async acceptMatch(): Promise<void> {
    if (window.go?.main?.App?.AcceptMatch) {
      await window.go.main.App.AcceptMatch();
    }
  },

  async getMatchAnalysis(): Promise<MatchAnalysisResult | null> {
    if (window.go?.main?.App?.GetMatchAnalysis) {
      return await window.go.main.App.GetMatchAnalysis();
    }
    return null;
  },

  async sendChatMessage(msg: string): Promise<void> {
    if (window.go?.main?.App?.SendChatMessage) {
      await window.go.main.App.SendChatMessage(msg);
    }
  },

  async generateHorseReport(): Promise<string> {
    if (window.go?.main?.App?.GenerateHorseReport) {
      return await window.go.main.App.GenerateHorseReport();
    }
    return '';
  },

  async searchPlayerAnalysis(query: string): Promise<PlayerAnalysis | null> {
    if (window.go?.main?.App?.SearchPlayerAnalysis) {
      return await window.go.main.App.SearchPlayerAnalysis(query);
    }
    return null;
  },

  async checkForUpdate(): Promise<UpdateInfo | null> {
    if (window.go?.main?.App?.CheckForUpdate) {
      return await window.go.main.App.CheckForUpdate();
    }
    return null;
  },

  async downloadAndApplyUpdate(downloadUrl: string): Promise<void> {
    if (window.go?.main?.App?.DownloadAndApplyUpdate) {
      await window.go.main.App.DownloadAndApplyUpdate(downloadUrl);
    }
  },

  async openBrowser(url: string): Promise<void> {
    if (window.go?.main?.App?.OpenBrowser) {
      await window.go.main.App.OpenBrowser(url);
    } else {
      window.open(url, '_blank');
    }
  },

  async openDouyinWindow(): Promise<void> {
    if (window.go?.main?.App?.OpenDouyinWindow) {
      await window.go.main.App.OpenDouyinWindow();
    }
  },

  async closeDouyinWindow(): Promise<void> {
    if (window.go?.main?.App?.CloseDouyinWindow) {
      await window.go.main.App.CloseDouyinWindow();
    }
  },

  async getVideoPlatforms(): Promise<VideoPlatform[]> {
    if (window.go?.main?.App?.GetVideoPlatforms) {
      return await window.go.main.App.GetVideoPlatforms();
    }
    return [];
  },

  async setActiveVideoPlatform(key: string): Promise<void> {
    if (window.go?.main?.App?.SetActiveVideoPlatform) {
      await window.go.main.App.SetActiveVideoPlatform(key);
    }
  },

  async updateVideoPlatformConfig(key: string, name: string, url: string, width: number, height: number): Promise<void> {
    if (window.go?.main?.App?.UpdateVideoPlatformConfig) {
      await window.go.main.App.UpdateVideoPlatformConfig(key, name, url, width, height);
    }
  },

  async getVideoHistory(): Promise<VideoHistory[]> {
    if (window.go?.main?.App?.GetVideoHistory) {
      return await window.go.main.App.GetVideoHistory();
    }
    return [];
  },

  async openWebVideoWindow(platformKey?: string): Promise<void> {
    if (window.go?.main?.App?.OpenWebVideoWindow) {
      await window.go.main.App.OpenWebVideoWindow(platformKey || '');
    } else {
      await this.openDouyinWindow();
    }
  },

  async closeWebVideoWindow(): Promise<void> {
    if (window.go?.main?.App?.CloseWebVideoWindow) {
      await window.go.main.App.CloseWebVideoWindow();
    } else {
      await this.closeDouyinWindow();
    }
  },

  onPlayerDied(callback: (info: DeathInfo) => void): () => void {
    if (window.runtime?.EventsOn) {
      return window.runtime.EventsOn('live:player_died', callback);
    }
    return () => {};
  },

  onPlayerRespawned(callback: () => void): () => void {
    if (window.runtime?.EventsOn) {
      return window.runtime.EventsOn('live:player_respawned', callback);
    }
    return () => {};
  },

  onLiveTick(callback: (info: DeathInfo) => void): () => void {
    if (window.runtime?.EventsOn) {
      return window.runtime.EventsOn('live:tick', callback);
    }
    return () => {};
  },

  onUpdateProgress(callback: (progress: UpdateProgress) => void): () => void {
    if (window.runtime?.EventsOn) {
      return window.runtime.EventsOn('update:progress', callback);
    }
    return () => {};
  },

  onStatusChange(callback: (status: ServiceStatus) => void): () => void {
    if (window.runtime?.EventsOn) {
      return window.runtime.EventsOn('status:change', callback);
    }
    return () => {};
  },

  onAnalysisUpdate(callback: (result: MatchAnalysisResult) => void): () => void {
    if (window.runtime?.EventsOn) {
      return window.runtime.EventsOn('analysis:update', callback);
    }
    return () => {};
  },

  onNewLog(callback: (log: LogEntry) => void): () => void {
    if (window.runtime?.EventsOn) {
      return window.runtime.EventsOn('log:new', callback);
    }
    return () => {};
  },

  onClearLogs(callback: () => void): () => void {
    if (window.runtime?.EventsOn) {
      return window.runtime.EventsOn('log:clear', callback);
    }
    return () => {};
  },
};
