import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SovaHent — Смотреть онлайн",
  description: "Красивый каталог аниме с удобным поиском, фильтрами и онлайн просмотром.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased gradient-bg`}
      >
        <Header />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <footer className="border-t border-[var(--border)] py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[var(--foreground-muted)]">
            <p>SovaHent &copy; {new Date().getFullYear()} — Все материалы взяты из открытых источников</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
