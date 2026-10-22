import {
  Shield,
  Zap,
  Swords,
  Flame,
  Scale,
  Sparkles,
  Crown,
  AlertTriangle,
  Award,
  Crosshair,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type { translations } from '../i18n/translations';

interface AlgorithmGuideViewProps {
  t: (typeof translations)['zh'];
}

export function AlgorithmGuideView({ t }: AlgorithmGuideViewProps) {
  return (
    <div className="space-y-4 text-[#f0e6d2] pb-6">
      {/* 1. Hero Header Banner */}
      <section className="relative overflow-hidden rounded-xl border border-[#c89b3c]/40 bg-gradient-to-br from-[#0a1428] via-[#091428] to-[#010a13] p-4 shadow-xl">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#c89b3c]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-[#c89b3c]/20 border border-[#c89b3c]/40 text-[#c89b3c] shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-[#c89b3c]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#f0e6d2] flex items-center gap-2">
              <span>{t.algoTitle}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#c89b3c]/20 text-[#c89b3c] border border-[#c89b3c]/30">
                v1.0.3 AI Engine
              </span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
              {t.algoSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Core Philosophy & Pain Points */}
      <section className="space-y-2.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#c89b3c]/90 px-1 flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-[#c89b3c]" />
          <span>{t.algoPhilosophyTitle}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Pain 1 */}
          <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 space-y-1 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{t.algoPain1Title}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {t.algoPain1Desc}
            </p>
          </div>

          {/* Pain 2 */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 space-y-1 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{t.algoPain2Title}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {t.algoPain2Desc}
            </p>
          </div>

          {/* Pain 3 */}
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3 space-y-1 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{t.algoPain3Title}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {t.algoPain3Desc}
            </p>
          </div>
        </div>
      </section>

      {/* 3. The 6-Tier Hierarchy Showcase */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#c89b3c]/90 flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-[#c89b3c]" />
            <span>{t.algoTiersTitle}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">180+ Composite Scale</span>
        </div>
        <p className="text-[11px] text-slate-400 px-1 -mt-1">{t.algoTiersDesc}</p>

        <div className="space-y-2">
          {/* Tier S+ */}
          <div className="relative overflow-hidden rounded-lg border border-amber-400/60 bg-[#091428] p-3 shadow-md">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 via-rose-500 to-indigo-500" />
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300 bg-clip-text text-transparent border border-amber-400/40 px-2 py-0.5 rounded-md bg-amber-400/10">
                  {t.tierSPlusBadge}
                </span>
                <span className="text-[10px] font-mono text-amber-300/80 bg-black/40 px-1.5 py-0.5 rounded">
                  ≥ 140 分
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-200 mt-2 leading-relaxed">
              {t.tierSPlusDesc}
            </p>
          </div>

          {/* Tier S */}
          <div className="relative overflow-hidden rounded-lg border border-amber-500/40 bg-[#091428] p-3 shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md bg-amber-500/15">
                  {t.tierSBadge}
                </span>
                <span className="text-[10px] font-mono text-amber-300/80 bg-black/40 px-1.5 py-0.5 rounded">
                  120 ~ 139 分
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {t.tierSDesc}
            </p>
          </div>

          {/* Tier A */}
          <div className="relative overflow-hidden rounded-lg border border-emerald-500/30 bg-[#091428] p-3 shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md bg-emerald-500/15">
                  {t.tierABadge}
                </span>
                <span className="text-[10px] font-mono text-emerald-300/80 bg-black/40 px-1.5 py-0.5 rounded">
                  100 ~ 119 分
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {t.tierADesc}
            </p>
          </div>

          {/* Tier B */}
          <div className="relative overflow-hidden rounded-lg border border-cyan-500/30 bg-[#091428] p-3 shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-md bg-cyan-500/15">
                  {t.tierBBadge}
                </span>
                <span className="text-[10px] font-mono text-cyan-300/80 bg-black/40 px-1.5 py-0.5 rounded">
                  85 ~ 99 分
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {t.tierBDesc}
            </p>
          </div>

          {/* Tier C */}
          <div className="relative overflow-hidden rounded-lg border border-orange-500/30 bg-[#091428] p-3 shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-300 border border-orange-500/40 px-2 py-0.5 rounded-md bg-orange-500/15">
                  {t.tierCBadge}
                </span>
                <span className="text-[10px] font-mono text-orange-300/80 bg-black/40 px-1.5 py-0.5 rounded">
                  70 ~ 84 分
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {t.tierCDesc}
            </p>
          </div>

          {/* Tier D */}
          <div className="relative overflow-hidden rounded-lg border border-rose-600/40 bg-rose-950/15 p-3 shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600" />
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-md bg-rose-500/20">
                  {t.tierDBadge}
                </span>
                <span className="text-[10px] font-mono text-rose-300/80 bg-black/40 px-1.5 py-0.5 rounded">
                  &lt; 70 分
                </span>
              </div>
            </div>
            <p className="text-xs text-rose-200 mt-2 leading-relaxed">
              {t.tierDDesc}
            </p>
          </div>
        </div>
      </section>

      {/* 4. The 5-Pillar Composite Engine */}
      <section className="space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#c89b3c]/90 px-1 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#c89b3c]" />
          <span>{t.algoPillarsTitle}</span>
        </div>
        <p className="text-[11px] text-slate-400 px-1 -mt-1">{t.algoPillarsDesc}</p>

        <div className="space-y-2.5">
          {/* Pillar 1 */}
          <div className="rounded-xl border border-white/10 bg-[#091428]/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#0ac8b9]/20 border border-[#0ac8b9]/40 flex items-center justify-center text-[#0ac8b9]">
                  <Swords className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-[#f0e6d2]">{t.pillar1Title}</h3>
              </div>
              <span className="text-[10px] font-bold text-[#0ac8b9] bg-[#0ac8b9]/15 border border-[#0ac8b9]/30 px-2 py-0.5 rounded-full">
                权重 40%
              </span>
            </div>
            <div className="text-[11px] text-cyan-300 font-medium">{t.pillar1Subtitle}</div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{t.pillar1Desc}</p>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-xl border border-white/10 bg-[#091428]/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#c89b3c]/20 border border-[#c89b3c]/40 flex items-center justify-center text-[#c89b3c]">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-[#f0e6d2]">{t.pillar2Title}</h3>
              </div>
              <span className="text-[10px] font-bold text-[#c89b3c] bg-[#c89b3c]/15 border border-[#c89b3c]/30 px-2 py-0.5 rounded-full">
                权重 15%
              </span>
            </div>
            <div className="text-[11px] text-amber-300 font-medium">{t.pillar2Subtitle}</div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{t.pillar2Desc}</p>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-xl border border-white/10 bg-[#091428]/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-[#f0e6d2]">{t.pillar3Title}</h3>
              </div>
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full">
                权重 20%
              </span>
            </div>
            <div className="text-[11px] text-rose-300 font-medium">{t.pillar3Subtitle}</div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{t.pillar3Desc}</p>
          </div>

          {/* Pillar 4 */}
          <div className="rounded-xl border border-white/10 bg-[#091428]/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-[#f0e6d2]">{t.pillar4Title}</h3>
              </div>
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full">
                权重 15%
              </span>
            </div>
            <div className="text-[11px] text-purple-300 font-medium">{t.pillar4Subtitle}</div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{t.pillar4Desc}</p>
          </div>

          {/* Pillar 5 */}
          <div className="rounded-xl border border-white/10 bg-[#091428]/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-[#f0e6d2]">{t.pillar5Title}</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                权重 10%
              </span>
            </div>
            <div className="text-[11px] text-emerald-300 font-medium">{t.pillar5Subtitle}</div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{t.pillar5Desc}</p>
          </div>
        </div>
      </section>

      {/* 5. Tactical Report Console & Safety Principles */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {/* Report Console Principle */}
        <div className="rounded-xl border border-white/10 bg-[#091428]/60 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#c89b3c]">
            <CheckCircle2 className="w-4 h-4 text-[#c89b3c]" />
            <span>{t.algoReportTitle}</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {t.algoReportDesc}
          </p>
        </div>

        {/* Safety & Vanguard Safe */}
        <div className="rounded-xl border border-white/10 bg-[#091428]/60 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t.algoSafetyTitle}</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {t.algoSafetyDesc}
          </p>
        </div>
      </section>
    </div>
  );
}
