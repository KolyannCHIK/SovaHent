"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tag, Calendar, Sparkles } from "lucide-react";
import { GENRES, YEARS } from "@/lib/scraper";
import PollWidget from "@/components/PollWidget";

export default function Sidebar() {
  const searchParams = useSearchParams();
  const activeGenre = searchParams.get("genre") || "";
  const activeTag = searchParams.get("tag") || "";

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-6">
      <div className="rounded-xl bg-[var(--background-card)] border border-[var(--border)] p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
          <Calendar className="w-4 h-4 text-[var(--accent)]" />
          Год выпуска
        </h3>
        <div className="flex flex-wrap gap-2">
          {YEARS.map((year) => (
            <Link
              key={year}
              href={`/?tag=${year}`}
              className={`badge ${activeTag === year ? "badge-active" : ""}`}
            >
              {year}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-[var(--background-card)] border border-[var(--border)] p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
          <Tag className="w-4 h-4 text-[var(--pink)]" />
          Жанры
        </h3>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <Link
              key={genre.slug}
              href={`/?genre=${genre.slug}`}
              className={`badge ${activeGenre === genre.slug ? "badge-active" : ""}`}
            >
              {genre.name}
            </Link>
          ))}
        </div>
      </div>

      <PollWidget />

      <div className="rounded-xl bg-gradient-to-br from-[var(--accent)]/10 to-[var(--pink)]/10 border border-[var(--accent)]/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-bold text-white">SovaHent</h3>
        </div>
        <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
          Красивый каталог аниме с удобным поиском, фильтрами и онлайн просмотром.
        </p>
      </div>
    </aside>
  );
}
