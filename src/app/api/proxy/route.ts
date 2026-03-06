import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "http://hentasis1.top/",
    };

    // Forward range header for audio/video streaming
    const range = request.headers.get("range");
    if (range) {
      headers["Range"] = range;
    }

    const res = await fetch(url, { headers });

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const contentLength = res.headers.get("content-length");
    const contentRange = res.headers.get("content-range");
    const acceptRanges = res.headers.get("accept-ranges");

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    };

    if (contentLength) responseHeaders["Content-Length"] = contentLength;
    if (contentRange) responseHeaders["Content-Range"] = contentRange;
    if (acceptRanges) responseHeaders["Accept-Ranges"] = acceptRanges;
    // Always advertise range support
    if (!acceptRanges) responseHeaders["Accept-Ranges"] = "bytes";

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: res.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({ error: "Failed to proxy" }, { status: 500 });
  }
}
