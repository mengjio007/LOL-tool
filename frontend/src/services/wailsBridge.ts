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
  horseTier: 'top' | 'mid' | 'bottom';
  horseName: string;
  horseTag: string;
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
  downloadUrl: string;
  assetSize: number;
  publishedAt: string;
}

export interface UpdateProgress {
  percent: number;
  downloaded: number;
  total: number;
}

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
          CloseApp: () => Promise<void>;
          SetAlwaysOnTop: (onTop: boolean) => Promise<void>;
          StartMatchmaking: () => Promise<void>;
          StopMatchmaking: () => Promise<void>;
          AcceptMatch: () => Promise<void>;
          GetMatchAnalysis: () => Promise<MatchAnalysisResult>;
          SendChatMessage: (msg: string) => Promise<void>;
          GenerateHorseReport: () => Promise<string>;
          CheckForUpdate: () => Promise<UpdateInfo>;
          DownloadAndApplyUpdate: (downloadUrl: string) => Promise<void>;
          OpenBrowser: (url: string) => Promise<void>;
        };
      };
    };
    runtime?: {
      EventsOn: (eventName: string, callback: (...args: any[]) => void) => () => void;
      EventsOff: (eventName: string) => void;
      WindowMinimise: () => void;
      Quit: () => void;
    };
  }
}

export const WailsBridge = {
  async getConfig(): Promise<Config> {
    if (window.go?.main?.App?.GetConfig) {
      return await window.go.main.App.GetConfig();
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
      return await window.go.main.App.SendChatMessage(msg);
    }
  },

  async generateHorseReport(): Promise<string> {
    if (window.go?.main?.App?.GenerateHorseReport) {
      return await window.go.main.App.GenerateHorseReport();
    }
    return '';
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
