import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const targetParam = req.nextUrl.searchParams.get("url");
  const fileNameParam = req.nextUrl.searchParams.get("filename");
  const fabricUrlParam = req.nextUrl.searchParams.get("fabricUrl");

  if (!targetParam) {
    return NextResponse.json({ error: "Missing url query parameter" }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(targetParam);
  } catch {
    return NextResponse.json({ error: "Invalid url query parameter" }, { status: 400 });
  }

  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Only http/https URLs are supported" }, { status: 400 });
  }

  if (fabricUrlParam) {
    let fabricUrl: URL;
    try {
      fabricUrl = new URL(fabricUrlParam);
    } catch {
      return NextResponse.json({ error: "Invalid fabricUrl query parameter" }, { status: 400 });
    }

    if (targetUrl.host !== fabricUrl.host) {
      return NextResponse.json({ error: "URL host is not allowed" }, { status: 403 });
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl.toString(), { cache: "no-store" });
  } catch {
    return NextResponse.json({ error: "Failed to fetch requested file" }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `Upstream responded with status ${upstream.status}` },
      { status: 502 }
    );
  }

  const safeName = sanitizeFileName(fileNameParam || deriveNameFromPath(targetUrl.pathname));
  const contentType = upstream.headers.get("content-type") ?? "model/gltf-binary";

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${safeName}"`,
      "cache-control": "no-store",
    },
  });
}

function deriveNameFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] || "plant.glb";
}

function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);

  if (!cleaned) {
    return "plant.glb";
  }

  return cleaned.toLowerCase().endsWith(".glb") ? cleaned : `${cleaned}.glb`;
}
