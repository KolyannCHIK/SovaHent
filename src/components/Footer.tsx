import { ExternalLink, Mail, Send, Shield, Scale, MessageCircle } from "lucide-react";

const FOOTER_LINKS = [
  {
    title: "Правила сайта",
    icon: Shield,
    href: "http://hentasis1.top/pravila.html",
    description: "Заходя на сайт, вы подтверждаете что вам исполнилось 18 лет",
  },
  {
    title: "Правообладателям",
    icon: Scale,
    href: "http://hentasis1.top/copyrite.html",
    description: "Информация для правообладателей контента",
  },
  {
    title: "Контакты",
    icon: Mail,
    href: "http://hentasis1.top/kontakti.html",
    description: "lunar71@yandex.ru",
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Original site info */}
        <div className="py-8 border-b border-[var(--border)]">
          <p className="text-xs text-white/30 uppercase tracking-wider font-medium mb-5 text-center">
            Информация с оригинального сайта Hentasis
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.title}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 p-4 rounded-xl bg-[var(--background-card)] border border-[var(--border)] hover:border-white/15 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                  <link.icon className="w-4 h-4 text-white/40 group-hover:text-white/60 transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors flex items-center gap-1.5">
                    {link.title}
                    <ExternalLink className="w-3 h-3 text-white/20" />
                  </p>
                  <p className="text-xs text-white/35 mt-0.5 truncate">{link.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Social links */}
        <div className="py-6 border-b border-[var(--border)] flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://t.me/+kRYdQ-7b6mQ2ZGFi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2AABEE]/10 border border-[#2AABEE]/20 text-[#2AABEE] text-sm hover:bg-[#2AABEE]/20 transition-colors"
          >
            <Send className="w-4 h-4" />
            Телеграм Hentasis
          </a>
          <a
            href="http://hentasis1.top/donat.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-sm hover:bg-[#ef4444]/20 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Поддержать сайт
          </a>
          <a
            href="http://hentasis1.top/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Оригинальный сайт
          </a>
        </div>

        {/* Copyright */}
        <div className="py-6 text-center space-y-2">
          <p className="text-sm text-[var(--foreground-muted)]">
            <span className="font-semibold text-white/60">SovaHent</span> &copy; {new Date().getFullYear()}
          </p>
          <p className="text-xs text-white/25 max-w-lg mx-auto leading-relaxed">
            Неофициальное зеркало. Все материалы принадлежат их правообладателям.
            Проект не хранит и не распространяет контент.
          </p>
        </div>
      </div>
    </footer>
  );
}
