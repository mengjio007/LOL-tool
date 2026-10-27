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
  FolderOpen,
  Film,
  Volume2,
  Palette,
} from 'lucide-react';
import { translations, translateLog, type Language } from './i18n/translations';
import { PlayerSearchView } from './components/PlayerSearchView';
import { SettingsModal, type SettingsTab } from './components/SettingsModal';
import { InGameMiniBar } from './components/InGameMiniBar';
import { DeathVideoOverlay } from './components/DeathVideoOverlay';
import type { DeathInfo, VideoPlatform } from './services/wailsBridge';
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

  const [activeTab, setActiveTab] = useState<'automation' | 'video' | 'analysis' | 'search'>('automation');
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
    theme: 'hextech',
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
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

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
  const [platforms, setPlatforms] = useState<VideoPlatform[]>([]);
  const [activePlatformKey, setActivePlatformKey] = useState<string>('douyin');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const THEMES = [
    {
      id: 'azure' as const,
      name: '晴空蓝白',
      sub: 'Azure Light',
      desc: '纯白主体底色配明澈晴空蓝，清爽通透极高对比度（参考图1现代SaaS风格）',
      tag: '纯白主体·推荐',
      dots: ['#2563eb', '#38bdf8', '#ffffff'],
    },
    {
      id: 'iris' as const,
      name: '蓝紫白',
      sub: 'Iris Violet',
      desc: '纯白雅致底配双城星穹蓝紫，现代极简灵动设计（类似Linear/Dribbble现代风）',
      tag: '现代蓝紫',
      dots: ['#6366f1', '#a855f7', '#ffffff'],
    },
    {
      id: 'slate-white' as const,
      name: '极简白灰',
      sub: 'Slate White',
      desc: '纯白主体与高级石板冷灰构架，沉静克制无视觉疲劳（参考图2看板风格）',
      tag: '白灰极简',
      dots: ['#1e293b', '#64748b', '#f8fafc'],
    },
    {
      id: 'hextech' as const,
      name: '官方黑金',
      sub: 'Hextech Gold',
      desc: '海克斯深蓝与符文纯金高光，LOL官方原版典雅气质',
      tag: '暗黑电竞',
      dots: ['#c89b3c', '#0ac8b9', '#061022'],
    },
    {
      id: 'aurora' as const,
      name: '冷炭极光',
      sub: 'Aurora Frost',
      desc: '苹果深空冷炭灰与电竞极光湛蓝，纯粹高级护眼不晃',
      tag: '极简冷灰',
      dots: ['#38bdf8', '#818cf8', '#0d1117'],
    },
    {
      id: 'arcane' as const,
      name: '双城赛博',
      sub: 'Arcane Zaun',
      desc: '暗夜紫黑与炼金荧光翡翠绿撞色，极强电竞张力',
      tag: '高能电竞',
      dots: ['#00ff9d', '#c084fc', '#0d081a'],
    },
    {
      id: 'crimson' as const,
      name: '诺克萨斯',
      sub: 'Noxus Crimson',
      desc: '暗曜黑石与战神狂暴猩红，嗜血进攻型全红燃战',
      tag: '狂暴战血',
      dots: ['#ef4444', '#fbbf24', '#15080b'],
    },
  ];

  const currentTheme = THEMES.find((t) => t.id === (config.theme || 'azure')) || THEMES[0];

  // Sync active theme, font-scale, and window maximized state to html data attributes
  useEffect(() => {
    const activeTheme = config.theme || 'azure';
    document.documentElement.setAttribute('data-theme', activeTheme);
    const activeFontScale = config.fontScale || 'auto';
    document.documentElement.setAttribute('data-font-scale', activeFontScale);
    document.documentElement.setAttribute('data-maximized', isMaximized ? 'true' : 'false');
  }, [config.theme, config.fontScale, isMaximized]);

  // Dynamic Proportional UI Zoom Engine (整体等比自适应放大引擎)
  useEffect(() => {
    const updateDynamicScale = () => {
      const activeFontScale = config.fontScale || 'auto';
      if (activeFontScale !== 'auto') {
        document.documentElement.style.removeProperty('--dynamic-auto-scale');
        return;
      }

      const w = window.innerWidth;
      const h = window.innerHeight;

      // 智能计算自适应放大系数 (从默认小窗 1.0 到 1080p/2K/4K 整体放大 1.25 ~ 1.40)
      let targetScale = 1.0;
      if (isMaximized || w >= 1700) {
        // 最大化全屏或 1080p/2K/4K 大屏显示：按宽高空间舒适整体放大
        const vwFactor = Math.max(0, (w - 1000) * 0.00032);
        const vhFactor = Math.max(0, (h - 700) * 0.00030);
        targetScale = Math.min(1.42, Math.max(1.24, 1.0 + vwFactor + vhFactor));
      } else if (w >= 1300) {
        // 宽屏笔记本或中等视口：微幅提升至 1.10 ~ 1.20
        targetScale = Math.min(1.20, Math.max(1.06, 1.0 + (w - 1000) * 0.0003));
      } else if (w <= 980) {
        // 小窗：紧凑排版防溢出
        targetScale = Math.max(0.92, 0.92 + (w - 380) / 600 * 0.08);
      } else {
        targetScale = 1.0;
      }

      document.documentElement.style.setProperty('--dynamic-auto-scale', targetScale.toFixed(3));
    };

    updateDynamicScale();
    window.addEventListener('resize', updateDynamicScale);
    return () => window.removeEventListener('resize', updateDynamicScale);
  }, [isMaximized, config.fontScale]);

  // Click outside to close theme menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    if (showThemeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showThemeMenu]);

  // Load platforms from SQLite on video tab visit
  useEffect(() => {
    if (activeTab === 'video') {
      WailsBridge.getVideoPlatforms().then((list) => {
        if (list && list.length > 0) {
          setPlatforms(list);
          const act = list.find((p) => p.isActive);
          if (act) setActivePlatformKey(act.key);
        }
      });
    }
  }, [activeTab]);

  const handleSelectWebPlatform = async (key: string) => {
    setActivePlatformKey(key);
    await WailsBridge.setActiveVideoPlatform(key);
    const updated = await WailsBridge.getVideoPlatforms();
    setPlatforms(updated);
  };

  // 2.0 Live game death & respawn listeners
  useEffect(() => {
    const unsubDeath = WailsBridge.onPlayerDied((info) => {
      if (config.deathVideo?.enabled) {
        setDeathInfo(info);
        if (config.deathVideo.source === 'douyin') {
          WailsBridge.openWebVideoWindow();
        }
      }
    });

    const unsubRespawn = WailsBridge.onPlayerRespawned(() => {
      setDeathInfo(null);
      if (config.deathVideo?.autoCloseOnRespawn) {
        WailsBridge.closeWebVideoWindow();
      }
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

  // Auto-scroll logs INSIDE the terminal container ONLY (never affects outer page/header)
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Always reset scroll to top on tab switch so user is never stuck in the middle
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

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
    <div className="relative flex flex-col w-full h-full select-none bg-[var(--theme-bg)] text-[var(--theme-text,#f1f5f9)] border border-[var(--theme-border)] rounded-2xl overflow-hidden shadow-2xl transition-colors duration-300">
      {/* Ambient Background Glows */}
      <div className="aurora-orb-cyan -top-24 -left-24 w-80 h-80 opacity-70" />
      <div className="aurora-orb-indigo top-1/4 -right-20 w-96 h-96 opacity-60" />
      <div className="aurora-orb-rose -bottom-24 left-1/3 w-80 h-80 opacity-50" />

      {/* 1. Header Bar (Solid 100% Opaque, Theme-Branded) */}
      <header className="draggable shrink-0 h-12 px-4 bg-[var(--theme-header-bg)] flex items-center justify-between border-b border-[var(--theme-border)] relative z-20 shadow-md transition-colors duration-300">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-[var(--theme-border)] flex items-center justify-center p-1 shadow-sm overflow-hidden">
            <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
          </div>
          <span className="text-xs font-black tracking-wide text-white">
            {t.appTitle}
          </span>
          <button
            onClick={() => openSettings('updates')}
            title={updateInfo?.hasUpdate ? t.hasNewVersionDot : '点击查看版本与更新'}
            className="non-draggable relative flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full bg-[var(--theme-tab-pill-bg)] text-[var(--theme-primary)] font-bold border border-[var(--theme-border)] shadow-sm transition-all hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-[var(--theme-primary)]" />
            <span>v2.0.1 Pro</span>
            {updateInfo?.hasUpdate && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        <div className="non-draggable flex items-center gap-1.5">
          {/* Theme Switcher Dropdown */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemeMenu((prev) => !prev)}
              title="切换色彩风格 (官方黑金 / 冷炭极光 / 双城赛博 / 诺克萨斯)"
              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--theme-tab-pill-bg)] flex items-center gap-1.5 cursor-pointer text-[var(--theme-primary)] hover:brightness-110 border border-[var(--theme-border-highlight)]/50 shadow-sm"
            >
              <Palette className="w-3 h-3 text-[var(--theme-primary)]" />
              <span>{currentTheme.name}</span>
              <div className="flex items-center -space-x-1 ml-0.5">
                {currentTheme.dots.slice(0, 2).map((c, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full border border-black/60 shadow-sm"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[var(--theme-dropdown-bg)] p-2 shadow-2xl z-50 border border-[var(--theme-border-highlight)]/40 space-y-1.5 animate-in fade-in zoom-in-95 duration-150 shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 border-b border-[var(--theme-border)] flex items-center justify-between">
                  <span>选择色彩风格:</span>
                  <span className="text-[9px] text-[var(--theme-primary)] font-mono">秒级高亮实色</span>
                </div>
                {THEMES.map((th) => {
                  const isSelected = currentTheme.id === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => {
                        updateConfig({ theme: th.id });
                        setShowThemeMenu(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-white/10 border border-[var(--theme-border-highlight)] shadow-md'
                          : 'hover:bg-white/5 border border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex flex-col gap-1 mt-0.5 shrink-0">
                        <div className="flex items-center -space-x-1">
                          {th.dots.map((c, i) => (
                            <span
                              key={i}
                              className="w-2.5 h-2.5 rounded-full border border-black/50 shadow-sm"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-[var(--theme-primary)]' : 'text-slate-200'}`}>
                            {th.name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-slate-300 border border-white/5">{th.tag}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight mt-1 line-clamp-1">{th.desc}</p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[var(--theme-primary)] shrink-0 self-center" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            title={t.langToggleTitle}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold text-cyan-300 glass-pill flex items-center gap-1 cursor-pointer mr-0.5"
          >
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>{t.langToggle}</span>
          </button>

          {/* Settings & About Button */}
          <button
            onClick={() => openSettings('algoConfig')}
            title="控制与设置中心 (算法权重/更新/说明)"
            className="w-7 h-7 rounded-full glass-pill text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* In-Game Mini Bar Mode Button */}
          <button
            onClick={() => handleToggleMiniMode(true)}
            title="进入极简局内小胶囊模式 (380×52，不挡游戏对线)"
            className="w-7 h-7 rounded-full glass-pill text-cyan-300 hover:text-cyan-200 border-cyan-400/30 flex items-center justify-center cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          <button
            onClick={toggleAlwaysOnTop}
            title={config.alwaysOnTop ? t.unpin : t.alwaysOnTop}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              config.alwaysOnTop ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'glass-pill text-slate-400 hover:text-white'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => WailsBridge.minimize()}
            title={t.minimize}
            className="w-7 h-7 rounded-full glass-pill text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggleMaximize}
            title={isMaximized ? t.restore : t.maximize}
            className="w-7 h-7 rounded-full glass-pill text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
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
            className="w-7 h-7 rounded-full bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/40 text-rose-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Top-Level Segmented Tabs: 4 Capabilities in ONE ROW (Solid 100% Opaque, Theme-Branded) */}
      <div className="shrink-0 px-4 py-2.5 bg-[var(--theme-nav-bg)] border-b border-[var(--theme-border)] flex items-center justify-between relative z-10 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-1.5 p-1 bg-[var(--theme-tab-pill-bg)] border border-[var(--theme-border)] rounded-full text-xs shadow-inner">
          {/* Tab 1: Automation */}
          <button
            onClick={() => setActiveTab('automation')}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'automation'
                ? 'nav-tab-active'
                : 'nav-tab-inactive'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${activeTab === 'automation' ? '' : 'text-[var(--theme-primary)]'}`} />
            <span>{t.tabAutomation}</span>
          </button>

          {/* Tab 2: Death Video Entertainment */}
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-full font-bold transition-all cursor-pointer relative ${
              activeTab === 'video'
                ? 'nav-tab-active'
                : 'nav-tab-inactive'
            }`}
          >
            <Film className={`w-3.5 h-3.5 ${activeTab === 'video' ? '' : 'text-rose-400'}`} />
            <span>{t.tabVideo}</span>
            {config.deathVideo?.enabled && (
              <span className={`w-1.5 h-1.5 rounded-full ml-0.5 animate-pulse ${activeTab === 'video' ? 'bg-current' : 'bg-rose-400'}`} />
            )}
          </button>

          {/* Tab 3: Analysis */}
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-full font-bold transition-all cursor-pointer relative ${
              activeTab === 'analysis'
                ? 'nav-tab-active'
                : 'nav-tab-inactive'
            }`}
          >
            <Swords className={`w-3.5 h-3.5 ${activeTab === 'analysis' ? '' : 'text-amber-400'}`} />
            <span>{t.tabAnalysis}</span>
            {analysis && analysis.hasData && (
              <span className={`w-2 h-2 rounded-full ml-0.5 animate-pulse ${activeTab === 'analysis' ? 'bg-current' : 'bg-amber-400'}`} />
            )}
          </button>

          {/* Tab 4: Search */}
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-full font-bold transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'nav-tab-active'
                : 'nav-tab-inactive'
            }`}
          >
            <Search className={`w-3.5 h-3.5 ${activeTab === 'search' ? '' : 'text-indigo-400'}`} />
            <span>{t.tabSearch}</span>
          </button>
        </div>

        {/* Quick Action to Algorithm Weight Config */}
        <button
          onClick={() => openSettings('algoConfig')}
          className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer bg-[var(--theme-tab-pill-bg)] border border-[var(--theme-border)] hover:border-[var(--theme-border-highlight)] text-[var(--theme-primary)] shadow-sm transition-all"
        >
          <Sliders className="w-3 h-3" />
          <span>算法权重: {config.algorithm?.customWeightsEnabled ? '已自定义' : '官方平衡'}</span>
        </button>
      </div>

      {/* Main Content Area (min-h-0 prevents flexbox vertical clipping) */}
      <div ref={mainContentRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 relative z-10">
        <div className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto space-y-4 transition-all duration-300">
        {/* Client Status Hero Card */}
        <section className="relative overflow-hidden rounded-2xl glass-panel p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    status.connected ? 'bg-emerald-400 shadow-[0_0_14px_#34d399]' : 'bg-rose-500 shadow-[0_0_14px_#f43f5e]'
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
                      <span className="text-[10px] font-mono text-cyan-300 glass-pill px-2 py-0.5 rounded-md">
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
                    <span className="text-[10px] text-slate-300 glass-pill px-1.5 py-0.2 rounded font-mono">
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
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/25 cursor-pointer active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>{t.findMatch}</span>
                  </button>
                )}
                {status.phase === 'Matchmaking' && (
                  <button
                    onClick={() => WailsBridge.stopMatchmaking()}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer active:scale-95"
                  >
                    <Square className="w-3.5 h-3.5 fill-rose-400" />
                    <span>{t.cancelMatch}</span>
                  </button>
                )}
                {status.phase === 'ReadyCheck' && (
                  <button
                    onClick={() => WailsBridge.acceptMatch()}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/30 animate-pulse cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.acceptNow}</span>
                  </button>
                )}
                <div
                  className={`text-[11px] font-bold px-3 py-1 rounded-full border glass-pill ${phaseInfo.color} flex items-center gap-1.5`}
                >
                  <Activity className="w-3 h-3" />
                  <span>{phaseInfo.text}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* TAB 1: Automation & Capabilities Controls */}
        {activeTab === 'automation' && (
          <>
            <section className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-400/90 px-0.5 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.coreAutomation}</span>
              </div>

              {/* Toggle 1: Auto Accept */}
              <div className="glass-card rounded-2xl p-3.5 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400/25 text-cyan-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{t.autoAcceptTitle}</span>
                        {config.autoAccept && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
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
                      config.autoAccept ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-slate-700/60'
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
                  <div className="mt-3 pt-3 border-t border-white/[0.08]">
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        {t.humanDelay}
                      </span>
                      <span className="font-mono font-bold text-cyan-300">
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
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
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
              <div className="glass-card rounded-2xl p-3.5 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-400/25 text-amber-300 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{t.autoQueueTitle}</span>
                        {config.autoQueue && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
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
                      config.autoQueue ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'bg-slate-700/60'
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
                  <div className="mt-3 pt-3 border-t border-white/[0.08]">
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        {t.targetMembers}
                      </span>
                      <span className="font-mono font-bold text-amber-300">
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
                              ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold shadow-sm'
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
              <div className="glass-card rounded-2xl p-3.5 transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{t.autoPlayAgainTitle}</span>
                      {config.autoPlayAgain && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
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
                    config.autoPlayAgain ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : 'bg-slate-700/60'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      config.autoPlayAgain ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Capability 4: In-Game Mini Bar HUD Capsule */}
              <div className="glass-card rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 flex items-center justify-center shrink-0">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{t.miniModeToggleTitle}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 font-bold">
                        380 × 52 px
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {t.miniModeToggleDesc}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleMiniMode(true)}
                  className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 text-cyan-200 border border-cyan-400/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <Tv className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t.enterMiniModeBtn}</span>
                </button>
              </div>
            </section>

            {/* Real-time Activity Terminal / Logs */}
            <section className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-0.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t.activityLogs}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({logs.length})</span>
                </div>
                <button
                  onClick={() => WailsBridge.clearLogs()}
                  className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-full glass-pill cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  {t.clearLogs}
                </button>
              </div>

              <div ref={logsContainerRef} className="h-44 xl:h-64 2xl:h-72 rounded-2xl glass-panel p-3 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 shadow-inner">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
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
                      color = 'text-cyan-300';
                      badgeColor = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
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
              </div>
            </section>
          </>
        )}

        {/* TAB 2: Death Video Entertainment Capability (Dedicated View) */}
        {activeTab === 'video' && (
          <div className="space-y-3.5">
            {/* 1. Hero Master Card */}
            <div className="glass-card rounded-2xl p-4 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500/25 to-purple-500/25 border border-rose-400/40 text-rose-300 flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(244,63,94,0.3)]">
                    <Film className="w-5 h-5 text-rose-300" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{t.deathVideoCardTitle}</span>
                      {config.deathVideo?.enabled ? (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold shadow-sm flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                          <span>已启用 · {config.deathVideo.source === 'local' ? t.deathSourceLocal : t.deathSourceDouyin}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 font-medium">
                          未开启
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {t.deathVideoCardDesc}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    updateConfig({
                      deathVideo: { ...config.deathVideo, enabled: !config.deathVideo?.enabled },
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.deathVideo?.enabled ? 'bg-gradient-to-r from-rose-500 to-purple-600 shadow-[0_0_12px_rgba(244,63,94,0.4)]' : 'bg-slate-700/60'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      config.deathVideo?.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 2. Playback Source Configuration */}
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-cyan-400" />
                  <span>{t.deathSourceLabel}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  选择对局内阵亡时优先唤起的内容形态
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() =>
                    updateConfig({ deathVideo: { ...config.deathVideo, source: 'local' } })
                  }
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    config.deathVideo?.source === 'local'
                      ? 'border-amber-400/60 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'border-white/10 bg-black/30 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                    <FolderOpen className="w-4 h-4" />
                    <span>{t.deathSourceLocal}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    0ms 秒开无任何卡顿与广告，阵亡时随机抽取本地文件夹的一段视频切片播放。
                  </p>
                </button>

                <button
                  onClick={() =>
                    updateConfig({ deathVideo: { ...config.deathVideo, source: 'douyin' } })
                  }
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    config.deathVideo?.source === 'douyin'
                      ? 'border-cyan-400/60 bg-cyan-500/20 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                      : 'border-white/10 bg-black/30 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-cyan-300 text-xs">
                    <Globe className="w-4 h-4" />
                    <span>在线视频流平台 (SQLite 独立会话隔离)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    支持抖音、哔哩哔哩 (B站)、爱奇艺及自定义流，各站点登录信息持久化独立隔离。
                  </p>
                </button>
              </div>

              {/* Local Folder Selector */}
              {config.deathVideo?.source === 'local' && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] text-slate-300">本地视频文件夹路径:</div>
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/10">
                    <input
                      type="text"
                      readOnly
                      value={config.deathVideo.localFolder || ''}
                      placeholder={t.deathFolderPlaceholder}
                      className="flex-1 bg-transparent border-0 text-xs text-slate-200 px-1 font-mono truncate focus:outline-none"
                    />
                    <button
                      onClick={async () => {
                        const folder = await WailsBridge.selectDirectory();
                        if (folder) {
                          updateConfig({ deathVideo: { ...config.deathVideo, localFolder: folder } });
                        }
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>{t.deathSelectFolder}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    💡 提示: 支持放有 .mp4 或 .webm 格式的任意文件夹（如搞笑切片、鬼畜短片等）。
                  </p>
                </div>
              )}

              {/* SQLite Multi-Platform Web Video Capsule Preview */}
              {config.deathVideo?.source === 'douyin' && (
                <div className="space-y-3 pt-1">
                  {/* Platform Pills */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>选择播放平台:</span>
                      <span className="text-[10px] font-mono text-cyan-300/80 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-400/20">
                        ⚡ SQLite 本地引擎 · 平台会话独立持久化
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {platforms.map((p) => {
                        const isSelected = activePlatformKey === p.key;
                        return (
                          <button
                            key={p.key}
                            onClick={() => handleSelectWebPlatform(p.key)}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                                : 'bg-black/30 text-slate-400 border border-white/10 hover:text-white hover:border-white/20'
                            }`}
                          >
                            <span>{p.name}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Platform Detail Card */}
                  {(() => {
                    const currentPlatform = platforms.find((p) => p.key === activePlatformKey) || {
                      name: '抖音推荐流',
                      url: 'https://www.douyin.com/?recommend=1',
                      windowWidth: 1080,
                      windowHeight: 820,
                      profileDir: 'douyin_profile',
                    };

                    return (
                      <div className="bg-black/30 p-4 rounded-xl border border-cyan-400/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-bold text-white">{currentPlatform.name} · 极简画中画小窗</span>
                          </div>
                          <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/60 border border-cyan-400/30 px-2 py-0.5 rounded-full">
                            {currentPlatform.windowWidth} × {currentPlatform.windowHeight} 置顶 (Topmost)
                          </span>
                        </div>

                        <div className="space-y-1 font-mono text-[11px] text-slate-400 bg-black/40 p-2.5 rounded-lg border border-white/5">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-slate-500">直达URL:</span>
                            <span className="text-slate-200 truncate">{currentPlatform.url}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">数据目录:</span>
                            <span className="text-emerald-300">%APPDATA%\lol-helper\{currentPlatform.profileDir}</span>
                            <span className="text-[10px] text-emerald-400/80">(登录信息与浏览进度永久保存)</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          采用 Win32 底层全局最高层级置顶机制（HWND_TOPMOST），在无边框对局中绝不会被 LOL 游戏遮挡。登录一次后凭证永久保存在该平台的专属 SQLite / Profile 隔离目录中，后续阵亡直接秒开继续刷，复活毫秒级自动关闭。
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => WailsBridge.openWebVideoWindow(activePlatformKey)}
                            className="py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-400/40 text-cyan-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
                          >
                            <Globe className="w-3.5 h-3.5 text-cyan-400" />
                            <span>立即弹出 {currentPlatform.name} 测试 (体验流畅刷视频)</span>
                          </button>
                          <button
                            onClick={() => WailsBridge.closeWebVideoWindow()}
                            className="py-2 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                          >
                            关闭小窗
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* 3. Audio & Auto-Close Options */}
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-rose-400" />
                <span>声音输出与复活策略</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between gap-3 bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <span className="text-xs text-slate-300 flex items-center gap-1.5 shrink-0">
                    <span>{t.deathVolumeLabel}:</span>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.deathVideo?.volume ?? 40}
                    onChange={(e) =>
                      updateConfig({ deathVideo: { ...config.deathVideo, volume: Number(e.target.value) } })
                    }
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
                  />
                  <span className="font-mono text-xs font-bold text-rose-300 w-9 text-right">
                    {config.deathVideo?.volume ?? 40}%
                  </span>
                </div>

                <div className="flex items-center justify-between bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <span className="text-xs text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{t.deathAutoCloseLabel}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={config.deathVideo?.autoCloseOnRespawn ?? true}
                    onChange={(e) =>
                      updateConfig({ deathVideo: { ...config.deathVideo, autoCloseOnRespawn: e.target.checked } })
                    }
                    className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 4. Instant Action Simulation Testing */}
            <div className="glass-card rounded-2xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span>实时模拟测试 (无需开一把游戏)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  验证画中画弹窗、音频与复活自动销毁
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    WailsBridge.triggerTestDeath();
                    if (config.deathVideo?.enabled && config.deathVideo?.source === 'douyin') {
                      WailsBridge.openWebVideoWindow(activePlatformKey);
                    }
                  }}
                  className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-rose-500/20 to-purple-500/20 hover:from-rose-500/30 hover:to-purple-500/30 border border-rose-500/40 text-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  <span>{t.deathTestSimulateDeath}</span>
                </button>
                <button
                  onClick={() => {
                    WailsBridge.triggerTestRespawn();
                    WailsBridge.closeWebVideoWindow();
                  }}
                  className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.deathTestSimulateRespawn}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Match & Horse Analysis */}
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
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-all px-2.5 py-1 rounded-xl glass-pill cursor-pointer font-medium active:scale-95 shadow-sm"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingAnalysis ? 'animate-spin' : ''}`} />
                <span>{t.reAnalyze}</span>
              </button>
            </div>

            {/* Team filter chips (Frosted Glass Filter Chips) */}
            {analysis && analysis.hasData && (
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setTeamFilter('all')}
                  className={`px-3 py-1 rounded-full border transition-all cursor-pointer font-medium ${
                    teamFilter === 'all'
                      ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                      : 'glass-pill text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.filterAll} ({analysis.blueTeam.length + analysis.redTeam.length})
                </button>
                <button
                  onClick={() => setTeamFilter('blue')}
                  className={`px-3 py-1 rounded-full border transition-all cursor-pointer font-medium ${
                    teamFilter === 'blue'
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                      : 'glass-pill text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.filterAlly} ({analysis.blueTeam.length})
                </button>
                {analysis.redTeam.length > 0 && (
                  <button
                    onClick={() => setTeamFilter('red')}
                    className={`px-3 py-1 rounded-full border transition-all cursor-pointer font-medium ${
                      teamFilter === 'red'
                        ? 'bg-rose-500/25 border-rose-400 text-rose-200 shadow-[0_0_10px_rgba(251,113,133,0.25)]'
                        : 'glass-pill text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.filterEnemy} ({analysis.redTeam.length})
                  </button>
                )}
              </div>
            )}

            {/* Horse Report Console (Vibrancy Glass Card) */}
            {analysis && analysis.hasData && (
              <div className="rounded-2xl glass-card border border-amber-500/25 p-3.5 space-y-2.5 shadow-xl backdrop-blur">
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
                      className="px-3 py-1 text-xs rounded-xl glass-pill text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer font-medium active:scale-95"
                    >
                      {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{copiedReport ? t.copied : t.sendInGame}</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    rows={2}
                    className="w-full bg-black/40 border border-white/[0.1] focus:border-amber-400/60 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none resize-none leading-relaxed transition-colors shadow-inner"
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
              <div className="rounded-2xl glass-panel p-8 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/25 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
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
                    className="mt-2 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/25 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
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
                      <div className="text-xs font-bold text-cyan-300 px-0.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]"></span>
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
                        <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]"></span>
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

      {/* Footer (Solid 100% Opaque, Theme-Branded) */}
      <footer className="h-7 px-3 bg-[var(--theme-nav-bg)] border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-slate-400 relative z-10 transition-colors duration-300">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-slate-400 font-medium">{t.backgroundActive}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openSettings('updates')}
            className="text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
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

// Single Player Horse Card Component (macOS Vibrancy Frosted Glass)
function PlayerHorseCard({ player, t }: { player: PlayerAnalysis; t: typeof translations.zh }) {
  const tier = player.horseTier;

  // 6-Tier Visual Theme Configuration with Vibrancy Tonal Badges
  let badgeBg = 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300';
  let tierIcon = '🛡️';
  let tierDisplay = player.horseRank ? `${player.horseRank} · ${player.horseName}` : 'A 中等 · 中流砥柱';

  if (tier === 's_plus') {
    badgeBg = 'bg-gradient-to-r from-amber-400/30 via-fuchsia-500/25 to-indigo-500/30 border-amber-400/70 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.35)] animate-pulse';
    tierIcon = '👑';
    tierDisplay = player.horseRank ? `${player.horseRank} · ${player.horseName}` : 'S+ 特等 · 降维通天代';
  } else if (tier === 's' || tier === 'top') {
    badgeBg = 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]';
    tierIcon = '⚔️';
    tierDisplay = player.horseRank ? `${player.horseRank} · ${player.horseName}` : 'S 上等 · 全场掌舵者';
  } else if (tier === 'a' || tier === 'mid') {
    badgeBg = 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.2)]';
    tierIcon = '🛡️';
    tierDisplay = player.horseRank ? `${player.horseRank} · ${player.horseName}` : 'A 中等 · 中流砥柱';
  } else if (tier === 'b') {
    badgeBg = 'bg-amber-500/15 border-amber-400/35 text-amber-300';
    tierIcon = '⚠️';
    tierDisplay = player.horseRank ? `${player.horseRank} · ${player.horseName}` : 'B 次等 · 状态摇摆者';
  } else if (tier === 'c' || tier === 'bottom') {
    badgeBg = 'bg-orange-500/20 border-orange-400/45 text-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.2)]';
    tierIcon = '🚨';
    tierDisplay = player.horseRank ? `${player.horseRank} · ${player.horseName}` : 'C 下等 · 红温突破口';
  } else if (tier === 'd') {
    badgeBg = 'bg-rose-500/25 border-rose-500/60 text-rose-300 shadow-[0_0_14px_rgba(244,63,94,0.3)]';
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
      className={`rounded-2xl glass-card p-3 transition-all duration-200 ${
        player.team === 'blue'
          ? 'border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-[0_8px_24px_rgba(34,211,238,0.18)]'
          : 'border-rose-500/30 hover:border-rose-400/50 hover:shadow-[0_8px_24px_rgba(251,113,133,0.18)]'
      }`}
    >
      {/* Header: Name, Rank, 6-Tier Rating Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
              player.team === 'blue' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
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
          <span className="text-[10px] text-slate-300 font-mono truncate max-w-[90px] px-1.5 py-0.5 rounded glass-pill">
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
      <div className="grid grid-cols-3 gap-1.5 bg-black/40 rounded-xl p-2 text-[11px] mb-1.5 border border-white/[0.06]">
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
          <div className="font-mono font-bold text-cyan-300 text-xs mt-0.5">
            {avgKpNum.toFixed(1)}
            <span className="text-[9px] font-normal text-slate-400 ml-1">
              ({t.kdaRatio} {kdaNum.toFixed(1)})
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: 核心战术占比排 (输出占比 & 承伤占比 & 守护者出装) */}
      <div className="grid grid-cols-3 gap-1.5 bg-black/25 rounded-lg px-2 py-1.5 text-[10px] mb-2 border border-white/[0.04] font-mono">
        <div className="flex items-center gap-1">
          <span className="text-slate-400">💥输出:</span>
          <span className="font-bold text-amber-300">{avgDmgK}k</span>
          <span className="text-[9px] text-slate-500">({dmgShare}%)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-400">🛡️承伤:</span>
          <span className="font-bold text-cyan-300">{avgTankK}k</span>
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
                className="px-2 py-0.5 rounded-md glass-pill text-slate-300 truncate max-w-[95px] font-medium"
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
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30'
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
