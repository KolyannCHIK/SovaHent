"use client";

import { useSyncExternalStore, useCallback } from "react";
import { X, AlertTriangle, ExternalLink } from "lucide-react";

const STORAGE_KEY = "sovahent-banner-dismissed";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot() {
  return "1"; // hidden on SSR
}

export default function MirrorBanner() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const dismissed = !!raw;

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    window.dispatchEvent(new Event("storage"));
  }, []);

  if (dismissed) return null;

  return (
    <div className="relative mx-auto max-w-7xl px-4 mt-6 animate-fadeIn">
      <div className="relative overflow-hidden rounded-xl border border-[#f59e0b]/30 bg-gradient-to-r from-[#f59e0b]/10 via-[#f59e0b]/5 to-transparent backdrop-blur-sm">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#f59e0b] to-[#f59e0b]/30" />

        <div className="flex items-start gap-3 px-5 py-4 pr-12">
          <AlertTriangle className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/90 font-medium leading-relaxed">
              Данный сайт является <span className="text-[#f59e0b] font-semibold">неофициальным зеркалом</span> и автоматически
              парсит контент с оригинального ресурса. Мы не храним медиафайлы и не являемся правообладателями.
            </p>
            <a
              href="http://hentasis1.top/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#f59e0b]/80 hover:text-[#f59e0b] font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Перейти на оригинальный сайт
            </a>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
