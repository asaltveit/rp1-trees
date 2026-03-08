/**
 * Frontend fetch wrappers for the plant generation API.
 */

import type { GenerateRequest, GenerateResponse } from "./types";

export async function generatePlants(
  request: GenerateRequest,
  signal?: AbortSignal
): Promise<GenerateResponse> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function testConnection(
  fabricUrl: string,
  adminKey: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/test-connection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fabricUrl, adminKey }),
  });
  return res.json();
}
