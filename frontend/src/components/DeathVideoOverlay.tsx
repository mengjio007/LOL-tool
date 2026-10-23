import { useEffect, useState, useRef } from 'react';
import {
  Skull,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  FolderOpen,
  Globe,
  RotateCw,
} from 'lucide-react';
import type { DeathInfo, DeathVideoConfig } from '../services/wailsBridge';
import { WailsBridge } from '../services/wailsBridge';

interface DeathVideoOverlayProps {
  deathInfo: DeathInfo | null;
  config: DeathVideoConfig;
  onClose: () => void;
  onUpdateFolder?: (folder: string) => void;
}

export function DeathVideoOverlay({
  deathInfo,
  config,
  onClose,
  onUpdateFolder,
}: DeathVideoOverlayProps) {
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [initialTime, setInitialTime] = useState<number>(20);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(config.volume ?? 40);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync remaining respawn timer
  useEffect(() => {
    if (deathInfo?.respawnTimer) {
      setRemainingTime(Math.ceil(deathInfo.respawnTimer));
      if (!initialTime || deathInfo.respawnTimer > initialTime) {
        setInitialTime(Math.max(1, Math.ceil(deathInfo.respawnTimer)));
      }
    }
  }, [deathInfo?.respawnTimer]);

  // Countdown timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Video source loading logic
  const loadNextVideo = async () => {
    if (config.source === 'local') {
      if (!config.localFolder) {
        setVideoError('尚未选择本地视频文件夹，请选择后即可秒级播放');
        return;
      }
      setIsLoadingVideo(true);
      setVideoError(null);
      try {
        const streamUrl = await WailsBridge.getRandomVideoURL(config.localFolder);
        if (streamUrl) {
          setVideoUrl(streamUrl);
        } else {
          setVideoError('文件夹中未找到可播放视频 (.mp4 / .webm)');
        }
      } catch (err: any) {
        setVideoError(err?.message || '读取本地视频失败');
      } finally {
        setIsLoadingVideo(false);
      }
    }
  };

  useEffect(() => {
    loadNextVideo();
  }, [config.source, config.localFolder]);

  // Handle video element volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted, videoUrl]);

  // Instant kill audio on unmount / close
  const handleSafeClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.muted = true;
    }
    onClose();
  };

  const handlePickFolder = async () => {
    try {
      const folder = await WailsBridge.selectDirectory();
      if (folder && onUpdateFolder) {
        onUpdateFolder(folder);
      }
    } catch {}
  };

  const progressPercent = Math.max(
    0,
    Math.min(100, (remainingTime / Math.max(1, initialTime)) * 100)
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="relative w-full max-w-[440px] bg-[#101726] border-2 border-[#c89b3c]/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header: Death Status & Respawn Timer */}
        <div className="bg-gradient-to-r from-[#1c1218] via-[#101726] to-[#0c1c24] px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 animate-pulse">
              <Skull className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <span>阵亡休息区</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30">
                  {deathInfo?.championName || 'Champion'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                复活倒计时:{' '}
                <span className="text-amber-400 font-bold text-xs">{remainingTime}s</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Volume toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg bg-black/40 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? '取消静音' : '静音'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Next Video */}
            {config.source === 'local' && (
              <button
                onClick={loadNextVideo}
                disabled={isLoadingVideo}
                className="p-1.5 rounded-lg bg-black/40 hover:bg-white/10 text-slate-300 hover:text-[#c89b3c] transition-colors cursor-pointer"
                title="换一个视频"
              >
                <RotateCw className={`w-4 h-4 ${isLoadingVideo ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={handleSafeClose}
              className="p-1.5 rounded-lg bg-black/40 hover:bg-rose-500/30 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="立即关闭 (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Respawn Countdown Progress Bar */}
        <div className="w-full bg-slate-900 h-1.5 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Video Player Display Area */}
        <div className="relative aspect-[9/14] sm:aspect-[9/15] max-h-[560px] w-full bg-black flex items-center justify-center overflow-hidden">
          {config.source === 'local' ? (
            videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain"
                onEnded={loadNextVideo}
              />
            ) : (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-300 max-w-[260px] leading-relaxed">
                  {videoError || '尚未配置本地视频文件夹。建议选择放有搞笑鬼畜、下饭切片或短视频的目录。'}
                </p>
                <button
                  onClick={handlePickFolder}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c89b3c] to-[#a87f28] text-black font-bold text-xs shadow-md shadow-[#c89b3c]/20 hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  浏览并选择视频目录
                </button>
              </div>
            )
          ) : (
            /* Douyin Web Embed */
            <div className="w-full h-full relative">
              <iframe
                src="https://www.douyin.com/"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-same-origin allow-scripts allow-popups"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-[10px] text-slate-300 border border-white/10 flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#0ac8b9]" />
                <span>抖音精选在线流</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status / Volume Control */}
        <div className="bg-[#0b101b] px-4 py-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>音量</span>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-20 h-1 accent-[#c89b3c] cursor-pointer"
            />
            <span className="font-mono text-[10px] text-slate-400">{isMuted ? '静音' : `${volume}%`}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>复活将自动关闭</span>
            </span>
            <button
              onClick={handleSafeClose}
              className="px-2.5 py-0.8 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-[10px] transition-colors cursor-pointer"
            >
              提前返回游戏
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
