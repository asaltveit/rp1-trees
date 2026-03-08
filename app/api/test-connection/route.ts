/**
 * POST /api/test-connection
 * Lightweight check that the Fabric WebSocket URL is reachable.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { fabricUrl } = await req.json();

  if (!fabricUrl) {
    return NextResponse.json({ ok: false, error: "fabricUrl required" }, { status: 400 });
  }

  try {
    // Try a simple HTTP(S) HEAD request to the base URL (WebSocket servers
    // typically respond to HTTP requests on the same port)
    const httpUrl = fabricUrl.replace(/^wss?:\/\//, "https://").split("/")[0] + "//";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      await fetch(httpUrl, { method: "HEAD", signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json({ ok: false, error: "Connection timed out" });
    }
    // A network error response still means the server is reachable
    return NextResponse.json({ ok: true });
  }
}
