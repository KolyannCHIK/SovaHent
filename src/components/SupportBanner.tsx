"use client";

import { useState } from "react";
import { Heart, ChevronDown, ChevronUp, ExternalLink, Copy, Check } from "lucide-react";

const CRYPTO_WALLETS = [
  { name: "BTC (Bitcoin)", address: "bc1qxxprv3swal73uh75rmv4adj97dwaafzhddq5a7" },
  { name: "BCH (Bitcoincash)", address: "qplnfcsqsd60am3cw77esf8l2v860k9wsqkluh9wal" },
  { name: "ETH (Ethereum)", address: "0xfb890b03781aad87c756e0d4d3658bb44760cb8b" },
  { name: "TRX (Tron)", address: "TRWoizfMTMqAfKbCSBmyHKvgdczhd62yHF" },
  { name: "USDT TRC-20", address: "TRWoizfMTMqAfKbCSBmyHKvgdczhd62yHF" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/10 transition-colors shrink-0"
      aria-label="Скопировать"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-white/40 hover:text-white/70" />
      )}
    </button>
  );
}

export default function SupportBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative mx-auto max-w-7xl px-4 mt-4">
      {/* Main button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full relative overflow-hidden rounded-xl border border-[#ef4444]/30 bg-gradient-to-r from-[#ef4444]/15 via-[#ef4444]/10 to-[#f97316]/10 backdrop-blur-sm hover:from-[#ef4444]/20 hover:via-[#ef4444]/15 hover:to-[#f97316]/15 transition-all duration-300 group"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#ef4444] to-[#f97316]" />

        <div className="flex items-center gap-3 px-5 py-4">
          <div className="relative">
            <Heart className="w-6 h-6 text-[#ef4444] shrink-0 group-hover:scale-110 transition-transform" />
            <Heart className="w-6 h-6 text-[#ef4444] shrink-0 absolute inset-0 animate-ping opacity-30" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm text-white/90 font-semibold leading-relaxed">
              Оригинальный проект <span className="text-[#ef4444]">Hentasis</span> в упадке и нуждается в вашей поддержке!
            </p>
            <p className="text-xs text-white/50 mt-0.5">
              Нажмите, чтобы узнать как помочь автору оригинального сайта
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-white/40 shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/40 shrink-0 animate-bounce" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden animate-fadeIn">
          <div className="p-5 space-y-5">
            {/* Video appeal */}
            <div className="rounded-lg bg-[var(--background-secondary)] p-4">
              <p className="text-sm text-white/80 leading-relaxed mb-3">
                Автор оригинального сайта <span className="font-semibold text-white">Lunar</span> записал видеообращение
                к зрителям. Сайт существует благодаря пожертвованиям — без поддержки он может закрыться.
              </p>
              <a
                href="http://hentasis1.top/862-help.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#ef4444] text-sm font-medium hover:bg-[#ef4444]/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Смотреть видеообращение Lunar
              </a>
            </div>

            {/* Payment methods */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Boosty */}
              <a
                href="https://boosty.to/hentasis"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-[#f97316]/10 to-transparent border border-[#f97316]/20 hover:border-[#f97316]/40 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#f97316]/20 flex items-center justify-center text-lg font-bold text-[#f97316]">
                  B
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Boosty</p>
                  <p className="text-xs text-white/50">boosty.to/hentasis</p>
                </div>
                <ExternalLink className="w-4 h-4 text-white/30 ml-auto group-hover:text-white/60 transition-colors" />
              </a>

              {/* YooMoney */}
              <a
                href="https://yoomoney.ru/to/41001281281985"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-[#8b5cf6]/10 to-transparent border border-[#8b5cf6]/20 hover:border-[#8b5cf6]/40 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/20 flex items-center justify-center text-lg font-bold text-[#8b5cf6]">
                  Ю
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">ЮMoney</p>
                  <p className="text-xs text-white/50">Кошелёк 41001281281985</p>
                </div>
                <ExternalLink className="w-4 h-4 text-white/30 ml-auto group-hover:text-white/60 transition-colors" />
              </a>
            </div>

            {/* Email */}
            <div className="rounded-lg bg-[var(--background-secondary)] p-3 flex items-center gap-3">
              <span className="text-xs text-white/50">После оплаты напишите на</span>
              <code className="text-xs text-[#f97316] bg-[#f97316]/10 px-2 py-0.5 rounded">donat.lunar@gmail.com</code>
              <CopyButton text="donat.lunar@gmail.com" />
              <span className="text-xs text-white/40">— сумму и последние 4 цифры карты</span>
            </div>

            {/* Crypto */}
            <div>
              <p className="text-xs text-white/50 font-medium uppercase tracking-wider mb-2">Криптовалюта</p>
              <div className="space-y-2">
                {CRYPTO_WALLETS.map((wallet) => (
                  <div
                    key={wallet.name}
                    className="flex items-center gap-2 rounded-lg bg-[var(--background-secondary)] px-3 py-2"
                  >
                    <span className="text-xs text-white/60 font-medium shrink-0 w-24">{wallet.name}</span>
                    <code className="text-[11px] text-white/40 truncate flex-1">{wallet.address}</code>
                    <CopyButton text={wallet.address} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
