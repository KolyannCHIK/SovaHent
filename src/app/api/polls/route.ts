import { NextRequest, NextResponse } from "next/server";

const HENTASIS_URL = "http://hentasis1.top/engine/ajax/controller.php?mod=vote";
const VALID_POLL_IDS = [2, 3, 4, 6, 7, 8, 9];

interface PollResult {
  id: number;
  title: string;
  options: { text: string; votes: number; percent: number }[];
  total: number;
}

export async function GET(req: NextRequest) {
  const pollId = req.nextUrl.searchParams.get("id");

  if (!pollId || !VALID_POLL_IDS.includes(Number(pollId))) {
    // Return list of all polls
    const polls: PollResult[] = [];
    for (const id of VALID_POLL_IDS) {
      const poll = await fetchPollResults(id);
      if (poll) polls.push(poll);
    }
    return NextResponse.json(polls, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  }

  const poll = await fetchPollResults(Number(pollId));
  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }
  return NextResponse.json(poll, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
  });
}

async function fetchPollResults(id: number): Promise<PollResult | null> {
  try {
    const res = await fetch(HENTASIS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "http://hentasis1.top/",
      },
      body: `vote_id=${id}&vote_action=results&vote_skin=flavor`,
    });

    const html = await res.text();

    const titleMatch = html.match(/vote-title">([\s\S]*?)<\/div>/);
    if (!titleMatch || !titleMatch[1].trim()) return null;

    const title = titleMatch[1].trim();

    const optionMatches = [...html.matchAll(/<div class="vote">(.*?) - (\d+) \(([\d.]+)%\)<\/div>/g)];
    if (optionMatches.length === 0) return null;

    const options = optionMatches.map((m) => ({
      text: m[1],
      votes: parseInt(m[2], 10),
      percent: parseFloat(m[3]),
    }));

    const totalMatch = html.match(/проголосовало: (\d+)/);
    const total = totalMatch ? parseInt(totalMatch[1], 10) : options.reduce((a, o) => a + o.votes, 0);

    return { id, title, options, total };
  } catch {
    return null;
  }
}
