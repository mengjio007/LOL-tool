import { useEffect, useState, useRef } from 'react';
import {
  WailsBridge,
} from './services/wailsBridge';
import type {
  Config,
  ServiceStatus,
  LogEntry,
  MatchAnalysisResult,
  PlayerAnalysis
} from './services/wailsBridge';
import {
  Shield,
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
  Flame,
  Info,
  MessageSquare,
  Send,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import { translations, translateLog, type Language } from './i18n/translations';

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

  const [activeTab, setActiveTab] = useState<'automation' | 'analysis'>('automation');
  const [teamFilter, setTeamFilter] = useState<'all' | 'blue' | 'red'>('all');
  const [isRefreshingAnalysis, setIsRefreshingAnalysis] = useState(false);

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

  return (
    <div className="flex flex-col h-screen select-none bg-[#010a13] text-[#f0e6d2] border border-[#c89b3c]/30 rounded-lg overflow-hidden shadow-2xl">
      {/* 1. Custom Title Bar */}
      <header className="draggable h-10 px-3 bg-[#091428]/95 flex items-center justify-between border-b border-[#c89b3c]/20">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[#c89b3c]/20 border border-[#c89b3c]/40 text-[#c89b3c]">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-wider text-[#f0e6d2]">{t.appTitle}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#c89b3c]/15 text-[#c89b3c] font-mono border border-[#c89b3c]/30">
            {t.version}
          </span>
        </div>

        <div className="non-draggable flex items-center gap-1.5">
          {/* Language Toggle Button */}
          <button
            onClick={toggleLang}
            title={t.langToggleTitle}
            className="px-2 py-0.5 rounded text-[11px] font-semibold text-[#c89b3c] bg-[#c89b3c]/15 hover:bg-[#c89b3c]/30 border border-[#c89b3c]/40 flex items-center gap-1 transition-colors cursor-pointer mr-1"
          >
            <Globe className="w-3 h-3 text-[#c89b3c]" />
            <span>{t.langToggle}</span>
          </button>

          <button
            onClick={toggleAlwaysOnTop}
            title={config.alwaysOnTop ? t.unpin : t.alwaysOnTop}
            className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
              config.alwaysOnTop ? 'text-[#0ac8b9]' : 'text-slate-400'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => WailsBridge.minimize()}
            title={t.minimize}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => WailsBridge.close()}
            title={t.close}
            className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Top Nav Tabs */}
      <div className="flex items-center bg-[#06101e] px-3 border-b border-white/5 text-xs">
        <button
          onClick={() => setActiveTab('automation')}
          className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors ${
            activeTab === 'automation'
              ? 'border-[#c89b3c] text-[#f0e6d2]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-[#c89b3c]" />
          <span>{t.tabAutomation}</span>
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition-colors relative ${
            activeTab === 'analysis'
              ? 'border-[#0ac8b9] text-[#f0e6d2]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Swords className="w-3.5 h-3.5 text-[#0ac8b9]" />
          <span>{t.tabAnalysis}</span>
          {analysis && analysis.hasData && (
            <span className="w-2 h-2 rounded-full bg-[#0ac8b9] animate-pulse" />
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
        {/* Client Status Hero Card */}
        <section className="relative overflow-hidden rounded-xl border border-[#c89b3c]/30 bg-gradient-to-br from-[#0a1428]/90 via-[#0a1428]/60 to-[#010a13] p-3 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-3 h-3 rounded-full ${
                    status.connected ? 'bg-[#0ac8b9] shadow-[0_0_12px_#0ac8b9]' : 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                  }`}
                />
                {status.connected && (
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#0ac8b9] animate-ping opacity-60" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold flex items-center gap-2">
                  {status.connected ? (
                    <>
                      <span>{t.clientReady}</span>
                      <span className="text-[11px] font-normal text-slate-400 font-mono">
                        ({t.port}: {status.port})
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
                  <div className="text-[11px] text-amber-200/90 font-medium mt-0.5">
                    {t.summoner}: {status.summoner.displayName || status.summoner.gameName}{' '}
                    <span className="text-[10px] text-slate-400">({t.level}{status.summoner.summonerLevel})</span>
                  </div>
                )}
              </div>
            </div>

            {status.connected && (
              <div className="flex items-center gap-2">
                {status.phase === 'Lobby' && (
                  <button
                    onClick={() => WailsBridge.startMatchmaking()}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#c89b3c]/20 hover:bg-[#c89b3c]/35 text-[#f0e6d2] border border-[#c89b3c]/50 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-[#c89b3c] fill-[#c89b3c]" />
                    <span>{t.findMatch}</span>
                  </button>
                )}
                {status.phase === 'Matchmaking' && (
                  <button
                    onClick={() => WailsBridge.stopMatchmaking()}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <Square className="w-3 h-3 text-rose-400 fill-rose-400" />
                    <span>{t.cancelMatch}</span>
                  </button>
                )}
                {status.phase === 'ReadyCheck' && (
                  <button
                    onClick={() => WailsBridge.acceptMatch()}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500/30 hover:bg-emerald-500/45 text-emerald-200 border border-emerald-500/50 flex items-center gap-1.5 transition-colors shadow-sm animate-pulse cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{t.acceptNow}</span>
                  </button>
                )}
                <div
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${phaseInfo.color} flex items-center gap-1.5`}
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
            <section className="space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#c89b3c]/80 px-0.5 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#c89b3c]" />
                <span>{t.coreAutomation}</span>
              </div>

              {/* Toggle 1: Auto Accept */}
              <div className="rounded-xl border border-white/5 bg-[#091428]/70 hover:border-[#c89b3c]/30 p-3 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-[#f0e6d2] flex items-center gap-2">
                      <span>{t.autoAcceptTitle}</span>
                      {config.autoAccept && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {t.enabledBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {t.autoAcceptDesc}
                    </div>
                  </div>

                  <button
                    onClick={() => updateConfig({ autoAccept: !config.autoAccept })}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.autoAccept ? 'bg-[#0ac8b9]' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        config.autoAccept ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Accept Delay Slider */}
                {config.autoAccept && (
                  <div className="mt-3 pt-2.5 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#c89b3c]" />
                        {t.humanDelay}
                      </span>
                      <span className="font-mono font-bold text-[#0ac8b9]">
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
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#0ac8b9]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <button
                        onClick={() => updateConfig({ acceptDelayMs: 0 })}
                        className="hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {t.delayInstant}
                      </button>
                      <button
                        onClick={() => updateConfig({ acceptDelayMs: 800 })}
                        className="hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {t.delayRecommended}
                      </button>
                      <button
                        onClick={() => updateConfig({ acceptDelayMs: 1800 })}
                        className="hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        {t.delaySafe}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle 2: Auto Matchmaking with Member Selector */}
              <div className="rounded-xl border border-white/5 bg-[#091428]/70 hover:border-[#c89b3c]/30 p-3 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-[#f0e6d2] flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#c89b3c]" />
                      <span>{t.autoQueueTitle}</span>
                      {config.autoQueue && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {t.enabledBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {t.autoQueueDesc}
                    </div>
                  </div>

                  <button
                    onClick={() => updateConfig({ autoQueue: !config.autoQueue })}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config.autoQueue ? 'bg-[#0ac8b9]' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        config.autoQueue ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Target Members Selector */}
                {config.autoQueue && (
                  <div className="mt-3 pt-2.5 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#c89b3c]" />
                        {t.targetMembers}
                      </span>
                      <span className="font-mono font-bold text-[#0ac8b9]">
                        {config.targetMembers === 0
                          ? t.targetMembersAny
                          : t.targetMembersWait.replace('{count}', String(config.targetMembers))}
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-1 text-[11px]">
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
                          className={`py-1 rounded border text-center transition-all cursor-pointer ${
                            config.targetMembers === item.val
                              ? 'bg-[#c89b3c]/25 border-[#c89b3c] text-[#f0e6d2] font-semibold shadow-sm'
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
              <div className="rounded-xl border border-white/5 bg-[#091428]/70 hover:border-[#c89b3c]/30 p-3 transition-colors flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-[#f0e6d2] flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-[#c89b3c]" />
                    <span>{t.autoPlayAgainTitle}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {t.autoPlayAgainDesc}
                  </div>
                </div>

                <button
                  onClick={() => updateConfig({ autoPlayAgain: !config.autoPlayAgain })}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.autoPlayAgain ? 'bg-[#0ac8b9]' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      config.autoPlayAgain ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </section>

            {/* Real-time Activity Terminal / Logs */}
            <section className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between px-0.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#c89b3c]/80 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#c89b3c]" />
                  <span>{t.activityLogs}</span>
                  <span className="text-[10px] text-slate-500 font-normal">({logs.length})</span>
                </div>
                <button
                  onClick={() => WailsBridge.clearLogs()}
                  className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-white/5 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  {t.clearLogs}
                </button>
              </div>

              <div className="h-40 rounded-xl border border-white/5 bg-[#03080e] p-2.5 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 shadow-inner">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
                    {t.noLogs}
                  </div>
                ) : (
                  logs.map((log, index) => {
                    let color = 'text-slate-300';
                    if (log.level === 'success') color = 'text-emerald-400';
                    if (log.level === 'warn') color = 'text-amber-400';
                    if (log.level === 'error') color = 'text-rose-400';
                    if (log.level === 'info') color = 'text-cyan-300/90';

                    return (
                      <div key={index} className="flex items-start gap-2 break-all">
                        <span className="text-slate-600 shrink-0 font-normal">{log.time}</span>
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
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#f0e6d2]">{t.horseRadarTitle}</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <Info className="w-3 h-3" />
                  {t.localOnlyBadge}
                </span>
              </div>
              <button
                onClick={handleRefreshAnalysis}
                disabled={isRefreshingAnalysis}
                className="text-[11px] text-[#0ac8b9] hover:text-[#0ac8b9]/80 flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-[#0ac8b9]/10 border border-[#0ac8b9]/30 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingAnalysis ? 'animate-spin' : ''}`} />
                <span>{t.reAnalyze}</span>
              </button>
            </div>

            {/* Team filter chips */}
            {analysis && analysis.hasData && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  onClick={() => setTeamFilter('all')}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    teamFilter === 'all'
                      ? 'bg-[#c89b3c]/20 border-[#c89b3c] text-[#f0e6d2]'
                      : 'bg-black/20 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.filterAll} ({analysis.blueTeam.length + analysis.redTeam.length})
                </button>
                <button
                  onClick={() => setTeamFilter('blue')}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    teamFilter === 'blue'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                      : 'bg-black/20 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.filterAlly} ({analysis.blueTeam.length})
                </button>
                {analysis.redTeam.length > 0 && (
                  <button
                    onClick={() => setTeamFilter('red')}
                    className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      teamFilter === 'red'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                        : 'bg-black/20 border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.filterEnemy} ({analysis.redTeam.length})
                  </button>
                )}
              </div>
            )}

            {/* Horse Report Console (Manual Trigger Only) */}
            {analysis && analysis.hasData && (
              <div className="rounded-xl border border-amber-500/25 bg-[#0a1428]/85 p-3 space-y-2 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.reportTitle}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSendChat}
                      disabled={isSendingChat}
                      title="直接调用客户端接口发至选人界面的队伍聊天框"
                      className="px-2.5 py-1 text-[11px] rounded bg-[#c89b3c]/25 hover:bg-[#c89b3c]/40 text-[#f0e6d2] border border-[#c89b3c]/50 flex items-center gap-1 transition-all cursor-pointer font-medium disabled:opacity-50"
                    >
                      <Send className="w-3 h-3 text-[#c89b3c]" />
                      <span>{isSendingChat ? t.sending : t.sendChampSelect}</span>
                    </button>
                    <button
                      onClick={handleCopyReport}
                      title="复制后，进入游戏内按 Enter -> Ctrl+V 即可秒发"
                      className="px-2.5 py-1 text-[11px] rounded bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 flex items-center gap-1 transition-all cursor-pointer font-medium"
                    >
                      {copiedReport ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#0ac8b9]" />}
                      <span>{copiedReport ? t.copied : t.sendInGame}</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    rows={2}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
                    placeholder={t.reportPlaceholder}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                  <span>{t.reportTip}</span>
                </div>

                {chatFeedback && (
                  <div className={`text-[11px] flex items-center gap-1.5 ${chatFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {chatFeedback.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    <span>{chatFeedback.msg}</span>
                  </div>
                )}
              </div>
            )}

            {/* Analysis Content */}
            {!analysis || !analysis.hasData ? (
              <div className="rounded-xl border border-white/5 bg-[#03080e] p-8 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-[#0ac8b9]/10 border border-[#0ac8b9]/30 flex items-center justify-center mx-auto text-[#0ac8b9]">
                  <Swords className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {t.noActiveMatch}
                </div>
                <div className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {t.noActiveMatchDesc}
                </div>
                {status.connected && (
                  <button
                    onClick={handleRefreshAnalysis}
                    className="mt-2 px-3 py-1 text-[11px] rounded bg-[#c89b3c]/20 border border-[#c89b3c]/50 text-[#f0e6d2] hover:bg-[#c89b3c]/30 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-[#c89b3c]" />
                    <span>{t.tryDetect}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Blue Team List */}
                {(teamFilter === 'all' || teamFilter === 'blue') &&
                  [...analysis.blueTeam]
                    .sort((a, b) => (b.isSelf ? 1 : 0) - (a.isSelf ? 1 : 0))
                    .map((p, i) => (
                      <PlayerHorseCard key={`blue-${i}`} player={p} t={t} />
                    ))}

                {/* Red Team List */}
                {(teamFilter === 'all' || teamFilter === 'red') && analysis.redTeam.map((p, i) => (
                  <PlayerHorseCard key={`red-${i}`} player={p} t={t} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="h-7 px-3 bg-[#091428]/60 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>{t.backgroundActive}</span>
        </div>
        <div>{t.footerBrand}</div>
      </footer>
    </div>
  );
}

// Single Player Horse Card Component
function PlayerHorseCard({ player, t }: { player: PlayerAnalysis; t: typeof translations.zh }) {
  const isTop = player.horseTier === 'top';
  const isBottom = player.horseTier === 'bottom';

  const badgeBg = isTop
    ? 'bg-gradient-to-r from-amber-500/25 via-emerald-500/20 to-amber-500/25 border-amber-500/60 text-amber-300 shadow-[0_0_8px_rgba(200,155,60,0.25)]'
    : isBottom
    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300';

  const horseIcon = isTop ? '🐎' : isBottom ? '🐴' : '🐎';
  const horseLabel = isTop ? t.topHorse : isBottom ? t.bottomHorse : t.midHorse;

  const winRateNum = player.winRate ?? 0;
  const avgKillsNum = player.avgKills ?? 0;
  const avgDeathsNum = player.avgDeaths ?? 0;
  const avgAssistsNum = player.avgAssists ?? 0;
  const kdaNum = player.kda ?? 0;
  const avgKpNum = player.avgKp ?? (avgKillsNum + avgAssistsNum);

  return (
    <div
      className={`rounded-xl border p-2.5 transition-all shadow-sm ${
        player.team === 'blue'
          ? 'border-cyan-500/20 bg-[#091428]/75 hover:border-cyan-500/40'
          : 'border-rose-500/20 bg-[#160a14]/75 hover:border-rose-500/40'
      }`}
    >
      {/* Header: Name, Rank, Horse Rating */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span
            className={`text-[10px] px-1 py-0.2 rounded font-bold ${
              player.team === 'blue' ? 'bg-cyan-500/25 text-cyan-300' : 'bg-rose-500/25 text-rose-300'
            }`}
          >
            {player.team === 'blue' ? t.allyBadge : t.enemyBadge}
          </span>
          {player.isSelf && (
            <span className="text-[10px] px-1 py-0.2 rounded font-bold bg-amber-500/25 text-amber-300 border border-amber-500/40 shrink-0">
              {t.selfBadge}
            </span>
          )}
          <span className="text-xs font-semibold text-[#f0e6d2] truncate max-w-[170px] flex items-baseline" title={player.summonerName}>
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
          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[100px]">
            {player.rankTier}
          </span>
        </div>

        <div
          className={`px-2 py-0.5 rounded-full border text-[11px] font-bold flex items-center gap-1 shrink-0 ${badgeBg}`}
        >
          <span>{horseIcon}</span>
          <span>{horseLabel}</span>
          <span className="text-[10px] font-normal opacity-85">· {player.horseTag}</span>
        </div>
      </div>

      {/* Stats summary: 近N场胜率 & KDA & 参团贡献 */}
      <div className="grid grid-cols-3 gap-1 bg-black/40 rounded-lg p-1.5 text-[11px] mb-1.5 border border-white/5">
        <div>
          <div className="text-[10px] text-slate-500">
            {t.recentWr.replace('{count}', String(player.totalGames || 20))}
          </div>
          <div
            className={`font-mono font-bold ${
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
          <div className="text-[10px] text-slate-500">{t.avgKda}</div>
          <div className="font-mono text-slate-200">
            {avgKillsNum.toFixed(1)} / {avgDeathsNum.toFixed(1)} / {avgAssistsNum.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500">{t.avgKp}</div>
          <div className="font-mono font-bold text-[#0ac8b9]">
            {avgKpNum.toFixed(1)}
            <span className="text-[9px] font-normal text-slate-400 ml-1">
              ({t.kdaRatio} {kdaNum.toFixed(1)})
            </span>
          </div>
        </div>
      </div>

      {/* Top Champions & Tags */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 overflow-hidden">
          <span className="text-slate-500 shrink-0">{t.oftenPlays}</span>
          {player.topChampions && player.topChampions.length > 0 ? (
            player.topChampions.map((c, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-300 truncate max-w-[100px]"
              >
                {c.championName} ({c.games}把 {(c.winRate ?? 0).toFixed(0)}%)
              </span>
            ))
          ) : (
            <span className="text-slate-600">{t.noData}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {player.tags &&
            player.tags.map((tagItem, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded bg-[#c89b3c]/15 text-[#c89b3c] border border-[#c89b3c]/30 font-semibold flex items-center gap-0.5"
              >
                {tagItem.includes('🔥') && <Flame className="w-2.5 h-2.5 text-amber-400" />}
                {tagItem}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
