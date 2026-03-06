import * as cheerio from "cheerio";

const BASE_URL = "http://hentasis1.top";

export interface AnimeCard {
  id: string;
  slug: string;
  title: string;
  titleRu: string;
  url: string;
  image: string;
  year: string;
  genres: string[];
  episodes: string;
  duration: string;
  censorship: string;
  rusVoice: boolean;
  rusSub: boolean;
  studio: string;
  rating: string;
  description: string;
}

export interface PlayerFile {
  url: string;
  title: string;
  type: "video" | "audio";
}

export interface AnimeDetail extends AnimeCard {
  changes: string;
  note: string;
  playerHtml: string;
  files: PlayerFile[];
  comments: CommentItem[];
}

export interface CommentItem {
  author: string;
  authorUrl: string;
  text: string;
  date: string;
  replyTo?: string;
  replyText?: string;
}

function resolveImage(src: string): string {
  if (!src) return "";
  return src.startsWith("http") ? src : `${BASE_URL}${src}`;
}

function extractMetaField(text: string, field: string): string {
  const re = new RegExp(field + ":\\s*([^\\n]+)", "i");
  const m = text.match(re);
  return m?.[1]?.trim() || "";
}

function parseShortItem($: ReturnType<typeof cheerio.load>, el: cheerio.Element): AnimeCard | null {
  const $el = $(el);
  const linkEl = $el.find("h3 a.short-link, h3 a").first();
  if (!linkEl.length) return null;

  const href = linkEl.attr("href") || "";
  const match = href.match(/\/(\d+)-(.+)\.html/);
  if (!match) return null;

  const id = match[1];
  const slug = match[2];
  const titleRu = linkEl.text().trim();

  const img = $el.find(".short-img img").first();
  const image = resolveImage(img.attr("src") || img.attr("data-src") || "");

  const infoText = $el.find(".mov-lines").text();

  const categories = $el.find(".short-bottom a").map((_, a) => $(a).text().trim()).get();
  const hasVoice = categories.some((c: string) => c.includes("озвучка"));
  const hasSub = categories.some((c: string) => c.includes("убтитры"));

  return {
    id,
    slug,
    title: titleRu.replace(/\s*\(\d{4}.*?\)\s*$/, "").trim(),
    titleRu,
    url: href,
    image,
    year: extractMetaField(infoText, "Год выпуска"),
    genres: extractMetaField(infoText, "Жанр").split(",").map((g: string) => g.trim()).filter(Boolean),
    episodes: extractMetaField(infoText, "Эпизоды"),
    duration: extractMetaField(infoText, "Продолжительность"),
    censorship: extractMetaField(infoText, "Цензура"),
    rusVoice: hasVoice || /Русская озвучка:\s*ДА/i.test(infoText),
    rusSub: hasSub || /Русские субтитры:\s*ДА/i.test(infoText),
    studio: extractMetaField(infoText, "Студия"),
    rating: $el.find(".current-rating").text().trim(),
    description: extractMetaField(infoText, "Описание"),
  };
}

function parseCarouselItems($: ReturnType<typeof cheerio.load>): AnimeCard[] {
  const items: AnimeCard[] = [];
  const seen = new Set<string>();

  $("a.carou.img-box, a.carou").each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href") || "";
    const match = href.match(/\/(\d+)-(.+)\.html/);
    if (!match) return;

    const id = match[1];
    if (id === "862" || seen.has(id)) return;
    seen.add(id);

    const slug = match[2];
    const img = $a.find("img").first();
    const image = resolveImage(img.attr("data-src") || img.attr("src") || "");
    const titleRu = (img.attr("alt") || $a.find(".rel-title").text() || "").trim();

    items.push({
      id,
      slug,
      title: titleRu.replace(/\s*\(\d{4}.*?\)\s*$/, "").trim(),
      titleRu,
      url: href,
      image,
      year: "",
      genres: [],
      episodes: "",
      duration: "",
      censorship: "",
      rusVoice: false,
      rusSub: false,
      studio: "",
      rating: "",
      description: "",
    });
  });

  return items;
}

export async function fetchMainPage(page = 1): Promise<{
  items: AnimeCard[];
  totalPages: number;
}> {
  const url = page > 1 ? `${BASE_URL}/page/${page}/` : `${BASE_URL}/`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    next: { revalidate: 300 },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const items: AnimeCard[] = [];
  const seenIds = new Set<string>();

  // Parse .short-item cards (main listing)
  $(".short-item").each((_, el) => {
    const card = parseShortItem($, el);
    if (card && card.id !== "862" && !seenIds.has(card.id)) {
      seenIds.add(card.id);
      items.push(card);
    }
  });

  // If no short-items found, try carousel items
  if (items.length === 0) {
    const carouselItems = parseCarouselItems($);
    for (const card of carouselItems) {
      if (!seenIds.has(card.id)) {
        seenIds.add(card.id);
        items.push(card);
      }
    }
  }

  let totalPages = 1;
  $(".navigation a, .pnav a, .pages a, a.swchItem").each((_, el) => {
    const text = $(el).text().trim();
    const num = parseInt(text);
    if (!isNaN(num) && num > totalPages) totalPages = num;
  });

  return { items, totalPages };
}

export async function fetchAnimeDetail(slug: string): Promise<AnimeDetail | null> {
  const idMatch = slug.match(/^(\d+)/);
  if (!idMatch) return null;
  
  const url = `${BASE_URL}/${slug}.html`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $("h1").first().text().trim();
  const img = $(".f-mov-img img").first();
  const image = resolveImage(img.attr("src") || img.attr("data-src") || "");

  const infoText = $(".mov-lines").text();

  let playerHtml = "";
  const files: PlayerFile[] = [];

  // Extract Playerjs file list
  $("script").each((_, el) => {
    const content = $(el).html() || "";
    const playerjsMatch = content.match(/Playerjs\(\{[^}]*file:\s*\[([\s\S]*?)\]/);
    if (playerjsMatch) {
      playerHtml = content;
      const fileArrayStr = playerjsMatch[1];
      const fileRegex = /\{\s*file:\s*"([^"]*)",\s*title:\s*"([^"]*)"/g;
      let m;
      while ((m = fileRegex.exec(fileArrayStr)) !== null) {
        const fileUrl = m[1].trim();
        const fileTitle = m[2].trim();
        if (!fileUrl) continue;
        const isAudio = /\.(mp3|ogg|wav|flac|aac)$/i.test(fileUrl);
        files.push({
          url: fileUrl,
          title: fileTitle,
          type: isAudio ? "audio" : "video",
        });
      }
    }
  });

  // Fallback: iframes
  if (files.length === 0) {
    const iframes = $("iframe");
    iframes.each((_, el) => {
      const src = $(el).attr("src") || "";
      if (src) {
        playerHtml += $(el).prop("outerHTML") + "\n";
      }
    });
  }

  const comments: CommentItem[] = [];
  $(".comm-item").each((_, el) => {
    const $c = $(el);
    const author = $c.find(".comm-author a").first().text().trim() ||
                   $c.find(".comm-author").first().text().trim() || "Аноним";
    const authorUrl = $c.find(".comm-author a").first().attr("href") || "";
    const date = $c.find(".comm-date, time").first().text().trim();

    const $commBody = $c.find(".comm-body, [id^='comm-id-']").first();
    const $quote = $commBody.find(".quote_block").first();

    let replyTo: string | undefined;
    let replyText: string | undefined;

    if ($quote.length) {
      replyTo = $quote.find(".title_quote").attr("data-commentuser") || undefined;
      const $quoteClone = $quote.clone();
      $quoteClone.find(".title_quote").remove();
      replyText = $quoteClone.text().trim() || undefined;
      $quote.remove();
    }

    // Preserve line breaks: convert HTML to text with newlines
    let html = $commBody.html() || "";
    html = html.replace(/<br\s*\/?>/gi, "\n");
    html = html.replace(/<\/p>\s*<p[^>]*>/gi, "\n");
    html = html.replace(/<\/?p[^>]*>/gi, "\n");
    html = html.replace(/<[^>]+>/g, "");
    html = html.replace(/&nbsp;/gi, " ");
    html = html.replace(/&amp;/gi, "&");
    html = html.replace(/&lt;/gi, "<");
    html = html.replace(/&gt;/gi, ">");
    html = html.replace(/&quot;/gi, "\"");
    const text = html.replace(/[ \t]*\n[ \t]*/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (text) {
      comments.push({ author, authorUrl, text, date, replyTo, replyText });
    }
  });

  const match = slug.match(/^(\d+)-(.*)/);

  return {
    id: match?.[1] || "",
    slug: match?.[2] || slug,
    title: title.replace(/\s*\(\d{4}.*?\)\s*$/, "").trim(),
    titleRu: title,
    url,
    image,
    year: extractMetaField(infoText, "Год выпуска"),
    genres: extractMetaField(infoText, "Жанр").split(",").map((g: string) => g.trim()).filter(Boolean),
    episodes: extractMetaField(infoText, "Эпизоды"),
    duration: extractMetaField(infoText, "Продолжительность"),
    censorship: extractMetaField(infoText, "Цензура"),
    rusVoice: /Русская озвучка:\s*ДА/i.test(infoText),
    rusSub: /Русские субтитры:\s*ДА/i.test(infoText),
    studio: extractMetaField(infoText, "Студия"),
    rating: "",
    description: extractMetaField(infoText, "Описание"),
    changes: extractMetaField(infoText, "Изменения"),
    note: extractMetaField(infoText, "Примечание"),
    playerHtml,
    files,
    comments,
  };
}

export async function fetchByTag(tag: string, page = 1): Promise<{
  items: AnimeCard[];
  totalPages: number;
}> {
  const url = page > 1 ? `${BASE_URL}/tags/${tag}/page/${page}/` : `${BASE_URL}/tags/${tag}/`;
  return fetchListPage(url);
}

export async function fetchByGenre(genre: string, page = 1): Promise<{
  items: AnimeCard[];
  totalPages: number;
}> {
  const url = page > 1
    ? `${BASE_URL}/xfsearch/${genre}/page/${page}/`
    : `${BASE_URL}/xfsearch/${genre}/`;
  return fetchListPage(url);
}

export async function fetchCategory(category: string, page = 1): Promise<{
  items: AnimeCard[];
  totalPages: number;
}> {
  const url = page > 1
    ? `${BASE_URL}/${category}/page/${page}/`
    : `${BASE_URL}/${category}/`;
  return fetchListPage(url);
}

export async function searchAnime(query: string): Promise<AnimeCard[]> {
  const formData = new URLSearchParams();
  formData.append("do", "search");
  formData.append("subaction", "search");
  formData.append("story", query);

  const res = await fetch(`${BASE_URL}/index.php?do=search`, {
    method: "POST",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  const items: AnimeCard[] = [];
  const seen = new Set<string>();

  $(".short-item").each((_, el) => {
    const card = parseShortItem($, el);
    if (card && card.id !== "862" && !seen.has(card.id)) {
      seen.add(card.id);
      items.push(card);
    }
  });

  // Fallback: carousel items
  if (items.length === 0) {
    for (const card of parseCarouselItems($)) {
      if (!seen.has(card.id)) {
        seen.add(card.id);
        items.push(card);
      }
    }
  }

  return items;
}

async function fetchListPage(url: string): Promise<{
  items: AnimeCard[];
  totalPages: number;
}> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    next: { revalidate: 300 },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const items: AnimeCard[] = [];
  const seen = new Set<string>();

  $(".short-item").each((_, el) => {
    const card = parseShortItem($, el);
    if (card && card.id !== "862" && !seen.has(card.id)) {
      seen.add(card.id);
      items.push(card);
    }
  });

  if (items.length === 0) {
    for (const card of parseCarouselItems($)) {
      if (!seen.has(card.id)) {
        seen.add(card.id);
        items.push(card);
      }
    }
  }

  let totalPages = 1;
  $(".navigation a, .pnav a, .pages a, a.swchItem").each((_, el) => {
    const text = $(el).text().trim();
    const num = parseInt(text);
    if (!isNaN(num) && num > totalPages) totalPages = num;
  });

  return { items, totalPages };
}

export async function fetchPageHtml(path: string): Promise<string> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  return res.text();
}

export const GENRES = [
  { name: "Анал", slug: "Anal" },
  { name: "БДСМ", slug: "BDSM" },
  { name: "Большие сиськи", slug: "Big" },
  { name: "Бондаж", slug: "bondage" },
  { name: "Вибраторы", slug: "Vibrators" },
  { name: "Гарем", slug: "Harem" },
  { name: "Групповуха", slug: "Group" },
  { name: "Девственницы", slug: "Virgin" },
  { name: "Демоны", slug: "Demons" },
  { name: "Домохозяйки", slug: "Housewives" },
  { name: "Драма", slug: "Drama" },
  { name: "Инцест", slug: "Incest" },
  { name: "Комедия", slug: "Comedy" },
  { name: "Магия", slug: "Magic" },
  { name: "Маленькие сиськи", slug: "small" },
  { name: "Медсестры", slug: "Nurse" },
  { name: "Минет", slug: "Oral" },
  { name: "Мистика", slug: "Mystic" },
  { name: "Монстры", slug: "Monster" },
  { name: "Нетораре", slug: "Netorare" },
  { name: "Пайзури", slug: "paizuri" },
  { name: "Романтика", slug: "Romance" },
  { name: "Скай Фай", slug: "Sci-Fi" },
  { name: "Служанки", slug: "Maid" },
  { name: "Старлайт", slug: "Straight" },
  { name: "Сукубы", slug: "Succubus" },
  { name: "Ужасы", slug: "Horror" },
  { name: "Фэнтези", slug: "Fantasy" },
  { name: "Щупальцы", slug: "Tentacles" },
];

export const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];

export const CATEGORIES = [
  { name: "Новинки", slug: "" },
  { name: "Русская озвучка", slug: "ozvuchka" },
  { name: "Русские субтитры", slug: "rus-sub" },
  { name: "Без цензуры", slug: "uncensored" },
];
