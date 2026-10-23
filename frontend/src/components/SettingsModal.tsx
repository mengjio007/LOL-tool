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
  Tv,
  FolderOpen,
  Play,
  RotateCcw,
  Volume2,
  Flame,
  Swords,
  Shield,
  Heart,
  Crosshair,
  TrendingUp,
  Award,
} from 'lucide-react';
import type { Config, UpdateInfo, AlgorithmConfig, DeathVideoConfig } from '../services/wailsBridge';
import { WailsBridge, defaultAlgorithmConfig } from '../services/wailsBridge';
import type { translations } from '../i18n/translations';
import { AlgorithmGuideView } from './AlgorithmGuideView';
import appLogo from '../assets/appicon.png';

export type SettingsTab = 'algoConfig' | 'deathVideo' | 'updates' | 'algorithm' | 'changelog' | 'contact';

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
  const deathVideo = config.deathVideo || {
    enabled: true,
    source: 'local',
    localFolder: '',
    volume: 40,
    autoCloseOnRespawn: true,
    showCountdown: true,
  };

  const updateAlgoField = (field: keyof AlgorithmConfig, value: any) => {
    const updated = { ...algo, [field]: value };
    onUpdateConfig({ algorithm: updated });
  };

  const updateDeathField = (field: keyof DeathVideoConfig, value: any) => {
    const updated = { ...deathVideo, [field]: value };
    onUpdateConfig({ deathVideo: updated });
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

  const handlePickFolder = async () => {
    try {
      const folder = await WailsBridge.selectDirectory();
      if (folder) {
        updateDeathField('localFolder', folder);
      }
    } catch {}
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[560px] max-h-[90vh] bg-[#0c1424] border border-[#c89b3c]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f0e6d2]">
        {/* 1. Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#091428] via-[#0b162c] to-[#041220] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#c89b3c]/20 border border-[#c89b3c]/40 overflow-hidden flex items-center justify-center p-0.5 shadow-inner">
              <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#f0e6d2] flex items-center gap-2">
                <span>控制与设置中心</span>
                <span className="text-[10px] font-mono text-[#c89b3c] bg-[#c89b3c]/15 px-1.5 py-0.5 rounded border border-[#c89b3c]/30">
                  v2.0.0
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Horizontal Navigation Tabs */}
        <div className="flex items-center bg-[#070e1b] px-2 border-b border-white/5 text-[11px] shrink-0 overflow-x-auto scrollbar-none">
          {/* Tab: Algorithm Config */}
          <button
            onClick={() => setActiveTab('algoConfig')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'algoConfig'
                ? 'border-[#c89b3c] text-[#c89b3c] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>算法权重配置</span>
          </button>

          {/* Tab: Death Video */}
          <button
            onClick={() => setActiveTab('deathVideo')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'deathVideo'
                ? 'border-rose-400 text-rose-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>死亡视频娱乐</span>
          </button>

          {/* Tab: Updates */}
          <button
            onClick={() => setActiveTab('updates')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap relative cursor-pointer ${
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
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'algorithm'
                ? 'border-[#0ac8b9] text-[#0ac8b9] font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#0ac8b9]" />
            <span>算法原理解读</span>
          </button>

          {/* Tab: Changelog */}
          <button
            onClick={() => setActiveTab('changelog')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
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
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
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

          {/* TAB 2: Death Video Overlay Settings */}
          {activeTab === 'deathVideo' && (
            <div className="space-y-4 text-xs">
              {/* Enable Death Video Switch */}
              <div className="rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/40 to-[#0a1424] p-3.5 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-rose-200">开启死亡视频娱乐弹窗</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      官方2999端口感知
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    游戏内英雄阵亡时自动弹出独立画中画小窗播放视频，复活秒关瞬闭。
                  </p>
                </div>
                <button
                  onClick={() => updateDeathField('enabled', !deathVideo.enabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    deathVideo.enabled ? 'bg-rose-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      deathVideo.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Video Source Radio */}
              <div className="space-y-2 bg-black/30 p-3.5 rounded-xl border border-white/10">
                <div className="font-bold text-slate-200 text-xs">视频播放源选择:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => updateDeathField('source', 'local')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      deathVideo.source === 'local'
                        ? 'border-amber-400 bg-amber-500/15 shadow-md'
                        : 'border-white/10 bg-black/20 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                      <FolderOpen className="w-4 h-4" />
                      <span>本地自定义视频 (推荐)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      0毫秒秒开，零卡顿无广告。死后随机抽取文件夹中的一段视频播放。
                    </p>
                  </button>

                  <button
                    onClick={() => updateDeathField('source', 'douyin')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      deathVideo.source === 'douyin'
                        ? 'border-cyan-400 bg-cyan-500/15 shadow-md'
                        : 'border-white/10 bg-black/20 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-xs">
                      <Globe className="w-4 h-4" />
                      <span>抖音精选在线短视频</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      内置微型浏览器直连抖音精选流，支持滚轮顺滑上下切视频。
                    </p>
                  </button>
                </div>

                {/* Local Folder Path Input */}
                {deathVideo.source === 'local' && (
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] text-slate-300">本地视频文件夹路径:</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={deathVideo.localFolder || ''}
                        placeholder="点击右侧按钮选择包含 .mp4/.webm 的文件夹..."
                        className="flex-1 bg-black/50 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-slate-200 truncate select-all"
                      />
                      <button
                        onClick={handlePickFolder}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#c89b3c] to-[#a87f28] text-black font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow hover:scale-[1.02] transition-transform"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>浏览文件夹</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Volume Slider & Countdown Settings */}
              <div className="space-y-3 bg-black/30 p-3.5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>默认音量控制:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={deathVideo.volume ?? 40}
                      onChange={(e) => updateDeathField('volume', Number(e.target.value))}
                      className="w-28 accent-[#c89b3c] cursor-pointer h-1.5"
                    />
                    <span className="font-mono text-xs w-8 text-right">{deathVideo.volume ?? 40}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-slate-300">复活自动秒关静音</span>
                  <input
                    type="checkbox"
                    checked={deathVideo.autoCloseOnRespawn}
                    onChange={(e) => updateDeathField('autoCloseOnRespawn', e.target.checked)}
                    className="accent-[#c89b3c] cursor-pointer"
                  />
                </div>
              </div>

              {/* Local Interactive Testing Buttons */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-2">
                <div className="font-bold text-xs text-slate-300">效果就绪测试:</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => WailsBridge.triggerTestDeath(15)}
                    className="flex-1 py-2 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>立即测试死亡弹窗 (15s)</span>
                  </button>
                  <button
                    onClick={() => WailsBridge.triggerTestRespawn()}
                    className="py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>测试复活秒关</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Updates */}
          {activeTab === 'updates' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">当前版本: v2.0.0</div>
                    <div className="text-sm font-bold text-[#f0e6d2] mt-0.5 flex items-center gap-2">
                      <span>v2.0.0 正式版</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                        全新架构
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
                      你的助手版本为 v2.0.0，享受最新的千分制算法与局内娱乐系统。
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
              {/* v2.0.0 */}
              <div className="rounded-xl border border-[#c89b3c]/60 bg-gradient-to-br from-[#1c1c28] to-[#091428] p-4 space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#c89b3c]" />
                    <span>v2.0.0 重磅里程碑更新</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#c89b3c] bg-[#c89b3c]/20 px-2 py-0.5 rounded border border-[#c89b3c]/40">
                    当前版本
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-200 text-[11px] leading-relaxed">
                  <li><strong className="text-amber-300">千分制评分引擎与全指标可配置化</strong>：升级为 0~1000 战力值，分差彻底拉开！9大维度可自由配置百分比权重，并支持一键套用模板。</li>
                  <li><strong className="text-rose-300">局内感知死亡娱乐系统</strong>：官方 2999 端口毫秒级识别阵亡状态，自动弹出置顶画中画小窗播放本地/抖音视频，复活秒关瞬闭。</li>
                  <li><strong className="text-cyan-300">Material Design 3 现代质感</strong>：全面引入 Material 3 层次系统、自适应大屏仪表盘与极简局内置顶小胶囊条（380×52px，不挡游戏补刀）。</li>
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
