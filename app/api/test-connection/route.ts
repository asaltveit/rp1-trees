import { NextRequest, NextResponse } from "next/server";
import type { ManifoldConfig } from "@/lib/types";
import { openScene } from "@/lib/manifold-client";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let payload: { manifoldConfig?: ManifoldConfig; fabricUrl?: string; adminKey?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const manifoldConfig: ManifoldConfig = payload.manifoldConfig ?? {
    fabricUrl: payload.fabricUrl ?? "",
    adminKey: payload.adminKey ?? "",
    scpHost: "",
    scpUser: "",
    scpPassword: "",
    scpRemotePath: "",
    resourceUrlPrefix: "",
    sceneName: "",
  };

  const fabricUrl = manifoldConfig.fabricUrl?.trim();
  const sceneName = manifoldConfig.sceneName?.trim();

  if (!fabricUrl) {
    return NextResponse.json({ ok: false, error: "fabricUrl required" }, { status: 400 });
  }
  if (!sceneName) {
    return NextResponse.json({ ok: false, error: "sceneName required" }, { status: 400 });
  }

  try {
    // Validate Fabric URL + admin key + scene lookup using the same path as generation.
    await openScene(manifoldConfig);
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: `Fabric/scene check failed: ${(err as Error).message}`,
    });
  }

  try {
    // Validate SFTP upload configuration that generation depends on.
    if (!manifoldConfig.scpHost?.trim()) {
      throw new Error("SFTP host required");
    }
    if (!manifoldConfig.scpUser?.trim()) {
      throw new Error("SFTP user required");
    }
    if (!manifoldConfig.scpPassword?.trim()) {
      throw new Error("SFTP password required");
    }
    if (!manifoldConfig.scpRemotePath?.trim()) {
      throw new Error("SFTP remote path required");
    }
    if (!manifoldConfig.resourceUrlPrefix?.trim()) {
      throw new Error("Public URL prefix required");
    }

    const SftpClient = (await import("ssh2-sftp-client")).default;
    const sftp = new SftpClient();
    try {
      await sftp.connect({
        host: manifoldConfig.scpHost,
        username: manifoldConfig.scpUser,
        password: manifoldConfig.scpPassword,
        readyTimeout: 20000,
        timeout: 30000,
      });

      let remotePath = manifoldConfig.scpRemotePath;
      if (remotePath.startsWith("~/")) {
        const cwd = await sftp.cwd();
        remotePath = remotePath.replace("~", cwd);
      }

      const pathExists = await sftp.exists(remotePath);
      if (!pathExists) {
        throw new Error(`SFTP remote path does not exist: ${remotePath}`);
      }
    } finally {
      await sftp.end();
    }
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: `SFTP check failed: ${(err as Error).message}`,
    });
  }

  return NextResponse.json({ ok: true });
}
