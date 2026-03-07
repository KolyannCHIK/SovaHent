"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Vote, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface PollOption {
  text: string;
  votes: number;
  percent: number;
}

interface Poll {
  id: number;
  title: string;
  options: PollOption[];
  total: number;
}

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f97316", "#ef4444", "#ec4899", "#14b8a6"];

export default function PollWidget() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/polls")
      .then((r) => r.json())
      .then((data: Poll[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setPolls(data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i === 0 ? polls.length - 1 : i - 1));
  }, [polls.length]);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i === polls.length - 1 ? 0 : i + 1));
  }, [polls.length]);

  if (loading) {
    return (
      <div className="rounded-xl bg-[var(--background-card)] border border-[var(--border)] p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-[#8b5cf6] animate-spin" />
      </div>
    );
  }

  if (error || polls.length === 0) return null;

  const poll = polls[currentIndex];

  return (
    <div className="rounded-xl bg-[var(--background-card)] border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-gradient-to-r from-[#8b5cf6]/10 to-transparent flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Vote className="w-4 h-4 text-[#8b5cf6]" />
          Опрос
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            aria-label="Предыдущий опрос"
          >
            <ChevronLeft className="w-4 h-4 text-white/40 hover:text-white/70" />
          </button>
          <span className="text-[10px] text-white/30 tabular-nums min-w-[2.5rem] text-center">
            {currentIndex + 1} / {polls.length}
          </span>
          <button
            onClick={next}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            aria-label="Следующий опрос"
          >
            <ChevronRight className="w-4 h-4 text-white/40 hover:text-white/70" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-white/90 font-medium mb-3">{poll.title}</p>

        {/* Results */}
        <div className="space-y-2.5">
          {poll.options.map((opt, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/70">{opt.text}</span>
                <span className="text-xs text-white/50 tabular-nums ml-2 shrink-0">
                  {opt.percent}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${opt.percent}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/25 tabular-nums">{opt.votes.toLocaleString("ru-RU")}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
          <span className="text-[11px] text-white/40 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            {poll.total.toLocaleString("ru-RU")} голосов
          </span>
        </div>

        <p className="text-[10px] text-white/25 mt-2 text-center">
          Статистика с оригинального сайта Hentasis
        </p>
      </div>
    </div>
  );
}
