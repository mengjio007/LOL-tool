import { useEffect, useState, useRef } from 'react';
import {
  WailsBridge,
  defaultAlgorithmConfig,
  defaultDeathVideoConfig,
} from './services/wailsBridge';
import type {
  Config,
  ServiceStatus,
  LogEntry,
  MatchAnalysisResult,
  PlayerAnalysis,
  UpdateInfo,
} from './services/wailsBridge';
import {
  Zap,
  Users,
  RotateCcw,
  Pin,
  Minus,
  X,
  Trash2,
  Sliders,
  CheckCircle2,
  Clock,
  Activity,
  AlertCircle,
  Play,
  Square,
  Swords,
  RefreshCw,
  Info,
  MessageSquare,
  Send,
  Copy,
  Check,
  Globe,
  Loader2,
  Search,
  Settings,
  Tv,
  Sparkles,
} from 'lucide-react';
import { translations, translateLog, type Language } from './i18n/translations';
import { PlayerSearchView } from './components/PlayerSearchView';
import { SettingsModal, type SettingsTab } from './components/SettingsModal';
import { InGameMiniBar } from './components/InGameMiniBar';
import { DeathVideoOverlay } from './components/DeathVideoOverlay';
import type { DeathInfo } from './services/wailsBridge';
import appLogo from './assets/appicon.png';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('lol_helper_lang');
    return saved === 'en' ? 'en' : 'zh';
  });

  const t = translations[lang];

  const toggleLang = () => {
    const nextLang: Language = lang === 'zh' ? 'en' : 'zh';
    setLang(nextLang);
    localStorage.setItem('lol_helper_lang', nextLang);
  };

  const [activeTab, setActiveTab] = useState<'automation' | 'analysis' | 'search'>('automation');
  const [teamFilter, setTeamFilter] = useState<'all' | 'blue' | 'red'>('all');
  const [isRefreshingAnalysis, setIsRefreshingAnalysis] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMax = async () => {
      const max = await WailsBridge.isMaximized();
      setIsMaximized(max);
    };
    checkMax();
    window.addEventListener('resize', checkMax);
    return () => window.removeEventListener('resize', checkMax);
  }, []);

  const handleToggleMaximize = async () => {
    await WailsBridge.toggleMaximize();
    const max = await WailsBridge.isMaximized();
    setIsMaximized(max);
  };

  const [config, setConfig] = useState<Config>({
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
  });

  const [status, setStatus] = useState<ServiceStatus>({
    connected: false,
    port: 0,
    phase: 'None',
    summoner: null,
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [analysis, setAnalysis] = useState<MatchAnalysisResult | null>(null);
  const [reportText, setReportText] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [chatFeedback, setChatFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Update & Settings State
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('updates');
  const [updateToast, setUpdateToast] = useState<{ type: 'info' | 'success' | 'warn'; msg: string } | null>(null);
  const [deathInfo, setDeathInfo] = useState<DeathInfo | null>(null);
  const [isMiniMode, setIsMiniMode] = useState(false);

  // 2.0 Live game death & respawn listeners
  useEffect(() => {
    const unsubDeath = WailsBridge.onPlayerDied((info) => {
      if (config.deathVideo?.enabled) {
        setDeathInfo(info);
      }
    });

    const unsubRespawn = WailsBridge.onPlayerRespawned(() => {
      setDeathInfo(null);
    });

    const unsubTick = WailsBridge.onLiveTick((info) => {
      setDeathInfo((prev) => (prev ? { ...prev, respawnTimer: info.respawnTimer } : info));
    });

    return () => {
      unsubDeath();
      unsubRespawn();
      unsubTick();
    };
  }, [config.deathVideo?.enabled]);

  const handleToggleMiniMode = async (enable: boolean) => {
    setIsMiniMode(enable);
    await WailsBridge.setMiniMode(enable);
  };

  const openSettings = (tab: SettingsTab = 'updates') => {
    setSettingsTab(tab);
    setShowSettingsModal(true);
  };

  // Background check on mount (delay 2s) - Silent check only, never auto-popup
  useEffect(() => {
    const timer = setTimeout(() => {
      WailsBridge.checkForUpdate()
        .then((info) => {
          if (info) {
            setUpdateInfo(info);
          }
        })
        .catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Update progress listener
  useEffect(() => {
    const unsub = WailsBridge.onUpdateProgress((p) => {
      setUpdateProgress(p.percent);
    });
    return () => unsub();
  }, []);

  const lastCheckTimeRef = useRef<number>(0);

  const handleCheckUpdate = async (isManual = true) => {
    if (isCheckingUpdate) return;

    // 节流保护：4秒内重复手动点击直接使用本地缓存状态，避免被 GitHub/GitCode 频控封禁
    if (isManual && Date.now() - lastCheckTimeRef.current < 4000 && updateInfo) {
      setUpdateToast({
        type: 'success',
        msg: t.alreadyLatest.replace('{version}', updateInfo.currentVersion || t.version),
      });
      setTimeout(() => setUpdateToast(null), 3000);
      return;
    }

    setIsCheckingUpdate(true);
    lastCheckTimeRef.current = Date.now();
    if (isManual) {
      setUpdateToast({ type: 'info', msg: t.checkingUpdate });
    }
    try {
      const info = await WailsBridge.checkForUpdate();
      if (info) {
        setUpdateInfo(info);
        if (info.hasUpdate) {
          openSettings('updates');
          if (isManual) setUpdateToast(null);
        } else {
          if (isManual) {
            setUpdateToast({
              type: 'success',
              msg: t.alreadyLatest.replace('{version}', info.currentVersion || t.version),
            });
            setTimeout(() => setUpdateToast(null), 3000);
          }
        }
      } else {
        if (isManual) {
          setUpdateToast({ type: 'warn', msg: t.checkUpdateFailed });
          setTimeout(() => setUpdateToast(null), 3500);
        }
      }
    } catch {
      if (isManual) {
        setUpdateToast({ type: 'warn', msg: t.checkUpdateFailed });
        setTimeout(() => setUpdateToast(null), 3500);
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleStartUpdate = async () => {
    if (!updateInfo || !updateInfo.downloadUrl) return;
    setIsUpdating(true);
    setUpdateProgress(0);
    try {
      await WailsBridge.downloadAndApplyUpdate(updateInfo.downloadUrl);
    } catch (err: any) {
      setIsUpdating(false);
      setUpdateToast({ type: 'warn', msg: t.updateFailedFallback });
      setTimeout(() => setUpdateToast(null), 5000);
      if (updateInfo.gitCodeUrl) {
        await WailsBridge.openBrowser(updateInfo.gitCodeUrl);
      } else if (updateInfo.releaseUrl) {
        await WailsBridge.openBrowser(updateInfo.releaseUrl);
      }
    }
  };

  // Update report text when analysis changes
  useEffect(() => {
    if (analysis && analysis.hasData) {
      WailsBridge.generateHorseReport().then((txt) => {
        if (txt) setReportText(txt);
      });
    }
  }, [analysis]);

  const handleCopyReport = async () => {
    if (!reportText) return;
    try {
      await navigator.clipboard.writeText(reportText);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
      setChatFeedback({ type: 'success', msg: t.copySuccess });
      setTimeout(() => setChatFeedback(null), 4000);
    } catch {
      setChatFeedback({ type: 'error', msg: t.copyFailed });
      setTimeout(() => setChatFeedback(null), 3000);
    }
  };

  const handleSendChat = async () => {
    if (!reportText) return;
    setIsSendingChat(true);
    setChatFeedback(null);
    try {
      await WailsBridge.sendChatMessage(reportText);
      setChatFeedback({ type: 'success', msg: t.sendSuccess });
      setTimeout(() => setChatFeedback(null), 4000);
    } catch (err: any) {
      setChatFeedback({ type: 'error', msg: err?.message || t.sendFailed });
      setTimeout(() => setChatFeedback(null), 5000);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Initialize data and listeners
  useEffect(() => {
    // 1. Initial load
    WailsBridge.getConfig().then(setConfig);
    WailsBridge.getStatus().then(setStatus);
    WailsBridge.getLogs().then(setLogs);
    WailsBridge.getMatchAnalysis().then((res) => {
      if (res && res.hasData) {
        setAnalysis(res);
      }
    });

    // 2. Listeners
    const unsubStatus = WailsBridge.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    const unsubAnalysis = WailsBridge.onAnalysisUpdate((res) => {
      setAnalysis(res);
    });

    const unsubLog = WailsBridge.onNewLog((newLog) => {
      setLogs((prev) => [...prev.slice(-199), newLog]);
    });

    const unsubClear = WailsBridge.onClearLogs(() => {
      setLogs([]);
    });

    return () => {
      unsubStatus();
      unsubAnalysis();
      unsubLog();
      unsubClear();
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (activeTab === 'automation') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  // Update Config Helper
  const updateConfig = async (patch: Partial<Config>) => {
    const updated = { ...config, ...patch };
    setConfig(updated);
    await WailsBridge.saveConfig(updated);
  };

  const toggleAlwaysOnTop = async () => {
    const nextVal = !config.alwaysOnTop;
    await updateConfig({ alwaysOnTop: nextVal });
    await WailsBridge.setAlwaysOnTop(nextVal);
  };

  const handleRefreshAnalysis = async () => {
    setIsRefreshingAnalysis(true);
    try {
      const res = await WailsBridge.getMatchAnalysis();
      if (res) {
        setAnalysis(res);
      }
    } finally {
      setIsRefreshingAnalysis(false);
    }
  };

  // Phase translation & badge color
  const getPhaseDisplay = (phase: string) => {
    switch (phase) {
      case 'Lobby':
        return { text: t.phaseLobby, color: 'border-amber-500/40 text-amber-300 bg-amber-500/10' };
      case 'Matchmaking':
        return { text: t.phaseMatchmaking, color: 'border-blue-500/40 text-blue-300 bg-blue-500/10 animate-pulse' };
      case 'ReadyCheck':
        return { text: t.phaseReadyCheck, color: 'border-emerald-500/50 text-emerald-300 bg-emerald-500/20 animate-pulse' };
      case 'ChampSelect':
        return { text: t.phaseChampSelect, color: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10' };
      case 'InProgress':
        return { text: t.phaseInProgress, color: 'border-purple-500/40 text-purple-300 bg-purple-500/10' };
      case 'WaitingForStats':
      case 'PreEndOfGame':
      case 'EndOfGame':
        return { text: t.phasePostGame, color: 'border-indigo-500/40 text-indigo-300 bg-indigo-500/10' };
      default:
        return { text: t.phaseIdle, color: 'border-slate-500/40 text-slate-300 bg-slate-500/10' };
    }
  };

  const phaseInfo = getPhaseDisplay(status.phase);

  // 2.0 In-Game Mini Overlay Bar Mode
  if (isMiniMode) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-transparent">
        <InGameMiniBar
          players={analysis?.blueTeam || []}
          onRestore={() => handleToggleMiniMode(false)}
          onMinimize={() => WailsBridge.minimize()}
          onClose={() => WailsBridge.close()}
        />
        {deathInfo && config.deathVideo?.enabled && (
          <DeathVideoOverlay
            deathInfo={deathInfo}
            config={config.deathVideo}
            onClose={() => setDeathInfo(null)}
            onUpdateFolder={(folder) =>
              updateConfig({ deathVideo: { ...config.deathVideo, localFolder: folder } })
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen select-none bg-[#0b0f17] text-[#f1f5f9] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
      {/* 1. Material 3 Top App Bar */}
      <header className="draggable h-12 px-4 bg-[#111724]/95 flex items-center justify-between border-b border-white/[0.06] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-500/20 via-amber-500/20 to-sky-500/10 border border-white/10 flex items-center justify-center p-1 shadow-sm overflow-hidden">
            <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
          </div>
          <span className="text-xs font-black tracking-wide text-white">
            {t.appTitle}
          </span>
          <button
            onClick={() => openSettings('updates')}
            title={updateInfo?.hasUpdate ? t.hasNewVersionDot : '点击查看版本与更新'}
            className="non-draggable relative flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 via-sky-500/15 to-emerald-500/15 text-amber-300 font-bold border border-amber-400/30 shadow-sm transition-all hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>v2.0.0 Pro</span>
            {updateInfo?.hasUpdate && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        <div className="non-draggable flex items-center gap-1.5">
          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            title={t.langToggleTitle}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 flex items-center gap-1 transition-all cursor-pointer mr-0.5"
          >
            <Globe className="w-3 h-3 text-sky-400" />
            <span>{t.langToggle}</span>
          </button>

          {/* Settings & About Button */}
          <button
            onClick={() => openSettings('algoConfig')}
            title="控制与设置中心 (算法权重/死亡视频/更新)"
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* In-Game Mini Bar Mode Button */}
          <button
            onClick={() => handleToggleMiniMode(true)}
            title="进入极简局内小胶囊模式 (380×52，不挡游戏对线)"
            className="w-7 h-7 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleAlwaysOnTop}
            title={config.alwaysOnTop ? t.unpin : t.alwaysOnTop}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              config.alwaysOnTop ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => WailsBridge.minimize()}
            title={t.minimize}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggleMaximize}
            title={isMaximized ? t.restore : t.maximize}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            {isMaximized ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="8" y="4" width="12" height="12" rx="1.5" />
                <path d="M4 8v10a2 2 0 0 0 2 2h10" />
              </svg>
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => WailsBridge.close()}
            title={t.close}
            className="w-7 h-7 rounded-full bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 hover:text-rose-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Material 3 Segmented Pill Tabs */}
      <div className="bg-[#0e131d] px-4 py-2 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-[#141b27] rounded-full border border-white/[0.06] text-xs shadow-inner">
          <button
            onClick={() => setActiveTab('automation')}
            className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'automation'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span>{t.tabAutomation}</span>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-full font-bold transition-all cursor-pointer relative ${
              activeTab === 'analysis'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.tabAnalysis}</span>
            {analysis && analysis.hasData && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.tabSearch}</span>
          </button>
        </div>

        {/* Quick Action to Algorithm Weight Config */}
        <button
          onClick={() => openSettings('algoConfig')}
          className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-amber-300/90 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
        >
          <Sliders className="w-3 h-3 text-amber-400" />
          <span>算法权重: {config.algorithm?.customWeightsEnabled ? '已自定义' : '官方平衡'}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="max-w-5xl mx-auto w-full space-y-3.5">
        {/* Client Status Hero Card */}
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#172236] via-[#131a29] to-[#0f1420] p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    status.connected ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]' : 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                  }`}
                />
                {status.connected && (
                  <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping opacity-60" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  {status.connected ? (
                    <>
                      <span>{t.clientReady}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        {t.port}: {status.port}
                      </span>
                    </>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {t.waitingClient}
                    </span>
                  )}
                </div>
                {status.summoner && (
                  <div className="text-[11px] text-amber-200/90 font-medium mt-1 flex items-center gap-1.5">
                    <span>{t.summoner}:</span>
                    <span className="font-bold text-white">{status.summoner.displayName || status.summoner.gameName}</span>
                    <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.2 rounded border border-white/10 font-mono">
                      {t.level}{status.summoner.summonerLevel}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {status.connected && (
              <div className="flex items-center gap-2">
                {status.phase === 'Lobby' && (
                  <button
                    onClick={() => WailsBridge.startMatchmaking()}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>{t.findMatch}</span>
                  </button>
                )}
                {status.phase === 'Matchmaking' && (
                  <button
                    onClick={() => WailsBridge.stopMatchmaking()}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-rose-400" />
                    <span>{t.cancelMatch}</span>
                  </button>
                )}
                {status.phase === 'ReadyCheck' && (
                  <button
                    onClick={() => WailsBridge.acceptMatch()}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/30 animate-pulse cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.acceptNow}</span>
                  </button>
                )}
                <div
                  className={`text-[11px] font-bold px-3 py-1 rounded-full border ${phaseInfo.color} flex items-center gap-1.5`}
                >
                  <Activity className="w-3 h-3" />
                  <span>{phaseInfo.text}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* TAB 1: Automation Controls */}
        {activeTab === 'automation' && (
          <>
            <section className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400/90 px-0.5 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span>{t.coreAutomation}</span>
              </div>

              {/* Toggle 1: Auto Accept */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#141b28] hover:border-sky-500/30 p-3.5 transition-all shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{t.autoAcceptTitle}</span>
                        {config.autoAccept && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                            {t.enabledBadge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {t.autoAcceptDesc}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => updateConfig({ autoAccept: !config.autoAccept })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.autoAccept ? 'bg-sky-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        config.autoAccept ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Accept Delay Slider */}
                {config.autoAccept && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        {t.humanDelay}
                      </span>
                      <span className="font-mono font-bold text-sky-400">
                        {config.acceptDelayMs} ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3000"
                      step="50"
                      value={config.acceptDelayMs}
                      onChange={(e) => updateConfig({ acceptDelayMs: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
                      <button
                        onClick={() => updateConfig({ acceptDelayMs: 0 })}
                        className="px-2 py-0.5 rounded-md hover:bg-white/5 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {t.delayInstant}
                      </button>
                      <button
                        onClick={() => updateConfig({ acceptDelayMs: 800 })}
                        className="px-2 py-0.5 rounded-md hover:bg-white/5 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {t.delayRecommended}
                      </button>
                      <button
                        onClick={() => updateConfig({ acceptDelayMs: 1800 })}
                        className="px-2 py-0.5 rounded-md hover:bg-white/5 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {t.delaySafe}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle 2: Auto Matchmaking with Member Selector */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#141b28] hover:border-amber-500/30 p-3.5 transition-all shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{t.autoQueueTitle}</span>
                        {config.autoQueue && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                            {t.enabledBadge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {t.autoQueueDesc}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => updateConfig({ autoQueue: !config.autoQueue })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.autoQueue ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        config.autoQueue ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Target Members Selector */}
                {config.autoQueue && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        {t.targetMembers}
                      </span>
                      <span className="font-mono font-bold text-amber-400">
                        {config.targetMembers === 0
                          ? t.targetMembersAny
                          : t.targetMembersWait.replace('{count}', String(config.targetMembers))}
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-1.5 text-[11px]">
                      {[
                        { label: t.memberAny, val: 0 },
                        { label: t.memberSolo, val: 1 },
                        { label: t.memberDuo, val: 2 },
                        { label: t.memberTrio, val: 3 },
                        { label: t.memberQuad, val: 4 },
                        { label: t.memberFull, val: 5 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          onClick={() => updateConfig({ targetMembers: item.val })}
                          className={`py-1.5 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                            config.targetMembers === item.val
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-sm'
                              : 'bg-black/30 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/15'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle 3: Auto Play Again & Skip Stats */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#141b28] hover:border-cyan-500/30 p-3.5 transition-all shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{t.autoPlayAgainTitle}</span>
                      {config.autoPlayAgain && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                          {t.enabledBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {t.autoPlayAgainDesc}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => updateConfig({ autoPlayAgain: !config.autoPlayAgain })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.autoPlayAgain ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      config.autoPlayAgain ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </section>

            {/* Real-time Activity Terminal / Logs */}
            <section className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-0.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  <span>{t.activityLogs}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({logs.length})</span>
                </div>
                <button
                  onClick={() => WailsBridge.clearLogs()}
                  className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-full hover:bg-white/5 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  {t.clearLogs}
                </button>
              </div>

              <div className="h-44 rounded-2xl border border-white/[0.06] bg-[#0c111a] p-3 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 shadow-inner">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
                    {t.noLogs}
                  </div>
                ) : (
                  logs.map((log, index) => {
                    let color = 'text-slate-300';
                    let badgeColor = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                    if (log.level === 'success') {
                      color = 'text-emerald-300';
                      badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
                    }
                    if (log.level === 'warn') {
                      color = 'text-amber-300';
                      badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
                    }
                    if (log.level === 'error') {
                      color = 'text-rose-300';
                      badgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
                    }
                    if (log.level === 'info') {
                      color = 'text-sky-300';
                      badgeColor = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
                    }

                    return (
                      <div key={index} className="flex items-start gap-2 break-all">
                        <span className="text-slate-500 shrink-0 font-normal">{log.time}</span>
                        <span className={`text-[9px] uppercase px-1 py-0.2 rounded border font-bold shrink-0 ${badgeColor}`}>
                          {log.level}
                        </span>
                        <span className={`${color} flex-1`}>{translateLog(log.message, lang)}</span>
                      </div>
                    );
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </section>
          </>
        )}

        {/* TAB 2: Match & Horse Analysis */}
        {activeTab === 'analysis' && (
          <div className="space-y-3">
            {/* Header with info notice */}
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100">{t.horseRadarTitle}</span>
                <span className="text-[10px] text-emerald-300 flex items-center gap-1 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                  <Info className="w-3 h-3" />
                  {t.localOnlyBadge}
                </span>
              </div>
              <button
                onClick={handleRefreshAnalysis}
                disabled={isRefreshingAnalysis}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-all px-2.5 py-1 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 cursor-pointer font-medium active:scale-95 shadow-sm"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingAnalysis ? 'animate-spin' : ''}`} />
                <span>{t.reAnalyze}</span>
              </button>
            </div>

            {/* Team filter chips (Material 3 Filter Chips) */}
            {analysis && analysis.hasData && (
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setTeamFilter('all')}
                  className={`px-3 py-1 rounded-full border transition-all cursor-pointer font-medium ${
                    teamFilter === 'all'
                      ? 'bg-sky-500/20 border-sky-400/60 text-sky-200 shadow-sm'
                      : 'bg-[#141b28] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {t.filterAll} ({analysis.blueTeam.length + analysis.redTeam.length})
                </button>
                <button
                  onClick={() => setTeamFilter('blue')}
                  className={`px-3 py-1 rounded-full border transition-all cursor-pointer font-medium ${
                    teamFilter === 'blue'
                      ? 'bg-sky-500/25 border-sky-400 text-sky-200 shadow-sm'
                      : 'bg-[#141b28] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {t.filterAlly} ({analysis.blueTeam.length})
                </button>
                {analysis.redTeam.length > 0 && (
                  <button
                    onClick={() => setTeamFilter('red')}
                    className={`px-3 py-1 rounded-full border transition-all cursor-pointer font-medium ${
                      teamFilter === 'red'
                        ? 'bg-rose-500/25 border-rose-400 text-rose-200 shadow-sm'
                        : 'bg-[#141b28] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    {t.filterEnemy} ({analysis.redTeam.length})
                  </button>
                )}
              </div>
            )}

            {/* Horse Report Console (Material 3 Elevated Card) */}
            {analysis && analysis.hasData && (
              <div className="rounded-2xl border border-amber-500/25 bg-[#141b28] p-3.5 space-y-2.5 shadow-lg backdrop-blur">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-amber-300 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>{t.reportTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSendChat}
                      disabled={isSendingChat}
                      title="直接调用客户端接口发至选人界面的队伍聊天框"
                      className="px-3 py-1 text-xs rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 flex items-center gap-1.5 transition-all cursor-pointer font-medium active:scale-95 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isSendingChat ? t.sending : t.sendChampSelect}</span>
                    </button>
                    <button
                      onClick={handleCopyReport}
                      title="复制后，进入游戏内按 Enter -> Ctrl+V 即可秒发"
                      className="px-3 py-1 text-xs rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 border border-white/[0.1] flex items-center gap-1.5 transition-all cursor-pointer font-medium active:scale-95"
                    >
                      {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
                      <span>{copiedReport ? t.copied : t.sendInGame}</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    rows={2}
                    className="w-full bg-[#0b0f17]/70 border border-white/[0.1] focus:border-amber-400/60 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none resize-none leading-relaxed transition-colors shadow-inner"
                    placeholder={t.reportPlaceholder}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                  <span>{t.reportTip}</span>
                </div>

                {chatFeedback && (
                  <div className={`text-xs flex items-center gap-1.5 ${chatFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {chatFeedback.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{chatFeedback.msg}</span>
                  </div>
                )}
              </div>
            )}

            {/* Analysis Content */}
            {!analysis || !analysis.hasData ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#141b28]/60 p-8 text-center space-y-2.5 backdrop-blur">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400 shadow-inner">
                  <Swords className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-100">
                  {t.noActiveMatch}
                </div>
                <div className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {t.noActiveMatchDesc}
                </div>
                {status.connected && (
                  <button
                    onClick={handleRefreshAnalysis}
                    className="mt-2 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:bg-sky-500/25 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t.tryDetect}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className={teamFilter === 'all' && analysis.redTeam.length > 0 ? 'grid grid-cols-1 lg:grid-cols-2 gap-3' : 'space-y-2.5'}>
                {/* Blue Team List */}
                {(teamFilter === 'all' || teamFilter === 'blue') && (
                  <div className="space-y-2.5">
                    {teamFilter === 'all' && analysis.redTeam.length > 0 && (
                      <div className="text-xs font-bold text-sky-300 px-0.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]"></span>
                        <span>{t.filterAlly} ({analysis.blueTeam.length})</span>
                      </div>
                    )}
                    {[...analysis.blueTeam]
                      .sort((a, b) => (b.isSelf ? 1 : 0) - (a.isSelf ? 1 : 0))
                      .map((p, i) => (
                        <PlayerHorseCard key={`blue-${i}`} player={p} t={t} />
                      ))}
                  </div>
                )}

                {/* Red Team List */}
                {(teamFilter === 'all' || teamFilter === 'red') && (
                  <div className="space-y-2.5">
                    {teamFilter === 'all' && analysis.redTeam.length > 0 && (
                      <div className="text-xs font-bold text-rose-300 px-0.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                        <span>{t.filterEnemy} ({analysis.redTeam.length})</span>
                      </div>
                    )}
                    {analysis.redTeam.map((p, i) => (
                      <PlayerHorseCard key={`red-${i}`} player={p} t={t} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Player Search & Individual Rating */}
        {activeTab === 'search' && (
          <PlayerSearchView
            t={t}
            clientConnected={status.connected}
            currentSummoner={status.summoner}
            onViewAlgorithm={() => openSettings('algorithm')}
          />
        )}
        </div>
      </div>

      {/* Footer (Material Design 3 Surface Bar) */}
      <footer className="h-7 px-3 bg-[#0c111a] border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-slate-400 font-medium">{t.backgroundActive}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openSettings('updates')}
            className="text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
            title={updateInfo?.hasUpdate ? t.hasNewVersionDot : t.settingsModalTitle}
          >
            <Settings className="w-3 h-3" />
            <span>{t.settingsModalTitle}</span>
            {updateInfo?.hasUpdate && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
          <span className="text-white/20">·</span>
          <div className="text-[10px] text-slate-500 font-mono font-medium">{t.footerBrand}</div>
        </div>
      </footer>

      {/* Settings & Control Center Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        initialTab={settingsTab}
        t={t}
        config={config}
        onUpdateConfig={updateConfig}
        updateInfo={updateInfo}
        isCheckingUpdate={isCheckingUpdate}
        isUpdating={isUpdating}
        updateProgress={updateProgress}
        onCheckUpdate={() => handleCheckUpdate(true)}
        onStartUpdate={handleStartUpdate}
      />

      {/* Death Video Overlay (Triggered on In-game Death) */}
      {deathInfo && config.deathVideo?.enabled && (
        <DeathVideoOverlay
          deathInfo={deathInfo}
          config={config.deathVideo}
          onClose={() => setDeathInfo(null)}
          onUpdateFolder={(folder) =>
            updateConfig({ deathVideo: { ...config.deathVideo, localFolder: folder } })
          }
        />
      )}

      {/* Floating Toast Notification (Rendered on top of all modals) */}
      {updateToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-full bg-[#091428]/95 border-2 border-[#c89b3c] shadow-2xl text-xs flex items-center gap-2 backdrop-blur pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
          {updateToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : updateToast.type === 'warn' ? (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 text-[#0ac8b9] animate-spin shrink-0" />
          )}
          <span className="text-[#f0e6d2] font-medium">{updateToast.msg}</span>
        </div>
      )}
    </div>
  );
}

// Single Player Horse Card Component (Material Design 3 Surface Container)
function PlayerHorseCard({ player, t }: { player: PlayerAnalysis; t: typeof translations.zh }) {
  const tier = player.horseTier;

  // 6-Tier Visual Theme Configuration with Material 3 Tonal Badges
  let badgeBg = 'bg-sky-500/15 border-sky-400/30 text-sky-300';
  let tierIcon = '🛡️';
  let tierDisplay = player.horseRank ? `${player.horseRank} · ${player.horseName}` : 'A 中等 · 中流砥柱';

  if (tier === 's_plus') {
    badgeBg = 'bg-gradient-to-r from-amber-500/25 via-fuchsia-500/20 to-amber-500/25 border-amber-400/60 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.25)] animate-pulse';
    tierIcon = '👑';
    tierDisplay = player.horseRank ? `${player.horseRank} · ${player.horseName}` : 'S+ 特等 · 降维通天代';
  } else if (tier === 's' || tier === 'top') {
    badgeBg = 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]';
    tierIcon = '⚔️';
    tierDisplay = player.horseRank ? `${player.horseRank} · ${player.horseName}` : 'S 上等 · 全场掌舵者';
  } else if (tier === 'a' || tier === 'mid') {
    badgeBg = 'bg-sky-500/15 border-sky-400/30 text-sky-300';
    tierIcon = '🛡️';
    tierDisplay = player.horseRank ? `${player.horseRank} · ${player.horseName}` : 'A 中等 · 中流砥柱';
  } else if (tier === 'b') {
    badgeBg = 'bg-amber-500/15 border-amber-400/30 text-amber-300';
    tierIcon = '⚠️';
    tierDisplay = player.horseRank ? `${player.horseRank} · ${player.horseName}` : 'B 次等 · 状态摇摆者';
  } else if (tier === 'c' || tier === 'bottom') {
    badgeBg = 'bg-orange-500/20 border-orange-400/40 text-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.2)]';
    tierIcon = '🚨';
    tierDisplay = player.horseRank ? `${player.horseRank} · ${player.horseName}` : 'C 下等 · 红温突破口';
  } else if (tier === 'd') {
    badgeBg = 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]';
    tierIcon = '🐮';
    tierDisplay = player.horseRank ? `${player.horseRank} · ${player.horseName}` : 'D 劣等 · 下水道纯牛马';
  }

  const winRateNum = player.winRate ?? 0;
  const avgKillsNum = player.avgKills ?? 0;
  const avgDeathsNum = player.avgDeaths ?? 0;
  const avgAssistsNum = player.avgAssists ?? 0;
  const kdaNum = player.kda ?? 0;
  const avgKpNum = player.avgKp ?? (avgKillsNum + avgAssistsNum);

  const avgDmgK = player.avgDamage ? (player.avgDamage / 1000).toFixed(1) : '0';
  const avgTankK = player.avgDamageTaken ? (player.avgDamageTaken / 1000).toFixed(1) : '0';
  const dmgShare = player.damageShare !== undefined ? player.damageShare.toFixed(0) : '20';
  const tankShare = player.damageTakenShare !== undefined ? player.damageTakenShare.toFixed(0) : '20';
  const guardianPct = player.guardianRatio !== undefined ? `${player.guardianRatio.toFixed(0)}%` : '0%';

  return (
    <div
      className={`rounded-2xl border p-3 transition-all duration-200 shadow-sm backdrop-blur ${
        player.team === 'blue'
          ? 'border-sky-500/25 bg-[#131a29]/90 hover:border-sky-400/45 hover:shadow-[0_4px_16px_rgba(56,189,248,0.12)]'
          : 'border-rose-500/25 bg-[#20121a]/90 hover:border-rose-400/45 hover:shadow-[0_4px_16px_rgba(244,63,94,0.12)]'
      }`}
    >
      {/* Header: Name, Rank, 6-Tier Rating Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
              player.team === 'blue' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {player.team === 'blue' ? t.allyBadge : t.enemyBadge}
          </span>
          {player.isSelf && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.2)]">
              {t.selfBadge}
            </span>
          )}
          <span className="text-xs font-semibold text-slate-100 truncate max-w-[150px] sm:max-w-[200px] md:max-w-xs flex items-baseline" title={player.summonerName}>
            {player.summonerName && player.summonerName !== '未知玩家' ? (
              player.summonerName.includes('#') ? (
                <>
                  <span className="truncate">{player.summonerName.split('#')[0]}</span>
                  <span className="text-[10px] text-slate-400 font-mono font-normal ml-0.5 shrink-0">
                    #{player.summonerName.split('#')[1]}
                  </span>
                </>
              ) : (
                player.summonerName
              )
            ) : (
              t.unknownPlayer
            )}
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[90px] px-1.5 py-0.5 rounded bg-white/[0.04]">
            {player.rankTier}
          </span>
        </div>

        {/* 6-Tier Unified Badge */}
        <div
          className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-transform ${badgeBg}`}
        >
          <span>{tierIcon}</span>
          <span>{tierDisplay}</span>
          {player.score !== undefined && (
            <span className="text-[10px] font-mono opacity-85 ml-0.5 font-semibold">({player.score}分)</span>
          )}
        </div>
      </div>

      {/* Row 1: 近N场胜率 & KDA & 参团贡献 */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#0b0f17]/60 rounded-xl p-2 text-[11px] mb-1.5 border border-white/[0.06]">
        <div>
          <div className="text-[10px] text-slate-400">
            {t.recentWr.replace('{count}', String(player.totalGames || 20))}
          </div>
          <div
            className={`font-mono font-bold text-xs mt-0.5 ${
              winRateNum >= 65 ? 'text-amber-300' : winRateNum >= 50 ? 'text-emerald-400' : winRateNum <= 35 ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {winRateNum.toFixed(0)}%{' '}
            <span className="text-[10px] font-normal text-slate-400">
              ({t.winLoss.replace('{wins}', String(player.wins || 0)).replace('{losses}', String(player.losses || 0))})
            </span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">{t.avgKda}</div>
          <div className="font-mono text-slate-200 text-xs mt-0.5">
            {avgKillsNum.toFixed(1)} / {avgDeathsNum.toFixed(1)} / {avgAssistsNum.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400">{t.avgKp}</div>
          <div className="font-mono font-bold text-sky-400 text-xs mt-0.5">
            {avgKpNum.toFixed(1)}
            <span className="text-[9px] font-normal text-slate-400 ml-1">
              ({t.kdaRatio} {kdaNum.toFixed(1)})
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: 核心战术占比排 (输出占比 & 承伤占比 & 守护者出装) */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#0b0f17]/40 rounded-lg px-2 py-1.5 text-[10px] mb-2 border border-white/[0.04] font-mono">
        <div className="flex items-center gap-1">
          <span className="text-slate-400">💥输出:</span>
          <span className="font-bold text-amber-300">{avgDmgK}k</span>
          <span className="text-[9px] text-slate-500">({dmgShare}%)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-400">🛡️承伤:</span>
          <span className="font-bold text-sky-300">{avgTankK}k</span>
          <span className="text-[9px] text-slate-500">({tankShare}%)</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <span className="text-slate-400">🎒守护者:</span>
          <span className={`font-semibold ${player.guardianRatio && player.guardianRatio >= 25 ? 'text-emerald-400' : 'text-slate-400'}`}>
            {guardianPct}
          </span>
        </div>
      </div>

      {/* Row 3: Top Champions & Highlights Tags */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 overflow-hidden">
          <span className="text-slate-400 shrink-0">{t.oftenPlays}</span>
          {player.topChampions && player.topChampions.length > 0 ? (
            player.topChampions.map((c, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.06] text-slate-300 truncate max-w-[95px] font-medium"
              >
                {c.championName} ({c.games}把 {(c.winRate ?? 0).toFixed(0)}%)
              </span>
            ))
          ) : (
            <span className="text-slate-500">{t.noData}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {player.tags &&
            player.tags.map((tagItem, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded-md border font-semibold flex items-center gap-0.5 ${
                  tagItem.includes('五杀') || tagItem.includes('🔥')
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_6px_rgba(251,191,36,0.2)]'
                    : tagItem.includes('⚠️')
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                }`}
              >
                {tagItem}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
