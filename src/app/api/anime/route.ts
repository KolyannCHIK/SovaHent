import { NextRequest, NextResponse } from "next/server";
import { fetchMainPage, fetchByTag, fetchByGenre, fetchCategory, searchAnime } from "@/lib/scraper";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const tag = searchParams.get("tag");
  const genre = searchParams.get("genre");
  const category = searchParams.get("category");
  const query = searchParams.get("q");

  try {
    if (query) {
      const items = await searchAnime(query);
      return NextResponse.json({ items, totalPages: 1 });
    }

    if (tag) {
      const data = await fetchByTag(tag, page);
      return NextResponse.json(data);
    }

    if (genre) {
      const data = await fetchByGenre(genre, page);
      return NextResponse.json(data);
    }

    if (category) {
      const data = await fetchCategory(category, page);
      return NextResponse.json(data);
    }

    const data = await fetchMainPage(page);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
