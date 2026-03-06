"use client";

import { useState, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  SkipForward,
  SkipBack,
  Moon,
} from "lucide-react";
import type { PlayerFile } from "@/lib/scraper";

interface Props {
  files: PlayerFile[];
  animePoster?: string;
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ files, animePoster }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const activeFile = files[activeIndex];
  const proxiedUrl = activeFile?.url
    ? `/api/proxy?url=${encodeURIComponent(activeFile.url)}`
    : "";

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); } else { a.pause(); }
  }, []);

  const switchTrack = (index: number) => {
    setActiveIndex(index);
    setCurrentTime(0);
    setDuration(0);
    setTimeout(() => {
      const a = audioRef.current;
      if (a) { a.load(); a.play().catch(() => {}); }
    }, 0);
  };

  const handleTimeUpdate = () => {
    const a = audioRef.current;
    if (a) setCurrentTime(a.currentTime);
  };

  const handleDurationChange = () => {
    const a = audioRef.current;
    if (a) setDuration(a.duration);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    const bar = e.currentTarget;
    if (!a) return;
    const rect = bar.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    const val = parseFloat(e.target.value);
    a.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
    a.muted = val === 0;
  };

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !a.muted;
    setIsMuted(a.muted);
  };

  const hasMultiple = files.length > 1;
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < files.length - 1;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Extract track name from URL
  const getTrackName = (file: PlayerFile) => {
    try {
      const decoded = decodeURIComponent(file.url);
      const filename = decoded.split("/").pop() || file.title;
      return filename.replace(/\.(mp3|ogg|wav|flac|aac)$/i, "").replace(/_/g, " ");
    } catch {
      return file.title;
    }
  };

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--border)]">
      {/* Header with artwork */}
      <div className="relative bg-gradient-to-br from-[#1a1040] via-[#2d1b69] to-[#1a1040] p-6">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {animePoster && (
            <img
              src={animePoster}
              alt=""
              className="w-full h-full object-cover opacity-10 blur-2xl scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1040]/80 via-[#2d1b69]/60 to-[#1a1040]/80" />
        </div>

        <div className="relative flex items-center gap-5">
          {/* Vinyl/disc animation */}
          <div className="relative shrink-0">
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#6c3ce0]/30 bg-gradient-to-br from-[#2d1b69] to-[#1a1040] flex items-center justify-center shadow-lg shadow-[#6c3ce0]/20 ${
                isPlaying ? "animate-spin" : ""
              }`}
              style={{ animationDuration: "3s" }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#6c3ce0] to-[#a855f7] flex items-center justify-center">
                <Music className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              {/* Vinyl grooves */}
              <div className="absolute inset-3 rounded-full border border-white/5" />
              <div className="absolute inset-5 rounded-full border border-white/5" />
              <div className="absolute inset-7 rounded-full border border-white/5" />
            </div>
          </div>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Moon className="w-4 h-4 text-[#a855f7]" />
              <span className="text-[#a855f7] text-xs font-semibold uppercase tracking-wider">
                Саундтрек от Lunar
              </span>
            </div>
            <h3 className="text-white font-bold text-base sm:text-lg truncate">
              {getTrackName(activeFile)}
            </h3>
            <p className="text-white/40 text-xs mt-1">
              Хента-трек — {files.length > 1 ? `Трек ${activeIndex + 1} из ${files.length}` : "Эксклюзив"}
            </p>
          </div>
        </div>

        {/* Audio element */}
        <audio
          ref={audioRef}
          src={proxiedUrl}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => { if (hasNext) switchTrack(activeIndex + 1); else setIsPlaying(false); }}
          preload="auto"
        />

        {/* Progress bar */}
        <div className="relative mt-5">
          <div
            className="h-1.5 bg-white/10 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-[#6c3ce0] to-[#a855f7] rounded-full relative transition-none"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg shadow-[#6c3ce0]/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-white/40 text-[10px] font-mono">{formatTime(currentTime)}</span>
            <span className="text-white/40 text-[10px] font-mono">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-3">
          {hasMultiple && (
            <button
              onClick={() => {
                if (hasPrev) switchTrack(activeIndex - 1);
                else { const a = audioRef.current; if (a) a.currentTime = 0; }
              }}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6c3ce0] to-[#a855f7] flex items-center justify-center text-white shadow-lg shadow-[#6c3ce0]/40 hover:shadow-[#6c3ce0]/60 hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying
              ? <Pause className="w-6 h-6" fill="white" />
              : <Play className="w-6 h-6 ml-0.5" fill="white" />
            }
          </button>

          {hasMultiple && (
            <button
              onClick={() => {
                if (hasNext) switchTrack(activeIndex + 1);
                else { const a = audioRef.current; if (a) a.currentTime = 0; }
              }}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Volume */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <button onClick={toggleMute} className="p-1 text-white/50 hover:text-white/80 transition-colors">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0} max={1} step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 accent-[#a855f7] h-1"
          />
        </div>
      </div>

      {/* Track list */}
      {files.length > 1 && (
        <div className="bg-[#0d0a1a] border-t border-[var(--border)]">
          <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-white/30 font-semibold">
            Список треков
          </div>
          {files.map((file, i) => (
            <button
              key={i}
              onClick={() => switchTrack(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                activeIndex === i
                  ? "bg-[#6c3ce0]/15 text-[#a855f7]"
                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                activeIndex === i
                  ? "bg-gradient-to-br from-[#6c3ce0] to-[#a855f7]"
                  : "bg-white/5"
              }`}>
                {activeIndex === i && isPlaying ? (
                  <div className="flex items-center gap-0.5">
                    <div className="w-0.5 h-2.5 bg-white rounded-full animate-pulse" />
                    <div className="w-0.5 h-3.5 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                    <div className="w-0.5 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                  </div>
                ) : (
                  <Music className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{getTrackName(file)}</div>
              </div>
              <span className="text-[10px] opacity-50">{file.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
