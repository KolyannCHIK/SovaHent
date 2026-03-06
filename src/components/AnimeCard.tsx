"use client";

import Link from "next/link";
import { Mic, Subtitles, EyeOff, Calendar, Play } from "lucide-react";
import type { AnimeCard as AnimeCardType } from "@/lib/scraper";

interface Props {
  anime: AnimeCardType;
  index?: number;
}

export default function AnimeCard({ anime, index = 0 }: Props) {
  const proxyImage = anime.image
    ? `/api/proxy?url=${encodeURIComponent(anime.image)}`
    : "";

  return (
    <Link
      href={`/watch/${anime.id}-${anime.slug}`}
      className="group relative rounded-xl overflow-hidden bg-[var(--background-card)] border border-[var(--border)] card-glow transition-all duration-300 hover:border-[var(--border-hover)] hover:-translate-y-1 animate-fadeIn"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {proxyImage ? (
          <img
            src={proxyImage}
            alt={anime.titleRu}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-[var(--pink)] opacity-30 flex items-center justify-center">
            <Play className="w-12 h-12 text-white opacity-50" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-[var(--accent)]/80 backdrop-blur-sm flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
          </div>
        </div>

        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {anime.rusVoice && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--accent)]/90 backdrop-blur-sm text-white text-[10px] font-semibold">
              <Mic className="w-3 h-3" /> RUS
            </span>
          )}
          {anime.rusSub && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--pink)]/90 backdrop-blur-sm text-white text-[10px] font-semibold">
              <Subtitles className="w-3 h-3" /> SUB
            </span>
          )}
          {anime.censorship && anime.censorship.toLowerCase().includes("отсутств") && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--success)]/90 backdrop-blur-sm text-white text-[10px] font-semibold">
              <EyeOff className="w-3 h-3" /> 18+
            </span>
          )}
        </div>

        {anime.year && (
          <div className="absolute bottom-2 left-2">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[var(--foreground-muted)] text-[10px] font-medium">
              <Calendar className="w-3 h-3" /> {anime.year}
            </span>
          </div>
        )}

        {anime.episodes && (
          <div className="absolute bottom-2 right-2">
            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[var(--warning)] text-[10px] font-medium">
              {anime.episodes}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-[var(--accent)] transition-colors leading-tight">
          {anime.titleRu || anime.title}
        </h3>
        {anime.genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {anime.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
