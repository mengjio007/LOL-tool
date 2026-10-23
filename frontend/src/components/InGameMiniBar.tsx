import { useState } from 'react';
import { Maximize2, X, Minus, Flame } from 'lucide-react';
import type { PlayerAnalysis } from '../services/wailsBridge';
import appLogo from '../assets/appicon.png';

interface InGameMiniBarProps {
  players: PlayerAnalysis[];
  onRestore: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export function InGameMiniBar({
  players,
  onRestore,
  onMinimize,
  onClose,
}: InGameMiniBarProps) {
  const [hoveredPlayer, setHoveredPlayer] = useState<PlayerAnalysis | null>(null);

  // Get color by tier
  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 's_plus':
        return {
          bg: 'bg-gradient-to-r from-amber-500/30 to-yellow-500/20 border-amber-400 text-amber-200',
          label: 'S+',
          shadow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]',
        };
      case 's':
        return {
          bg: 'bg-emerald-500/20 border-emerald-400 text-emerald-300',
          label: 'S',
          shadow: 'shadow-[0_0_6px_rgba(52,211,153,0.3)]',
        };
      case 'a':
        return {
          bg: 'bg-cyan-500/20 border-cyan-400 text-cyan-300',
          label: 'A',
          shadow: '',
        };
      case 'b':
        return {
          bg: 'bg-blue-500/20 border-blue-400 text-blue-300',
          label: 'B',
          shadow: '',
        };
      case 'c':
        return {
          bg: 'bg-orange-500/20 border-orange-400 text-orange-300',
          label: 'C',
          shadow: '',
        };
      case 'd':
      default:
        return {
          bg: 'bg-rose-500/20 border-rose-500 text-rose-300',
          label: 'D',
          shadow: 'shadow-[0_0_6px_rgba(244,63,94,0.3)]',
        };
    }
  };

  const allyList = players.length > 0 ? players.slice(0, 5) : [];

  return (
    <div
      style={{ '--wails-draggable': 'drag' } as React.CSSProperties}
      className="w-full h-full glass-panel border border-cyan-400/35 rounded-2xl px-2.5 py-1.5 flex items-center justify-between shadow-[0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl select-none relative overflow-hidden"
    >
      {/* Brand & Mini Icon */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 border border-white/10 flex items-center justify-center p-0.5">
          <img src={appLogo} alt="Logo" className="w-full h-full object-contain" />
        </div>
        <span className="text-[10px] font-bold text-cyan-300 hidden sm:inline tracking-wide">战力胶囊</span>
      </div>

      {/* 5 Teammates Fast Badges */}
      <div className="flex items-center gap-1.5 flex-1 justify-center px-2">
        {allyList.length > 0 ? (
          allyList.map((p, idx) => {
            const badge = getTierBadge(p.horseTier);
            return (
              <div
                key={p.puuid || idx}
                onMouseEnter={() => setHoveredPlayer(p)}
                onMouseLeave={() => setHoveredPlayer(null)}
                className={`relative px-2 py-0.5 rounded-lg border text-[11px] font-black cursor-pointer transition-all hover:scale-110 flex items-center gap-1 ${badge.bg} ${badge.shadow}`}
              >
                <span>{badge.label}</span>
                {p.score !== undefined && (
                  <span className="text-[9px] font-mono opacity-80">{p.score}</span>
                )}
                {p.isTilted && <Flame className="w-2.5 h-2.5 text-rose-400 animate-pulse" />}
              </div>
            );
          })
        ) : (
          <span className="text-[11px] text-slate-300 font-medium">进入对局自动感知马力</span>
        )}
      </div>

      {/* Control Actions */}
      <div
        style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}
        className="flex items-center gap-1 shrink-0"
      >
        <button
          onClick={onRestore}
          title="展开完整窗口"
          className="p-1 rounded-lg glass-pill text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onMinimize}
          title="最小化"
          className="p-1 rounded-lg glass-pill text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onClose}
          title="关闭"
          className="p-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/35 border border-rose-500/30 text-rose-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Hover Popover */}
      {hoveredPlayer && (
        <div
          style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 z-50 glass-panel border border-cyan-400/40 rounded-xl p-2.5 shadow-2xl text-left pointer-events-none min-w-[220px] animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
            <span className="truncate max-w-[130px]">{hoveredPlayer.summonerName}</span>
            <span className="text-amber-300 font-mono">{hoveredPlayer.score}分</span>
          </div>
          <div className="text-[10px] text-slate-300 flex items-center justify-between font-mono mb-1">
            <span>胜率: {hoveredPlayer.winRate.toFixed(1)}%</span>
            <span>KDA: {hoveredPlayer.kda.toFixed(2)}</span>
            <span>{hoveredPlayer.rankTier || '暂无段位'}</span>
          </div>
          <div className="text-[10px] text-cyan-300 truncate font-medium">
            {hoveredPlayer.horseRank}: {hoveredPlayer.horseTag}
          </div>
        </div>
      )}
    </div>
  );
}
