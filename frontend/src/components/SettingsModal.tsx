import { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  BookOpen,
  History,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Download,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Sliders,
  Flame,
  Swords,
  Shield,
  Heart,
  Crosshair,
  TrendingUp,
  Award,
  Palette,
  Type,
} from 'lucide-react';
import type { Config, UpdateInfo, AlgorithmConfig } from '../services/wailsBridge';
import { WailsBridge, defaultAlgorithmConfig } from '../services/wailsBridge';
import type { translations } from '../i18n/translations';
import { AlgorithmGuideView } from './AlgorithmGuideView';
import appLogo from '../assets/appicon.png';

export type SettingsTab = 'algoConfig' | 'appearance' | 'updates' | 'algorithm' | 'changelog' | 'contact';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
  t: (typeof translations)['zh'];
  config: Config;
  onUpdateConfig: (newCfg: Partial<Config>) => void;
  updateInfo: UpdateInfo | null;
  isCheckingUpdate: boolean;
  isUpdating: boolean;
  updateProgress: number;
  onCheckUpdate: () => void;
  onStartUpdate: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  initialTab = 'algoConfig',
  t,
  config,
  onUpdateConfig,
  updateInfo,
  isCheckingUpdate,
  isUpdating,
  updateProgress,
  onCheckUpdate,
  onStartUpdate,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const algo = config.algorithm || defaultAlgorithmConfig;
  const updateAlgoField = (field: keyof AlgorithmConfig, value: any) => {
    const updated = { ...algo, [field]: value };
    onUpdateConfig({ algorithm: updated });
  };

  // Preset Profiles for Scoring Algorithm
  const applyPreset = (preset: 'balanced' | 'carry' | 'competitive' | 'antiTilt') => {
    switch (preset) {
      case 'carry':
        onUpdateConfig({
          algorithm: {
            ...algo,
            customWeightsEnabled: true,
            damageWeight: 45,
            tankWeight: 10,
            healWeight: 5,
            kdaWeight: 20,
            winRateWeight: 8,
            streakWeight: 5,
            guardianWeight: 2,
            rankTierWeight: 2,
            highlightWeight: 15,
            strictTiltPenalty: true,
          },
        });
        break;
      case 'competitive':
        onUpdateConfig({
          algorithm: {
            ...algo,
            customWeightsEnabled: true,
            damageWeight: 18,
            tankWeight: 12,
            healWeight: 8,
            kdaWeight: 12,
            winRateWeight: 30,
            streakWeight: 10,
            guardianWeight: 4,
            rankTierWeight: 18,
            highlightWeight: 4,
            strictTiltPenalty: true,
          },
        });
        break;
      case 'antiTilt':
        onUpdateConfig({
          algorithm: {
            ...algo,
            customWeightsEnabled: true,
            damageWeight: 20,
            tankWeight: 12,
            healWeight: 8,
            kdaWeight: 10,
            winRateWeight: 15,
            streakWeight: 35,
            guardianWeight: 6,
            rankTierWeight: 4,
            highlightWeight: 2,
            strictTiltPenalty: true,
          },
        });
        break;
      case 'balanced':
      default:
        onUpdateConfig({
          algorithm: {
            ...defaultAlgorithmConfig,
            customWeightsEnabled: true,
          },
        });
        break;
    }
  };

  // Calculate total weights & percentage normalization
  const totalWeight =
    algo.damageWeight +
    algo.tankWeight +
    algo.healWeight +
    algo.kdaWeight +
    algo.winRateWeight +
    algo.streakWeight +
    algo.guardianWeight +
    algo.rankTierWeight +
    algo.highlightWeight;

  const getPercent = (w: number) => {
    if (totalWeight <= 0) return 0;
    return Math.round((w / totalWeight) * 100);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[760px] my-auto max-h-[90vh] glass-panel border border-white/[0.16] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* 1. Header Bar (Sticky at Top) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 border border-white/15 overflow-hidden flex items-center justify-center p-0.5 shadow-inner">
              <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <span>控制与设置中心</span>
                <span className="text-[10px] font-mono text-cyan-300 glass-pill px-1.5 py-0.5 rounded">
                  v2.0.1 Pro
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-rose-500/25 border border-white/10 hover:border-rose-400/40 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-sm active:scale-95"
            title="关闭设置 (Esc)"
          >
            <X className="w-4 h-4" />
            <span>关闭</span>
          </button>
        </div>

        {/* 2. Horizontal Navigation Tabs */}
        <div className="flex items-center bg-black/30 px-2 border-b border-white/[0.08] text-[11px] shrink-0 overflow-x-auto scrollbar-none">
          {/* Tab: Algorithm Config */}
          <button
            onClick={() => setActiveTab('algoConfig')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'algoConfig'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>算法权重</span>
          </button>

          {/* Tab: Appearance & Typography */}
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'appearance'
                ? 'border-purple-400 text-purple-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span>界面与字体</span>
          </button>

          {/* Tab: Updates */}
          <button
            onClick={() => setActiveTab('updates')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap shrink-0 relative cursor-pointer ${
              activeTab === 'updates'
                ? 'border-emerald-400 text-emerald-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>版本更新</span>
            {updateInfo?.hasUpdate && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Tab: Algorithm Guide */}
          <button
            onClick={() => setActiveTab('algorithm')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'algorithm'
                ? 'border-[#0ac8b9] text-[#0ac8b9] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#0ac8b9]" />
            <span>算法解读</span>
          </button>

          {/* Tab: Changelog */}
          <button
            onClick={() => setActiveTab('changelog')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'changelog'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>更新日志</span>
          </button>

          {/* Tab: Contact */}
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'contact'
                ? 'border-indigo-400 text-indigo-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            <span>关于与联系</span>
          </button>
        </div>

        {/* 3. Tab Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: Algorithm Weights Customization */}
          {activeTab === 'algoConfig' && (
            <div className="space-y-4 text-xs">
              {/* Enable Switch Banner */}
              <div className="rounded-xl border border-[#c89b3c]/40 bg-gradient-to-r from-[#172238] to-[#0a1424] p-3.5 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#f0e6d2]">启用自定义战力评分权重</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#c89b3c]/20 text-[#c89b3c] border border-[#c89b3c]/30">
                      千分制 0~1000
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {algo.customWeightsEnabled
                      ? '已启用自定义比例，评分引擎将按你的偏好为各维度打分。'
                      : '未开启时，助手自动按照官方系统推荐的黄金平衡模型打分。'}
                  </p>
                </div>
                <button
                  onClick={() => updateAlgoField('customWeightsEnabled', !algo.customWeightsEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    algo.customWeightsEnabled ? 'bg-[#c89b3c]' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      algo.customWeightsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Local Storage Indicator Banner */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="font-bold">算法与参数已实时本地自动持久化 (SQLite + JSON)</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">即时生效 · 永久保存</span>
              </div>

              {/* Preset Profile Shortcuts */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#c89b3c]" />
                  <span>一键套用经典预设模板:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => applyPreset('balanced')}
                    className="p-2 rounded-lg border border-white/10 bg-black/30 hover:border-[#c89b3c]/50 text-center transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-slate-200 text-xs">⚖️ 官方平衡</div>
                    <div className="text-[10px] text-slate-400">输出与胜率兼顾</div>
                  </button>
                  <button
                    onClick={() => applyPreset('carry')}
                    className="p-2 rounded-lg border border-white/10 bg-black/30 hover:border-rose-500/50 text-center transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-rose-300 text-xs">⚔️ 输出狂魔</div>
                    <div className="text-[10px] text-slate-400">输出占比高光至上</div>
                  </button>
                  <button
                    onClick={() => applyPreset('competitive')}
                    className="p-2 rounded-lg border border-white/10 bg-black/30 hover:border-cyan-500/50 text-center transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-cyan-300 text-xs">🏆 胜率段位</div>
                    <div className="text-[10px] text-slate-400">硬核长期胜率</div>
                  </button>
                  <button
                    onClick={() => applyPreset('antiTilt')}
                    className="p-2 rounded-lg border border-white/10 bg-black/30 hover:border-amber-500/50 text-center transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-amber-300 text-xs">🛡️ 防坑避雷</div>
                    <div className="text-[10px] text-slate-400">连败红温严惩</div>
                  </button>
                </div>
              </div>

              {/* Stacked Percentage Visual Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>实时权重占比预览 (自动归一化):</span>
                  <span className="font-mono text-[#c89b3c]">总权重: 100%</span>
                </div>
                <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden flex border border-white/10">
                  <div style={{ width: `${getPercent(algo.damageWeight)}%` }} className="bg-rose-500 h-full" title="输出占比" />
                  <div style={{ width: `${getPercent(algo.tankWeight)}%` }} className="bg-blue-500 h-full" title="承伤减免" />
                  <div style={{ width: `${getPercent(algo.healWeight)}%` }} className="bg-emerald-500 h-full" title="治疗护盾" />
                  <div style={{ width: `${getPercent(algo.kdaWeight)}%` }} className="bg-cyan-500 h-full" title="KDA参团" />
                  <div style={{ width: `${getPercent(algo.winRateWeight)}%` }} className="bg-amber-500 h-full" title="硬胜率" />
                  <div style={{ width: `${getPercent(algo.streakWeight)}%` }} className="bg-orange-500 h-full" title="连胜连败" />
                  <div style={{ width: `${getPercent(algo.guardianWeight)}%` }} className="bg-purple-500 h-full" title="守护者装备" />
                  <div style={{ width: `${getPercent(algo.rankTierWeight)}%` }} className="bg-yellow-400 h-full" title="排位段位" />
                  <div style={{ width: `${getPercent(algo.highlightWeight)}%` }} className="bg-pink-500 h-full" title="高光拆塔" />
                </div>
              </div>

              {/* 9 Metric Sliders List */}
              <div className="space-y-2.5 bg-black/30 p-3 rounded-xl border border-white/10">
                {/* 1. Damage */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 w-36">
                    <Swords className="w-3.5 h-3.5 text-rose-400" />
                    <span>输出压制贡献:</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={algo.damageWeight}
                    onChange={(e) => updateAlgoField('damageWeight', Number(e.target.value))}
                    className="flex-1 accent-rose-400 cursor-pointer h-1.5"
                  />
                  <span className="font-mono text-[11px] text-rose-300 w-12 text-right">
                    {getPercent(algo.damageWeight)}%
                  </span>
                </div>

                {/* 2. Tank */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 w-36">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>承伤抗压贡献:</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={algo.tankWeight}
                    onChange={(e) => updateAlgoField('tankWeight', Number(e.target.value))}
                    className="flex-1 accent-blue-400 cursor-pointer h-1.5"
                  />
                  <span className="font-mono text-[11px] text-blue-300 w-12 text-right">
                    {getPercent(algo.tankWeight)}%
                  </span>
                </div>

                {/* 3. Heal */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 w-36">
                    <Heart className="w-3.5 h-3.5 text-emerald-400" />
                    <span>治疗与护盾贡献:</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={algo.healWeight}
                    onChange={(e) => updateAlgoField('healWeight', Number(e.target.value))}
                    className="flex-1 accent-emerald-400 cursor-pointer h-1.5"
                  />
                  <span className="font-mono text-[11px] text-emerald-300 w-12 text-right">
                    {getPercent(algo.healWeight)}%
                  </span>
                </div>

                {/* 4. KDA & KP */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 w-36">
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                    <span>KDA与参团贡献:</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={algo.kdaWeight}
                    onChange={(e) => updateAlgoField('kdaWeight', Number(e.target.value))}
                    className="flex-1 accent-cyan-400 cursor-pointer h-1.5"
                  />
                  <span className="font-mono text-[11px] text-cyan-300 w-12 text-right">
                    {getPercent(algo.kdaWeight)}%
                  </span>
                </div>

                {/* 5. WinRate */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 w-36">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>长期胜率基石:</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={algo.winRateWeight}
                    onChange={(e) => updateAlgoField('winRateWeight', Number(e.target.value))}
                    className="flex-1 accent-amber-400 cursor-pointer h-1.5"
                  />
                  <span className="font-mono text-[11px] text-amber-300 w-12 text-right">
                    {getPercent(algo.winRateWeight)}%
                  </span>
                </div>

                {/* 6. Streak & Tilt */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 w-36">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span>连胜/连败心态:</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={algo.streakWeight}
                    onChange={(e) => updateAlgoField('streakWeight', Number(e.target.value))}
                    className="flex-1 accent-orange-400 cursor-pointer h-1.5"
                  />
                  <span className="font-mono text-[11px] text-orange-300 w-12 text-right">
                    {getPercent(algo.streakWeight)}%
                  </span>
                </div>

                {/* 7. Guardian Ratio */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 w-36">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>守护者装备理解:</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={algo.guardianWeight}
                    onChange={(e) => updateAlgoField('guardianWeight', Number(e.target.value))}
                    className="flex-1 accent-purple-400 cursor-pointer h-1.5"
                  />
                  <span className="font-mono text-[11px] text-purple-300 w-12 text-right">
                    {getPercent(algo.guardianWeight)}%
                  </span>
                </div>

                {/* 8. Rank Tier */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 w-36">
                    <Award className="w-3.5 h-3.5 text-yellow-400" />
                    <span>历史排位段位:</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={algo.rankTierWeight}
                    onChange={(e) => updateAlgoField('rankTierWeight', Number(e.target.value))}
                    className="flex-1 accent-yellow-400 cursor-pointer h-1.5"
                  />
                  <span className="font-mono text-[11px] text-yellow-300 w-12 text-right">
                    {getPercent(algo.rankTierWeight)}%
                  </span>
                </div>

                {/* 9. Highlights & Turrets */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 w-36">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>高光爆发与拆塔:</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={algo.highlightWeight}
                    onChange={(e) => updateAlgoField('highlightWeight', Number(e.target.value))}
                    className="flex-1 accent-pink-400 cursor-pointer h-1.5"
                  />
                  <span className="font-mono text-[11px] text-pink-300 w-12 text-right">
                    {getPercent(algo.highlightWeight)}%
                  </span>
                </div>
              </div>

              {/* Strict Tilt Penalty Switch */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-200">连败破防熔断降级保护</div>
                  <div className="text-[10px] text-slate-400">
                    当天连败破防选手强制扣分并封顶在次等以下，防止“红温通天代”
                  </div>
                </div>
                <button
                  onClick={() => updateAlgoField('strictTiltPenalty', !algo.strictTiltPenalty)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    algo.strictTiltPenalty ? 'bg-[#c89b3c]' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      algo.strictTiltPenalty ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB: Appearance & Typography */}
          {activeTab === 'appearance' && (
            <div className="space-y-4 text-xs">
              {/* Theme Selector Section */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                <div className="text-[11px] font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-blue-400" />
                    <span>视觉色彩主题 (点击实时热切换):</span>
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono font-bold">已新增 3 款现代纯白主题</span>
                </div>

                {/* Section 1: Modern White Themes */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                    <span>☀️ 现代纯白主体风格 (清爽通透 · 高质感)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => onUpdateConfig({ theme: 'azure' })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        (config.theme || 'azure') === 'azure'
                          ? 'bg-blue-500/15 border-blue-400 shadow-[0_0_14px_rgba(37,99,235,0.35)] ring-1 ring-blue-400/30'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] shadow-sm ring-1 ring-white" />
                          <span>晴空蓝白 (图1推荐)</span>
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">主白</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-snug">纯白主体与明澈湛蓝，清新通透高对比度</div>
                    </button>

                    <button
                      onClick={() => onUpdateConfig({ theme: 'iris' })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        config.theme === 'iris'
                          ? 'bg-indigo-500/15 border-indigo-400 shadow-[0_0_14px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400/30'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-400 text-xs flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] shadow-sm ring-1 ring-white" />
                          <span>蓝紫白 (极简灵动)</span>
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">主白</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-snug">纯白主体配双城星穹蓝紫，现代时尚感</div>
                    </button>

                    <button
                      onClick={() => onUpdateConfig({ theme: 'slate-white' })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        config.theme === 'slate-white'
                          ? 'bg-slate-500/15 border-slate-400 shadow-[0_0_14px_rgba(100,116,139,0.35)] ring-1 ring-slate-400/30'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b] shadow-sm ring-1 ring-white" />
                          <span>极简白灰 (图2看板)</span>
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-500/20 text-slate-300 font-bold">白灰</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-snug">高级白灰双色看板架构，沉稳克制无干扰</div>
                    </button>
                  </div>
                </div>

                {/* Section 2: Dark Esports Themes */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <span>🌙 经典暗黑电竞风格</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => onUpdateConfig({ theme: 'hextech' })}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        config.theme === 'hextech'
                          ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_14px_rgba(200,155,60,0.4)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#c89b3c] shadow-sm" />
                        <span>官方黑金</span>
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">海克斯夜蓝与纯金</div>
                    </button>

                    <button
                      onClick={() => onUpdateConfig({ theme: 'aurora' })}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        config.theme === 'aurora'
                          ? 'bg-sky-500/20 border-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.4)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="font-bold text-sky-300 text-xs flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] shadow-sm" />
                        <span>冷炭极光</span>
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">冷炭深灰与电竞冰蓝</div>
                    </button>

                    <button
                      onClick={() => onUpdateConfig({ theme: 'arcane' })}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        config.theme === 'arcane'
                          ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_14px_rgba(0,255,157,0.4)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00ff9d] shadow-sm" />
                        <span>双城赛博</span>
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">暗夜紫黑与荧光绿</div>
                    </button>

                    <button
                      onClick={() => onUpdateConfig({ theme: 'crimson' })}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        config.theme === 'crimson'
                          ? 'bg-red-500/20 border-red-400 shadow-[0_0_14px_rgba(239,68,68,0.4)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-sm" />
                        <span>诺克萨斯</span>
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">曜石黑底与狂暴猩红</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Introduction Card */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <Type className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">自适应字阶与电竞排版引擎</h4>
                      <p className="text-[11px] text-slate-400">
                        系统级 CJK 黑体与 Monospace 等宽对齐，支持随视口大小动态自适应
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    抗锯齿已启用
                  </span>
                </div>
              </div>

              {/* Font Scale Presets */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">字号与缩放模式</span>
                  <span className="text-[11px] text-slate-400">当前生效: <span className="text-purple-300 font-mono font-bold">{config.fontScale || 'auto'}</span></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                  {[
                    { id: 'auto', label: '自适应放大', badge: '推荐', desc: '随窗口拉大/最大化自动等比放大整体UI (100%~140%)，大屏充盈不留白' },
                    { id: 'compact', label: '紧凑精致', badge: '92%', desc: '字阶缩小，信息密度高，适合小屏幕或多窗口并排' },
                    { id: 'standard', label: '标准模式', badge: '100%', desc: '默认 1:1 比例，视觉层次清晰平衡' },
                    { id: 'large', label: '舒适大字', badge: '118%', desc: '整体等比放大 18%，适合 2K/4K 大显示屏' },
                    { id: 'extra-large', label: '超大视野', badge: '135%', desc: '整体等比放大 35%，大屏开阔极度清晰护眼' },
                  ].map((scale) => {
                    const isSelected = (config.fontScale || 'auto') === scale.id;
                    return (
                      <button
                        key={scale.id}
                        onClick={() => onUpdateConfig({ fontScale: scale.id as any })}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-purple-400/80 bg-purple-500/15 shadow-sm ring-1 ring-purple-400/30'
                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <span className={`font-bold text-xs ${isSelected ? 'text-purple-200' : 'text-slate-200'}`}>
                            {scale.label}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                            isSelected
                              ? 'bg-purple-400 text-black font-bold'
                              : 'bg-white/10 text-slate-300'
                          }`}>
                            {scale.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                          {scale.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                <span className="font-bold text-slate-200">排版与渲染实时预览效果</span>

                <div className="p-3.5 rounded-lg border border-white/5 bg-black/60 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-[#f0e6d2]">狂暴之心 凯南 (Kennen)</span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">948 战力 · S+ 评级</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-white/[0.03] p-2 rounded border border-white/5">
                      <div className="text-[10px] text-slate-500">实战战绩 (KDA)</div>
                      <div className="font-mono font-bold text-slate-200 mt-0.5">14 / 2 / 9 (82%)</div>
                    </div>
                    <div className="bg-white/[0.03] p-2 rounded border border-white/5">
                      <div className="text-[10px] text-slate-500">分均输出 (DPM)</div>
                      <div className="font-mono font-bold text-cyan-300 mt-0.5">1,024 dmg/min</div>
                    </div>
                    <div className="bg-white/[0.03] p-2 rounded border border-white/5">
                      <div className="text-[10px] text-slate-500">抗压承伤占比</div>
                      <div className="font-mono font-bold text-purple-300 mt-0.5">28.4% 团队贡献</div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>💡 当前字体：系统原生无衬线 CJK + Tabular-Nums 对齐</span>
                    <span className="text-emerald-400">已实时自动保存</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Updates */}
          {activeTab === 'updates' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">当前版本: v2.0.1</div>
                    <div className="text-sm font-bold text-[#f0e6d2] mt-0.5 flex items-center gap-2">
                      <span>v2.0.1 正式版</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                        稳定迭代
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onCheckUpdate}
                    disabled={isCheckingUpdate || isUpdating}
                    className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                    <span>{isCheckingUpdate ? '正在检查...' : '立即检查更新'}</span>
                  </button>
                </div>
              </div>

              {/* Has Update Card */}
              {updateInfo?.hasUpdate ? (
                <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-[#091428] to-[#041c18] p-4 space-y-3 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
                        NEW VERSION
                      </span>
                      <h4 className="font-bold text-sm text-white mt-1.5 flex items-center gap-2">
                        <span>{updateInfo.releaseName || updateInfo.latestVersion}</span>
                      </h4>
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-lg p-3 border border-white/5 max-h-36 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                    {updateInfo.releaseNotes}
                  </div>

                  {isUpdating ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#0ac8b9] font-medium flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>正在下载更新包 ({updateProgress}%)</span>
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">{updateProgress}%</span>
                      </div>
                      <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-white/10">
                        <div
                          className="bg-gradient-to-r from-[#0ac8b9] via-[#c89b3c] to-[#0ac8b9] h-full transition-all duration-300"
                          style={{ width: `${Math.max(5, updateProgress)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={onStartUpdate}
                      className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#c89b3c] to-[#a87f28] hover:from-[#d8ab4c] hover:to-[#b88f38] text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#c89b3c]/20 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>立即自动更新并重启</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/30 p-4 flex items-center gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-xs text-white">当前已是最新版本</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      你的助手版本为 v2.0.1，享受最新的千分制算法、4套电竞主题与居中视频娱乐系统。
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Algorithm Guide */}
          {activeTab === 'algorithm' && (
            <AlgorithmGuideView t={t} />
          )}

          {/* TAB 5: Changelog */}
          {activeTab === 'changelog' && (
            <div className="space-y-3 text-xs">
              {/* v2.0.1 */}
              <div className="rounded-xl border border-[#c89b3c]/60 bg-gradient-to-br from-[#1c1c28] to-[#091428] p-4 space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#c89b3c]" />
                    <span>v2.0.1 视觉与交互体验升级</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#c89b3c] bg-[#c89b3c]/20 px-2 py-0.5 rounded border border-[#c89b3c]/40">
                    当前版本
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-200 text-[11px] leading-relaxed">
                  <li><strong className="text-amber-300">视频弹窗屏幕正中自适应</strong>：自动获取屏幕分辨率并居中定位，彻底告别靠左上方弹出。</li>
                  <li><strong className="text-cyan-300">4套高反差电竞主题规范</strong>：官方黑金、冷炭极光、双城赛博、诺克萨斯战血，顶栏一键秒切。</li>
                  <li><strong className="text-emerald-300">导航栏实色去透明重构</strong>：彻底解决选项卡底部发虚半透明问题，100%实体高光按钮，边界清晰锐利。</li>
                  <li><strong className="text-purple-300">SQLite + 配置文件双轨容灾持久化</strong>：算法权重、站点登录态与主题偏好永久本地保存，无惧重启。</li>
                  <li><strong className="text-rose-300">纯 Win32 API 0ms 静默关闭</strong>：完全移除命令行调用，彻底消除控制台黑框闪烁。</li>
                </ul>
              </div>

              {/* v2.0.0 */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                    <span>v2.0.0 重磅里程碑更新</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                    历史版本
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                  <li><strong className="text-amber-300">千分制评分引擎与全指标可配置化</strong>：升级为 0~1000 战力值，9大维度自由配置百分比权重。</li>
                  <li><strong className="text-rose-300">局内感知死亡娱乐系统</strong>：毫秒级识别阵亡状态，自动弹出置顶画中画小窗播放视频。</li>
                  <li><strong className="text-cyan-300">极简局内置顶小胶囊条</strong>：380×52px，不挡游戏补刀。</li>
                </ul>
              </div>

              {/* v1.0.5 */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-300">v1.0.5</span>
                  <span className="text-[10px] font-mono text-slate-500">2026-10-23</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                  <li>精准战力占比重构：修复输出占比与承伤占比误显示 100% 的统计缺陷。</li>
                  <li>窗口最大化与自适应还原：顶部新增原生窗口还原/最大化按钮。</li>
                </ul>
              </div>

              {/* v1.0.4 */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-300">v1.0.4</span>
                  <span className="text-[10px] font-mono text-slate-500">2026-10-22</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                  <li>战力单查上线：新增召唤师战力独立穿透查询页面。</li>
                  <li>控制中心聚合：独立设置、更新与算法解读中心。</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 6: Contact & About */}
          {activeTab === 'contact' && (
            <div className="space-y-3.5 text-xs">
              <div className="rounded-xl border border-white/10 bg-[#091428] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#c89b3c]/20 border border-[#c89b3c]/40 flex items-center justify-center text-[#c89b3c]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2]">作者电子邮箱</div>
                      <div className="text-[11px] font-mono text-slate-400 select-text">
                        1959477235@qq.com
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy('1959477235@qq.com', 'email')}
                    className="py-1 px-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedType === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedType === 'email' ? '已复制' : '复制邮箱'}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#091428] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2]">GitHub 开源仓库</div>
                      <div className="text-[11px] font-mono text-slate-400 truncate max-w-[180px] select-text">
                        github.com/mengjio007/LOL-tool
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => WailsBridge.openBrowser('https://github.com/mengjio007/LOL-tool')}
                    className="py-1 px-2.5 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>访问仓库</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex items-start gap-2.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  本助手基于英雄联盟官方 LCU 及 LiveClientData（2999端口）只读接口研发，纯外部通讯，不读取或注入任何游戏内存，100% 零封号风险。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
