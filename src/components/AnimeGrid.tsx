"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, Film } from "lucide-react";
import AnimeCard from "./AnimeCard";
import Pagination from "./Pagination";
import SkeletonCard from "./SkeletonCard";
import type { AnimeCard as AnimeCardType } from "@/lib/scraper";

export default function AnimeGrid() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<AnimeCardType[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || "";
  const genre = searchParams.get("genre") || "";
  const category = searchParams.get("category") || "";

  const fetchData = useCallback(async (page: number) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (query) params.set("q", query);
      if (tag) params.set("tag", tag);
      if (genre) params.set("genre", genre);
      if (category) params.set("category", category);

      const res = await fetch(`/api/anime?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);
    } catch {
      setError("Не удалось загрузить данные. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  }, [query, tag, genre, category]);

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
  }, [fetchData]);

  const handlePageChange = (page: number) => {
    fetchData(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getTitle = () => {
    if (query) return `Поиск: "${query}"`;
    if (tag) return `Год: ${tag}`;
    if (genre) {
      const genreNames: Record<string, string> = {
        Anal: "Анал", BDSM: "БДСМ", Big: "Большие сиськи", bondage: "Бондаж",
        Vibrators: "Вибраторы", Harem: "Гарем", Group: "Групповуха", Virgin: "Девственницы",
        Demons: "Демоны", Housewives: "Домохозяйки", Drama: "Драма", Incest: "Инцест",
        Comedy: "Комедия", Magic: "Магия", small: "Маленькие сиськи", Nurse: "Медсестры",
        Oral: "Минет", Mystic: "Мистика", Monster: "Монстры", Netorare: "Нетораре",
        paizuri: "Пайзури", Romance: "Романтика", "Sci-Fi": "Скай Фай", Maid: "Служанки",
        Straight: "Старлайт", Succubus: "Сукубы", Horror: "Ужасы", Fantasy: "Фэнтези",
        Tentacles: "Щупальцы",
      };
      return genreNames[genre] || genre;
    }
    if (category === "ozvuchka") return "Русская озвучка";
    if (category === "rus-sub") return "Русские субтитры";
    if (category === "uncensored") return "Без цензуры";
    return "Новинки";
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-12 h-12 text-[var(--danger)] mb-4" />
        <p className="text-[var(--foreground-muted)]">{error}</p>
        <button
          onClick={() => fetchData(currentPage)}
          className="mt-4 px-6 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <Film className="w-5 h-5 text-[var(--accent)]" />
          {getTitle()}
        </h2>
        {!loading && (
          <span className="text-sm text-[var(--foreground-muted)]">
            {items.length} найдено
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="w-12 h-12 text-[var(--foreground-muted)] mb-4 opacity-30" />
          <p className="text-[var(--foreground-muted)]">Ничего не найдено</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item, idx) => (
              <AnimeCard key={item.id} anime={item} index={idx} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
