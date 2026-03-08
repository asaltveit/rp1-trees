/**
 * POST /api/generate
 *
 * Orchestrates the full pipeline:
 * 1. Call Python serverless to generate GLB(s)
 * 2. Upload each GLB via SFTP to the Fabric server
 * 3. Place each object in the Manifold scene
 * 4. Return results
 */

import { NextRequest, NextResponse } from "next/server";
import type {
  GenerateRequest,
  GenerateResponse,
  PlantResult,
  PlacedPlant,
  PythonGenerateResponse,
} from "@/lib/types";
import { uploadGlb, openScene, createObject } from "@/lib/manifold-client";

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel Pro — 5 minutes max

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { mode, description, theme, seed, baseX, baseZ, manifoldConfig } = body;

  if (!manifoldConfig?.fabricUrl) {
    return NextResponse.json({ error: "manifoldConfig.fabricUrl is required" }, { status: 400 });
  }

  // Step 1: Generate GLB(s) via Python serverless
  const pythonUrl =
    mode === "biome"
      ? `${_baseUrl(req)}/api/py/biome`
      : `${_baseUrl(req)}/api/py/generate`;

  let pythonData: PythonGenerateResponse;
  try {
    const pythonRes = await fetch(pythonUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: description ?? "a medium oak tree",
        theme: theme ?? "temperate forest",
        seed: seed ?? Math.floor(Math.random() * 100_000),
      }),
    });

    pythonData = await pythonRes.json();

    if (!pythonRes.ok || pythonData.error) {
      throw new Error(pythonData.error ?? `Python generation failed: ${pythonRes.status}`);
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Plant generation failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  // Step 2 + 3: Upload & place each plant
  const results: PlacedPlant[] = [];
  let sceneRef: { scopeId: string; rootObjectId: string } | null = null;

  for (const plant of pythonData.plants) {
    const x = baseX + (plant.x_offset ?? 0);
    const z = baseZ + (plant.z_offset ?? 0);

    // Guard: Python function returned an error for this plant
    if (!plant.glb_b64) {
      results.push({
        objectId: "",
        resourceUrl: "",
        plant_name: plant.plant_name ?? "Unknown",
        species_id: plant.species_id ?? "unknown",
        x,
        z,
        status: "error",
        errorMessage: (plant as any).error ?? "Plant generation returned no data",
      });
      continue;
    }

    try {
      // Upload GLB
      const glbBuffer = Buffer.from(plant.glb_b64, "base64");
      const fileName = `${_slugify(plant.plant_name)}_${Date.now()}.glb`;
      const resourceUrl = await uploadGlb(glbBuffer, fileName, manifoldConfig);

      // Open scene (cached per request)
      if (!sceneRef) {
        sceneRef = await openScene(manifoldConfig);
      }

      // Place object
      const objectId = await createObject(
        resourceUrl,
        plant.plant_name,
        { x, z },
        sceneRef.rootObjectId,
        manifoldConfig
      );

      results.push({
        objectId,
        resourceUrl,
        plant_name: plant.plant_name,
        species_id: plant.species_id,
        x,
        z,
        status: "placed",
        glb_size_kb: plant.glb_size_kb,
      });
    } catch (err) {
      results.push({
        objectId: "",
        resourceUrl: "",
        plant_name: plant.plant_name,
        species_id: plant.species_id,
        x,
        z,
        status: "error",
        errorMessage: (err as Error).message,
      });
    }
  }

  const response: GenerateResponse = { results };
  return NextResponse.json(response);
}

function _baseUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

function _slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40);
}
