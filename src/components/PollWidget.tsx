"use client";

import { useState, useSyncExternalStore } from "react";
import { BarChart3, Vote } from "lucide-react";

interface PollOption {
  id: number;
  text: string;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
}

const POLLS: Poll[] = [
  {
    id: "watch-preference",
    question: "Как вы любите смотреть хентай?",
    options: [
      { id: 0, text: "Только с озвучкой" },
      { id: 1, text: "Только с субтитрами" },
      { id: 2, text: "Могу смотреть и так и так" },
      { id: 3, text: "Смотрю в оригинале" },
    ],
  },
  {
    id: "site-rating",
    question: "Как вам новый дизайн SovaHent?",
    options: [
      { id: 0, text: "Отлично" },
      { id: 1, text: "Хорошо" },
      { id: 2, text: "Нормально" },
      { id: 3, text: "Плохо" },
    ],
  },
];

const COLORS = ["#8b5cf6", "#ef4444", "#3b82f6", "#f97316", "#10b981"];

function getStorageKey(pollId: string) {
  return `sovahent_poll_${pollId}`;
}

function getVotesKey(pollId: string) {
  return `sovahent_poll_votes_${pollId}`;
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function getSnapshot(key: string) {
  return () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  };
}

function getServerSnapshot() {
  return null;
}

function initVotes(pollId: string, optionCount: number): number[] {
  if (typeof window === "undefined") return new Array(optionCount).fill(0);
  const raw = localStorage.getItem(getVotesKey(pollId));
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  // Seed with some initial votes to look alive
  const seeded = [42, 28, 63, 12].slice(0, optionCount);
  localStorage.setItem(getVotesKey(pollId), JSON.stringify(seeded));
  return seeded;
}

function PollCard({ poll }: { poll: Poll }) {
  const storageKey = getStorageKey(poll.id);
  const votedRaw = useSyncExternalStore(subscribe, getSnapshot(storageKey), getServerSnapshot);
  const voted = votedRaw !== null ? parseInt(votedRaw, 10) : null;

  const [selected, setSelected] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(voted !== null);
  const [votes, setVotes] = useState<number[]>(() => initVotes(poll.id, poll.options.length));

  const totalVotes = votes.reduce((a, b) => a + b, 0);

  const handleVote = () => {
    if (selected === null || voted !== null) return;
    const newVotes = [...votes];
    newVotes[selected] += 1;
    setVotes(newVotes);
    localStorage.setItem(storageKey, String(selected));
    localStorage.setItem(getVotesKey(poll.id), JSON.stringify(newVotes));
    setShowResults(true);
    // Trigger storage event for useSyncExternalStore
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="rounded-xl bg-[var(--background-card)] border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-gradient-to-r from-[#8b5cf6]/10 to-transparent">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Vote className="w-4 h-4 text-[#8b5cf6]" />
          Опрос
        </h3>
      </div>

      <div className="p-4">
        <p className="text-sm text-white/90 font-medium mb-3">{poll.question}</p>

        {!showResults ? (
          <>
            <div className="space-y-2">
              {poll.options.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all border w-full text-left ${
                    selected === opt.id
                      ? "border-[#8b5cf6]/50 bg-[#8b5cf6]/10"
                      : "border-transparent bg-[var(--background-secondary)] hover:bg-[var(--background-secondary)]/80"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selected === opt.id
                        ? "border-[#8b5cf6] bg-[#8b5cf6]"
                        : "border-white/30"
                    }`}
                  >
                    {selected === opt.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-xs text-white/80">{opt.text}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleVote}
                disabled={selected === null}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all bg-[#8b5cf6] text-white hover:bg-[#7c3aed] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Голосовать
              </button>
              <button
                onClick={() => setShowResults(true)}
                className="px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
              >
                Результаты
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2.5">
              {poll.options.map((opt, i) => {
                const count = votes[i] || 0;
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const isVoted = voted === opt.id;
                return (
                  <div key={opt.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs ${isVoted ? "text-white font-semibold" : "text-white/70"}`}>
                        {opt.text} {isVoted && "✓"}
                      </span>
                      <span className="text-xs text-white/50 tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                          opacity: isVoted ? 1 : 0.6,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] text-white/40 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                {totalVotes} голосов
              </span>
              {voted === null && (
                <button
                  onClick={() => setShowResults(false)}
                  className="text-[11px] text-[#8b5cf6] hover:text-[#7c3aed] transition-colors"
                >
                  ← Голосовать
                </button>
              )}
            </div>
          </>
        )}

        <p className="text-[10px] text-white/25 mt-3 text-center">
          Опрос с оригинального сайта Hentasis
        </p>
      </div>
    </div>
  );
}

export default function PollWidget() {
  return (
    <div className="space-y-4">
      {POLLS.map((poll) => (
        <PollCard key={poll.id} poll={poll} />
      ))}
    </div>
  );
}
