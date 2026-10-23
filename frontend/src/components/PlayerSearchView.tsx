import { useState, useEffect } from 'react';
import {
  Search,
  User,
  Loader2,
  Sparkles,
  Swords,
  Shield,
  Flame,
  Award,
  Crown,
  AlertTriangle,
  History,
  X,
  BookOpen,
} from 'lucide-react';
import type { PlayerAnalysis, SummonerInfo } from '../services/wailsBridge';
import { WailsBridge } from '../services/wailsBridge';
import type { translations } from '../i18n/translations';

interface PlayerSearchViewProps {
  t: (typeof translations)['zh'];
  clientConnected: boolean;
  currentSummoner?: SummonerInfo | null;
  onViewAlgorithm: () => void;
}

export function PlayerSearchView({
  t,
  clientConnected,
  currentSummoner,
  onViewAlgorithm,
}: PlayerSearchViewProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<PlayerAnalysis | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lol_helper_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (name: string) => {
    if (!name.trim()) return;
    try {
      const next = [name.trim(), ...recentSearches.filter((s) => s !== name.trim())].slice(0, 6);
      setRecentSearches(next);
      localStorage.setItem('lol_helper_recent_searches', JSON.stringify(next));
    } catch {
      // ignore localStorage errors
    }
  };

  const removeRecentSearch = (name: string) => {
    const next = recentSearches.filter((s) => s !== name);
    setRecentSearches(next);
    localStorage.setItem('lol_helper_recent_searches', JSON.stringify(next));
  };

  const handleSearch = async (targetQuery?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!clientConnected) {
      setErrorMsg(t.clientRequiredWarning);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await WailsBridge.searchPlayerAnalysis(q);
      if (res) {
        setResult(res);
        if (res.summonerName) {
          saveRecentSearch(res.summonerName);
        }
      } else {
        setErrorMsg(t.searchNoGames);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || t.searchFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSelf = () => {
    setQuery('');
    handleSearch('');
  };

  // If user hits Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Auto-fill self if empty initially
  useEffect(() => {
    if (clientConnected && !result && !query && currentSummoner?.displayName) {
      // Don't auto-fetch, but can show self as quick chip
    }
  }, [clientConnected]);

  // Color config for 6 tiers
  const getTierTheme = (tier: string) => {
    switch (tier) {
      case 's_plus':
        return {
          border: 'border-amber-400/80',
          bg: 'bg-gradient-to-br from-[#1c120c] via-[#091428] to-[#120824]',
          badge: 'bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 text-white',
          glow: 'bg-amber-400/20',
          textColor: 'text-amber-300',
        };
      case 's':
        return {
          border: 'border-amber-400/60',
          bg: 'bg-[#091428]',
          badge: 'bg-amber-500/20 border border-amber-400/40 text-amber-300',
          glow: 'bg-amber-500/15',
          textColor: 'text-amber-300',
        };
      case 'a':
        return {
          border: 'border-emerald-500/50',
          bg: 'bg-[#091428]',
          badge: 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300',
          glow: 'bg-emerald-500/15',
          textColor: 'text-emerald-300',
        };
      case 'b':
        return {
          border: 'border-cyan-500/50',
          bg: 'bg-[#091428]',
          badge: 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300',
          glow: 'bg-cyan-500/15',
          textColor: 'text-cyan-300',
        };
      case 'c':
        return {
          border: 'border-orange-500/50',
          bg: 'bg-[#091428]',
          badge: 'bg-orange-500/20 border border-orange-400/40 text-orange-300',
          glow: 'bg-orange-500/15',
          textColor: 'text-orange-300',
        };
      case 'd':
      default:
        return {
          border: 'border-rose-600/60',
          bg: 'bg-rose-950/20',
          badge: 'bg-rose-500/25 border border-rose-500/50 text-rose-300',
          glow: 'bg-rose-500/20',
          textColor: 'text-rose-300',
        };
    }
  };

  const theme = result ? getTierTheme(result.horseTier) : null;

  return (
    <div className="space-y-3.5 text-[#f0e6d2] pb-6 max-w-4xl mx-auto w-full">
      {/* 1. Search Box Card */}
      <section className="relative overflow-hidden rounded-xl border border-[#c89b3c]/40 bg-gradient-to-br from-[#0a1428] via-[#091428] to-[#010a13] p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#f0e6d2] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#c89b3c]" />
              <span>{t.searchTabTitle}</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              {t.searchTabDesc}
            </p>
          </div>

          <button
            onClick={onViewAlgorithm}
            className="text-[10px] text-[#c89b3c] hover:text-[#f0e6d2] flex items-center gap-1 bg-[#c89b3c]/15 hover:bg-[#c89b3c]/25 px-2 py-1 rounded border border-[#c89b3c]/30 transition-colors shrink-0 cursor-pointer"
            title={t.viewAlgorithmHelp}
          >
            <BookOpen className="w-3 h-3" />
            <span>{t.tabAlgorithm}</span>
          </button>
        </div>

        {/* Input Bar */}
        <div className="mt-3.5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.searchPlaceholder}
              disabled={isLoading}
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-black/60 border border-white/15 focus:border-[#c89b3c] focus:outline-none text-xs text-[#f0e6d2] placeholder:text-slate-500 font-sans transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="py-2 px-3.5 rounded-lg bg-gradient-to-r from-[#c89b3c] to-[#a87f28] hover:from-[#d8ab4c] hover:to-[#b88f38] text-black font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#c89b3c]/20 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>{isLoading ? t.searching : t.searchBtn}</span>
          </button>

          <button
            onClick={handleSearchSelf}
            disabled={isLoading || !clientConnected}
            className="py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 text-xs flex items-center justify-center gap-1 transition-colors shrink-0 cursor-pointer disabled:opacity-40"
            title={t.searchSelfBtn}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.searchSelfBtn}</span>
          </button>
        </div>

        {/* Client Offline Notice */}
        {!clientConnected && (
          <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/25 p-2.5 text-[11px] text-amber-300 leading-relaxed flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{t.clientRequiredWarning}</span>
          </div>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-slate-400 flex items-center gap-1 shrink-0">
              <History className="w-3 h-3 text-slate-400" />
              {t.searchRecent}
            </span>
            {recentSearches.map((name) => (
              <div
                key={name}
                className="group flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
              >
                <button
                  onClick={() => {
                    setQuery(name);
                    handleSearch(name);
                  }}
                  className="hover:text-[#c89b3c] cursor-pointer"
                >
                  {name}
                </button>
                <button
                  onClick={() => removeRecentSearch(name)}
                  className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  title="删除记录"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Search Result Showcase */}
      {result && theme && (
        <section className={`relative overflow-hidden rounded-xl border ${theme.border} ${theme.bg} p-4 shadow-2xl space-y-4`}>
          {/* Background Ambient Glow */}
          <div className={`absolute -top-16 -right-16 w-44 h-44 ${theme.glow} rounded-full blur-3xl pointer-events-none`} />

          {/* Hero Header */}
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-md shadow-sm ${theme.badge}`}>
                  {result.horseRank}
                </span>
                <span className={`text-sm font-bold ${theme.textColor}`}>
                  {result.horseName}
                </span>
                {(result.streak ?? 0) >= 3 && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold">
                    <Flame className="w-3 h-3 text-rose-400" />
                    {result.streak}连胜
                  </span>
                )}
                {result.isTilted && (
                  <span className="text-[10px] bg-rose-950/40 text-rose-400 border border-rose-600/50 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    当天连败红温
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs pt-1">
                <span className="text-base font-bold text-[#f0e6d2]">{result.summonerName}</span>
                <span className="text-slate-400 font-mono text-[11px] bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                  {result.rankTier || '段位未知'}
                </span>
              </div>
            </div>

            {/* Score Bubble */}
            <div className="text-right shrink-0">
              <div className="text-[10px] text-slate-400 font-medium">综合战力评分</div>
              <div className="text-2xl font-black font-mono text-[#c89b3c] flex items-baseline justify-end gap-0.5">
                <span>{result.score || 100}</span>
                <span className="text-xs font-normal text-slate-400">分</span>
              </div>
            </div>
          </div>

          {/* Tactical Tag / Highlights */}
          {result.horseTag && (
            <div className="rounded-lg bg-black/40 border border-white/10 p-2 text-xs text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#c89b3c] shrink-0" />
              <span>{result.horseTag}</span>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Win rate */}
            <div className="rounded-lg bg-black/40 border border-white/5 p-2.5 space-y-0.5">
              <div className="text-[10px] text-slate-400">近期战绩</div>
              <div className="text-sm font-bold text-[#f0e6d2] font-mono">
                {result.winRate.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                {result.wins}胜 {result.losses}负 ({result.totalGames}场)
              </div>
            </div>

            {/* KDA */}
            <div className="rounded-lg bg-black/40 border border-white/5 p-2.5 space-y-0.5">
              <div className="text-[10px] text-slate-400">场均 KDA</div>
              <div className="text-sm font-bold text-amber-300 font-mono">
                {result.kda.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                {result.avgKills.toFixed(1)} / {result.avgDeaths.toFixed(1)} / {result.avgAssists.toFixed(1)}
              </div>
            </div>

            {/* Damage Share */}
            <div className="rounded-lg bg-black/40 border border-white/5 p-2.5 space-y-0.5">
              <div className="text-[10px] text-slate-400">全队伤害占比</div>
              <div className="text-sm font-bold text-rose-300 font-mono">
                {result.damageShare !== undefined ? result.damageShare.toFixed(1) : '20.0'}%
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                均线: 20% · 场均 {result.avgDamage ? (result.avgDamage / 1000).toFixed(1) : 0}k
              </div>
            </div>

            {/* Damage Taken Share */}
            <div className="rounded-lg bg-black/40 border border-white/5 p-2.5 space-y-0.5">
              <div className="text-[10px] text-slate-400">全队承伤占比</div>
              <div className="text-sm font-bold text-cyan-300 font-mono">
                {result.damageTakenShare !== undefined ? result.damageTakenShare.toFixed(1) : '20.0'}%
              </div>
              <div
                className="text-[10px] text-slate-400 font-sans"
                title={result.guardianRatio && result.guardianRatio > 0 ? `守护者装备出装率: ${result.guardianRatio.toFixed(0)}%` : undefined}
              >
                均线: 20% · 场均 {result.avgDamageTaken ? (result.avgDamageTaken / 1000).toFixed(1) : 0}k
                {result.guardianRatio && result.guardianRatio >= 10 ? ` · 号角 ${result.guardianRatio.toFixed(0)}%` : ''}
              </div>
            </div>
          </div>

          {/* Highlights & Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(result.pentaCount ?? 0) > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center gap-1">
                <Crown className="w-3 h-3 text-purple-400" />
                五杀收割 x{result.pentaCount}
              </span>
            )}
            {(result.quadraCount ?? 0) > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-200">
                四杀 x{result.quadraCount}
              </span>
            )}
            {(result.avgTurretDamage ?? 0) > 2000 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                <Swords className="w-3 h-3 text-amber-400" />
                拆塔分奴 (场均{result.avgTurretDamage})
              </span>
            )}
            {result.tags &&
              result.tags.map((tg, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-sans"
                >
                  {tg}
                </span>
              ))}
          </div>

          {/* Top Champions */}
          {result.topChampions && result.topChampions.length > 0 && (
            <div className="rounded-lg bg-black/30 border border-white/5 p-3 space-y-2">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#0ac8b9]" />
                <span>近期常用英雄</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {result.topChampions.map((c) => (
                  <div
                    key={c.championId}
                    className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5 text-[11px]"
                  >
                    <span className="font-medium text-slate-200 truncate">{c.championName}</span>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-cyan-300 font-bold">{c.winRate.toFixed(0)}%</span>
                      <span className="text-[10px] text-slate-500 ml-1">({c.games}局)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Empty State / Search Guide */}
      {!result && !isLoading && !errorMsg && (
        <div className="rounded-xl border border-white/5 bg-[#091428]/40 p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#c89b3c]/10 border border-[#c89b3c]/20 flex items-center justify-center text-[#c89b3c] mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-300">{t.searchTabTitle}</h3>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            {t.searchEmptyHint}
          </p>
        </div>
      )}
    </div>
  );
}
