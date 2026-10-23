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
} from 'lucide-react';
import type { UpdateInfo } from '../services/wailsBridge';
import { WailsBridge } from '../services/wailsBridge';
import type { translations } from '../i18n/translations';
import { AlgorithmGuideView } from './AlgorithmGuideView';
import appLogo from '../assets/appicon.png';

export type SettingsTab = 'updates' | 'algorithm' | 'changelog' | 'contact';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
  t: (typeof translations)['zh'];
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
  initialTab = 'updates',
  t,
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

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[510px] h-[580px] bg-[#091428] border border-[#c89b3c]/50 rounded-2xl shadow-2xl flex flex-col text-[#f0e6d2] overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#c89b3c]/15 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Modal Top Bar */}
        <div className="draggable relative z-10 px-4 py-3 bg-[#0a1428]/90 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#c89b3c]/20 border border-[#c89b3c]/40 overflow-hidden flex items-center justify-center p-0.5 shadow-inner">
              <img src={appLogo} alt="Logo" className="w-full h-full object-cover rounded" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#f0e6d2] flex items-center gap-2">
                <span>{t.settingsModalTitle}</span>
                <span className="text-[10px] font-mono text-[#c89b3c] bg-[#c89b3c]/15 px-1.5 py-0.5 rounded border border-[#c89b3c]/30">
                  {t.version}
                </span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Horizontal Navigation Tabs */}
        <div className="flex items-center bg-[#06101e] px-3 border-b border-white/5 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('updates')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors relative cursor-pointer ${
              activeTab === 'updates'
                ? 'border-[#c89b3c] text-[#f0e6d2]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#c89b3c]" />
            <span>{t.settingsTabUpdates}</span>
            {updateInfo?.hasUpdate && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('algorithm')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'algorithm'
                ? 'border-[#0ac8b9] text-[#f0e6d2]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#0ac8b9]" />
            <span>{t.settingsTabAlgorithm}</span>
          </button>

          <button
            onClick={() => setActiveTab('changelog')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'changelog'
                ? 'border-[#c89b3c] text-[#f0e6d2]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#c89b3c]" />
            <span>{t.settingsTabChangelog}</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'contact'
                ? 'border-indigo-400 text-[#f0e6d2]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.settingsTabContact}</span>
          </button>
        </div>

        {/* 3. Tab Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: Updates */}
          {activeTab === 'updates' && (
            <div className="space-y-4 text-xs">
              {/* Current Version Card */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">{t.currentVersionLabel.replace('{version}', t.version)}</div>
                    <div className="text-sm font-bold text-[#f0e6d2] mt-0.5 flex items-center gap-2">
                      <span>{t.version} 稳定版</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                        最新架构
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={onCheckUpdate}
                    disabled={isCheckingUpdate || isUpdating}
                    className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                    <span>{isCheckingUpdate ? t.checkingUpdate : t.checkUpdate}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  本程序采用 GitCode（国内直连）与 GitHub（官方海外）双源智能更新，支持无梯子在线秒级极速平滑更新。
                </p>
              </div>

              {/* Has Update Card */}
              {updateInfo?.hasUpdate ? (
                <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-[#091428] to-[#041c18] p-4 space-y-3 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
                        NEW VERSION
                      </span>
                      <h4 className="text-sm font-bold text-emerald-300 mt-1">
                        {t.newVersionFound.replace('{version}', updateInfo.latestVersion)}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{updateInfo.publishedAt?.slice(0, 10)}</span>
                  </div>

                  {/* Release Notes */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-[#c89b3c]">{t.releaseNotes}</div>
                    <div className="max-h-28 overflow-y-auto rounded bg-black/40 border border-white/10 p-2.5 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap select-text">
                      {updateInfo.releaseNotes?.trim() || t.noReleaseNotes}
                    </div>
                  </div>

                  {/* Download Progress / Action Button */}
                  {isUpdating ? (
                    <div className="space-y-2 py-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#0ac8b9] font-medium flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{t.updateDownloading.replace('{percent}', updateProgress.toString())}</span>
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
                      <span>{t.updateNow}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-white/5 bg-[#091428]/40 p-3.5 flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.alreadyLatest.replace('{version}', t.version)}</span>
                </div>
              )}

              {/* Direct Manual Download Links */}
              <div className="rounded-xl border border-white/5 bg-[#091428]/30 p-3.5 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400">备用手动下载源:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => WailsBridge.openBrowser(updateInfo?.gitCodeUrl || 'https://gitcode.com/mengjio007/lol-tool/releases')}
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200">{t.openGitCode}</div>
                      <div className="text-[10px] text-slate-400">国内电信/联通满速</div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  </button>

                  <button
                    onClick={() => WailsBridge.openBrowser(updateInfo?.releaseUrl || 'https://github.com/mengjio007/LOL-tool/releases')}
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-white">{t.openInBrowser}</div>
                      <div className="text-[10px] text-slate-400">GitHub Releases 官方</div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Algorithm Guide */}
          {activeTab === 'algorithm' && (
            <AlgorithmGuideView t={t} />
          )}

          {/* TAB 3: Changelog */}
          {activeTab === 'changelog' && (
            <div className="space-y-3 text-xs">
              {/* v1.0.5 */}
              <div className="rounded-xl border border-[#c89b3c]/40 bg-[#091428] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#f0e6d2]">v1.0.5 稳定版</span>
                  <span className="text-[10px] font-mono text-[#c89b3c] bg-[#c89b3c]/15 px-1.5 py-0.5 rounded border border-[#c89b3c]/30">当前版本</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                  <li><strong className="text-cyan-300">窗口最大化与自适应还原</strong>：顶部新增原生窗口还原/最大化按钮，支持全屏大屏响应式自适应排版。</li>
                  <li><strong className="text-emerald-300">精准战力占比重构</strong>：修复伤害占比与承伤占比误显示 100% 的统计缺陷，接入全局对局战报与限流并发。</li>
                  <li><strong className="text-amber-300">更新交互体验升级</strong>：检查更新浮窗提升至最高层级，增加防频控节流保护与直观反馈。</li>
                </ul>
              </div>

              {/* v1.0.4 */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">v1.0.4</span>
                  <span className="text-[10px] font-mono text-slate-500">2026-10-22</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                  <li>战力单查上线：新增召唤师战力独立穿透查询页面，支持任意游戏昵称/Riot ID，或一键“查我自己”。</li>
                  <li>交互架构重构：将设置、软件更新、算法解读与联系方式聚合为独立设置中心，主界面专注对局核心操作。</li>
                </ul>
              </div>

              {/* v1.0.3 */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">v1.0.3</span>
                  <span className="text-[10px] font-mono text-slate-500">2026-10-22</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                  <li>接入 GitCode 国内原生镜像源与高速 CDN 节点，无需梯子实现秒级检测与更新。</li>
                  <li>新增 Windows PE 二进制文件完整性校验，杜绝运营商拦截与错误坏包。</li>
                </ul>
              </div>

              {/* v1.0.2 */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">v1.0.2</span>
                  <span className="text-[10px] font-mono text-slate-500">2026-10-21</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                  <li>重磅升级 6 档战力金字塔（S+ 通天代、S 掌舵者、A 中流砥柱、B 摇摆者、C 突破口、D 纯牛马）。</li>
                  <li>构建 5 大支柱复合评估引擎（团队战术占比 40%、号角出装 15%、心态连败 20%、高光拆塔 15%、极端胜率 10%）。</li>
                </ul>
              </div>

              {/* v1.0.1 & v1.0.0 */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">v1.0.1 / v1.0.0 首发</span>
                  <span className="text-[10px] font-mono text-slate-500">2026-10-20</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                  <li>基于 Wails v2 + React 19 + TypeScript 构建，单文件独立运行，仅 ~3.8 MB。</li>
                  <li>全自动秒接、智能排队、赛后跳过荣誉一键带回房间，零内存注入安全防封。</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: Contact & About */}
          {activeTab === 'contact' && (
            <div className="space-y-3.5 text-xs">
              {/* Introduction Card */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-300">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span>{t.contactTitle}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {t.contactDesc}
                </p>
              </div>

              {/* Email Contact Card */}
              <div className="rounded-xl border border-white/10 bg-[#091428] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2]">{t.contactEmail}</div>
                      <div className="text-[11px] font-mono text-slate-400 select-text">{t.contactEmailDesc}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(t.contactEmailDesc, 'email')}
                      className="py-1 px-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedType === 'email' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">{t.copySuccess}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{t.copyEmailBtn}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => WailsBridge.openBrowser(`mailto:${t.contactEmailDesc}?subject=LOL智能助手建议反馈`)}
                      className="py-1 px-2.5 rounded bg-[#c89b3c]/20 hover:bg-[#c89b3c]/30 border border-[#c89b3c]/40 text-[11px] text-[#f0e6d2] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3 text-[#c89b3c]" />
                      <span>{t.sendEmailBtn}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* GitHub Official Repo Card */}
              <div className="rounded-xl border border-white/10 bg-[#091428] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2]">{t.contactGithub}</div>
                      <div className="text-[11px] font-mono text-slate-400 truncate max-w-[180px] select-text">
                        github.com/mengjio007/LOL-tool
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(t.contactGithubDesc, 'github')}
                      className="py-1 px-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedType === 'github' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">{t.copySuccess}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{t.copyLinkBtn}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => WailsBridge.openBrowser(t.contactGithubDesc)}
                      className="py-1 px-2.5 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{t.openLinkBtn}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* GitCode Repo Card */}
              <div className="rounded-xl border border-white/10 bg-[#091428] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f0e6d2]">{t.contactGitcode}</div>
                      <div className="text-[11px] font-mono text-slate-400 truncate max-w-[180px] select-text">
                        gitcode.com/mengjio007/lol-tool
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(t.contactGitcodeDesc, 'gitcode')}
                      className="py-1 px-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedType === 'gitcode' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">{t.copySuccess}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{t.copyLinkBtn}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => WailsBridge.openBrowser(t.contactGitcodeDesc)}
                      className="py-1 px-2.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-[11px] text-cyan-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{t.openLinkBtn}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Security & Anti-ban Assurance Card */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex items-start gap-2.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  {t.aboutAppDesc}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
