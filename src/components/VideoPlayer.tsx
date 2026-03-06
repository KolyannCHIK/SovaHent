"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Settings,
  Loader2,
  ChevronDown,
} from "lucide-react";
import type { PlayerFile } from "@/lib/scraper";

interface Props {
  files: PlayerFile[];
  poster?: string;
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({ files, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [hasError, setHasError] = useState(false);

  const activeFile = files[activeIndex];
  const showControls = controlsVisible || !isPlaying;

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setControlsVisible(true);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  // Video event listeners
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => { setIsPlaying(false); setControlsVisible(true); };
    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onDurationChange = () => setDuration(v.duration);
    const onProgress = () => {
      if (v.buffered.length > 0) {
        setBuffered(v.buffered.end(v.buffered.length - 1));
      }
    };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => { setIsLoading(false); setHasError(false); };
    const onError = () => { setIsLoading(false); setHasError(true); };

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("durationchange", onDurationChange);
    v.addEventListener("progress", onProgress);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("error", onError);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("durationchange", onDurationChange);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("error", onError);
    };
  }, []);

  // Fullscreen listener
  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); } else { v.pause(); }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      c.requestFullscreen();
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current;
      if (!v) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 10);
          break;
        case "ArrowRight":
          e.preventDefault();
          v.currentTime = Math.min(v.duration, v.currentTime + 10);
          break;
        case "ArrowUp":
          e.preventDefault();
          v.volume = Math.min(1, v.volume + 0.1);
          setVolume(v.volume);
          break;
        case "ArrowDown":
          e.preventDefault();
          v.volume = Math.max(0, v.volume - 0.1);
          setVolume(v.volume);
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
      }
      scheduleHide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scheduleHide, togglePlay, toggleMute, toggleFullscreen]);

  const switchFile = (index: number) => {
    setIsLoading(true);
    setHasError(false);
    setActiveIndex(index);
    setShowFileMenu(false);
    setTimeout(() => {
      const v = videoRef.current;
      if (v) { v.load(); v.play().catch(() => {}); }
    }, 0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar) return;
    const rect = bar.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
    v.muted = val === 0;
  };

  const changeSpeed = (rate: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const prevVideo = () => {
    for (let i = activeIndex - 1; i >= 0; i--) {
      if (files[i].type === "video") { switchFile(i); return; }
    }
  };

  const nextVideo = () => {
    for (let i = activeIndex + 1; i < files.length; i++) {
      if (files[i].type === "video") { switchFile(i); return; }
    }
  };

  const hasPrev = files.some((f, i) => i < activeIndex && f.type === "video");
  const hasNext = files.some((f, i) => i > activeIndex && f.type === "video");
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden group select-none"
      onMouseMove={scheduleHide}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".player-ui")) return;
        togglePlay();
        scheduleHide();
      }}
    >
      <video
        ref={videoRef}
        src={activeFile?.url}
        poster={poster}
        className="w-full aspect-video"
        playsInline
        preload="auto"
      />

      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <Loader2 className="w-12 h-12 text-[var(--accent)] animate-spin" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
          <p className="text-white/70 text-sm mb-3">Не удалось загрузить видео</p>
          <button
            onClick={(e) => { e.stopPropagation(); videoRef.current?.load(); }}
            className="player-ui px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            Повторить
          </button>
        </div>
      )}

      {!isPlaying && !isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-[var(--accent)]/80 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-9 h-9 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`player-ui absolute inset-x-0 bottom-0 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

        <div className="relative px-4 pb-3 pt-10">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="group/progress h-1.5 hover:h-2.5 bg-white/20 rounded-full cursor-pointer transition-all mb-3 relative"
            onClick={handleProgressClick}
          >
            <div className="absolute inset-y-0 left-0 bg-white/15 rounded-full" style={{ width: `${bufferedPct}%` }} />
            <div className="absolute inset-y-0 left-0 bg-[var(--accent)] rounded-full transition-none" style={{ width: `${progress}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-0.5">
              {hasPrev && (
                <button onClick={prevVideo} className="p-1.5 text-white/80 hover:text-white transition-colors">
                  <SkipBack className="w-5 h-5" />
                </button>
              )}
              <button onClick={togglePlay} className="p-1.5 text-white hover:text-[var(--accent)] transition-colors">
                {isPlaying ? <Pause className="w-6 h-6" fill="white" /> : <Play className="w-6 h-6" fill="white" />}
              </button>
              {hasNext && (
                <button onClick={nextVideo} className="p-1.5 text-white/80 hover:text-white transition-colors">
                  <SkipForward className="w-5 h-5" />
                </button>
              )}
            </div>

            <span className="text-white/80 text-xs font-mono tabular-nums whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-1 group/vol">
              <button onClick={toggleMute} className="p-1.5 text-white/80 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0} max={1} step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-[var(--accent)] h-1 opacity-0 group-hover/vol:opacity-100"
              />
            </div>

            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => { setShowSpeedMenu((v) => !v); setShowFileMenu(false); }}
                className="p-1.5 text-white/80 hover:text-white transition-colors flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                {playbackRate !== 1 && <span className="text-[10px] font-bold text-[var(--accent)]">{playbackRate}x</span>}
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10 rounded-lg p-1 shadow-2xl min-w-[100px]">
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changeSpeed(rate)}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                        playbackRate === rate ? "bg-[var(--accent)] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {rate === 1 ? "Обычная" : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* File selector */}
            {files.filter((f) => f.type === "video").length > 1 && (
              <div className="relative">
                <button
                  onClick={() => { setShowFileMenu((v) => !v); setShowSpeedMenu(false); }}
                  className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors flex items-center gap-1"
                >
                  {activeFile?.title || "Файл"}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showFileMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10 rounded-lg p-1 shadow-2xl min-w-[160px] max-h-60 overflow-y-auto">
                    {files.map((file, i) => {
                      if (file.type !== "video") return null;
                      const label = file.url.includes("_rus_")
                        ? `${file.title} — Озвучка`
                        : file.url.includes("_sub_")
                        ? `${file.title} — Субтитры`
                        : file.title;
                      return (
                        <button
                          key={i}
                          onClick={() => switchFile(i)}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                            activeIndex === i ? "bg-[var(--accent)] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button onClick={toggleFullscreen} className="p-1.5 text-white/80 hover:text-white transition-colors">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
