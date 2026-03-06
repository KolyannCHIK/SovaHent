"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Film,
  Clock,
  Mic,
  Subtitles,
  EyeOff,
  Building2,
  Info,
  MessageSquare,
  User,
  Loader2,
  AlertCircle,
  Tag,
} from "lucide-react";
import type { AnimeDetail } from "@/lib/scraper";
import VideoPlayer from "@/components/VideoPlayer";
import AudioPlayer from "@/components/AudioPlayer";

export default function WatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [anime, setAnime] = useState<AnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"player" | "info" | "comments">("player");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/anime/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setAnime(data);
      } catch {
        setError("Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-12 h-12 text-[var(--danger)] mb-4" />
        <p className="text-[var(--foreground-muted)] mb-4">{error || "Не найдено"}</p>
        <Link
          href="/"
          className="px-6 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          На главную
        </Link>
      </div>
    );
  }

  const proxyImage = anime.image
    ? `/api/proxy?url=${encodeURIComponent(anime.image)}`
    : "";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fadeIn">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к каталогу
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Poster + Info sidebar */}
        <div className="lg:w-80 shrink-0">
          <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--background-card)]">
            {proxyImage ? (
              <img
                src={proxyImage}
                alt={anime.titleRu}
                className="w-full aspect-[3/4] object-cover"
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-gradient-to-br from-[var(--accent)]/20 to-[var(--pink)]/20 flex items-center justify-center">
                <Film className="w-16 h-16 text-[var(--foreground-muted)] opacity-30" />
              </div>
            )}
          </div>

          {/* Quick info badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {anime.rusVoice && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-medium">
                <Mic className="w-3.5 h-3.5" /> Озвучка
              </span>
            )}
            {anime.rusSub && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--pink)]/10 border border-[var(--pink)]/30 text-[var(--pink)] text-xs font-medium">
                <Subtitles className="w-3.5 h-3.5" /> Субтитры
              </span>
            )}
            {anime.censorship && anime.censorship.toLowerCase().includes("отсутств") && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--success)] text-xs font-medium">
                <EyeOff className="w-3.5 h-3.5" /> Без цензуры
              </span>
            )}
          </div>

          {/* Detail info */}
          <div className="mt-4 rounded-xl bg-[var(--background-card)] border border-[var(--border)] p-4 space-y-3">
            {anime.year && (
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Год" value={anime.year} />
            )}
            {anime.episodes && (
              <InfoRow icon={<Film className="w-4 h-4" />} label="Эпизоды" value={anime.episodes} />
            )}
            {anime.duration && (
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Длительность" value={anime.duration} />
            )}
            {anime.studio && (
              <InfoRow icon={<Building2 className="w-4 h-4" />} label="Студия" value={anime.studio} />
            )}
            {anime.censorship && (
              <InfoRow icon={<EyeOff className="w-4 h-4" />} label="Цензура" value={anime.censorship} />
            )}
            {anime.genres.length > 0 && (
              <div className="pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] mb-2">
                  <Tag className="w-3.5 h-3.5" /> Жанры
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {anime.genres.map((genre) => (
                    <Link
                      key={genre}
                      href={`/?genre=${encodeURIComponent(genre)}`}
                      className="badge text-[11px]"
                    >
                      {genre}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-6">
            {anime.titleRu}
          </h1>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-[var(--background-secondary)] rounded-xl p-1 border border-[var(--border)]">
            <TabButton
              active={activeTab === "player"}
              onClick={() => setActiveTab("player")}
              icon={<Film className="w-4 h-4" />}
              label="Плеер"
            />
            <TabButton
              active={activeTab === "info"}
              onClick={() => setActiveTab("info")}
              icon={<Info className="w-4 h-4" />}
              label="Описание"
            />
            <TabButton
              active={activeTab === "comments"}
              onClick={() => setActiveTab("comments")}
              icon={<MessageSquare className="w-4 h-4" />}
              label={`Комментарии${anime.comments.length ? ` (${anime.comments.length})` : ""}`}
            />
          </div>

          {/* Tab content */}
          {activeTab === "player" && (
            <div className="animate-fadeIn">
              <PlayerSection anime={anime} />
            </div>
          )}

          {activeTab === "info" && (
            <div className="animate-fadeIn space-y-4">
              {anime.description && (
                <div className="rounded-xl bg-[var(--background-card)] border border-[var(--border)] p-5">
                  <h3 className="text-sm font-bold text-white mb-3">Описание</h3>
                  <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                    {anime.description}
                  </p>
                </div>
              )}
              {anime.changes && (
                <div className="rounded-xl bg-[var(--background-card)] border border-[var(--border)] p-5">
                  <h3 className="text-sm font-bold text-white mb-3">Изменения</h3>
                  <p className="text-sm text-[var(--foreground-muted)]">{anime.changes}</p>
                </div>
              )}
              {anime.note && (
                <div className="rounded-xl bg-[var(--background-card)] border border-[var(--border)] p-5">
                  <h3 className="text-sm font-bold text-white mb-3">Примечание</h3>
                  <p className="text-sm text-[var(--foreground-muted)]">{anime.note}</p>
                </div>
              )}
              {!anime.description && !anime.changes && !anime.note && (
                <div className="rounded-xl bg-[var(--background-card)] border border-[var(--border)] p-8 text-center">
                  <p className="text-[var(--foreground-muted)]">Описание отсутствует</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div className="animate-fadeIn space-y-3">
              {anime.comments.length > 0 ? (
                anime.comments.map((comment, idx) => {
                  const isLunar = comment.author === "Lunar";
                  return (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 ${
                      isLunar
                        ? "bg-gradient-to-r from-[#1a1040] to-[var(--background-card)] border border-[#6c3ce0]/40 shadow-lg shadow-[#6c3ce0]/10"
                        : "bg-[var(--background-card)] border border-[var(--border)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        isLunar
                          ? "bg-gradient-to-br from-[#6c3ce0] to-[#a855f7] ring-2 ring-[#a855f7]/30"
                          : "bg-gradient-to-br from-[var(--accent)] to-[var(--pink)]"
                      }`}>
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className={`text-sm font-medium ${isLunar ? "text-[#a855f7]" : "text-white"}`}>
                        {comment.author}
                      </span>
                      {isLunar && (
                        <span className="px-2 py-0.5 rounded-md bg-[#6c3ce0]/20 border border-[#6c3ce0]/30 text-[10px] font-bold text-[#a855f7] uppercase tracking-wider">
                          Боженька
                        </span>
                      )}
                      <div className="flex-1" />
                      {comment.date && (
                        <span className="text-xs text-[var(--foreground-muted)]">{comment.date}</span>
                      )}
                    </div>
                    {comment.replyTo && (
                      <div className="ml-9 mb-2 rounded-lg bg-[var(--background-secondary)] border-l-2 border-[var(--accent)]/50 px-3 py-2">
                        <span className="text-[11px] font-semibold text-[var(--accent)]">
                          ↩ {comment.replyTo}
                        </span>
                        {comment.replyText && (
                          <p className="text-xs text-[var(--foreground-muted)] mt-0.5 line-clamp-2 italic">
                            {comment.replyText}
                          </p>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed pl-9 whitespace-pre-line">
                      {comment.text}
                    </p>
                  </div>
                  );
                })
              ) : (
                <div className="rounded-xl bg-[var(--background-card)] border border-[var(--border)] p-8 text-center">
                  <MessageSquare className="w-10 h-10 text-[var(--foreground-muted)] opacity-30 mx-auto mb-3" />
                  <p className="text-[var(--foreground-muted)]">Комментариев пока нет</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[var(--accent)] mt-0.5 shrink-0">{icon}</div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-muted)]">{label}</div>
        <div className="text-sm text-white">{value}</div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent-glow)]"
          : "text-[var(--foreground-muted)] hover:text-white hover:bg-[var(--background-card-hover)]"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function PlayerSection({ anime }: { anime: AnimeDetail }) {
  const videoFiles = (anime.files || []).filter((f) => f.type === "video");
  const audioFiles = (anime.files || []).filter((f) => f.type === "audio");
  const proxyPoster = anime.image ? `/api/proxy?url=${encodeURIComponent(anime.image)}` : undefined;

  if (videoFiles.length === 0 && audioFiles.length === 0) {
    return (
      <div className="rounded-xl bg-[var(--background-card)] border border-[var(--border)] overflow-hidden">
        <div className="aspect-video flex flex-col items-center justify-center bg-black/50">
          <Film className="w-16 h-16 text-[var(--foreground-muted)] opacity-30 mb-4" />
          <p className="text-[var(--foreground-muted)] text-sm mb-4">
            Плеер недоступен — смотрите на оригинальном сайте
          </p>
          <a
            href={anime.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            Открыть на Hentasis
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video player */}
      {videoFiles.length > 0 && (
        <VideoPlayer files={videoFiles} poster={proxyPoster} />
      )}

      {/* Audio player for soundtracks */}
      {audioFiles.length > 0 && (
        <AudioPlayer files={audioFiles} animePoster={proxyPoster} />
      )}

      {/* Fallback link */}
      <div className="rounded-xl bg-[var(--background-card)] border border-[var(--border)] p-3 flex items-center justify-between">
        <span className="text-xs text-[var(--foreground-muted)]">
          Если видео не работает, попробуйте оригинал
        </span>
        <a
          href={anime.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
        >
          Hentasis →
        </a>
      </div>
    </div>
  );
}
