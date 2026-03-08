/**
 * Minimal Manifold Fabric client for the plant generator.
 *
 * Uses:
 *  - ssh2-sftp-client for GLB file uploads via SFTP
 *  - ManifolderClient (vendored) for scene object placement
 */

import path from "path";
import { type ManifoldConfig } from "./types";

// ─── SFTP Upload ────────────────────────────────────────────────────────────

/**
 * Upload a GLB buffer to the Fabric server via SFTP.
 * Returns the public resource URL.
 */
export async function uploadGlb(
  glbBuffer: Buffer,
  targetName: string,
  config: ManifoldConfig
): Promise<string> {
  // Dynamic import — ssh2-sftp-client is a CommonJS module
  const SftpClient = (await import("ssh2-sftp-client")).default;
  const sftp = new SftpClient();

  try {
    await sftp.connect({
      host: config.scpHost,
      username: config.scpUser,
      password: config.scpPassword,
      readyTimeout: 20000,
      timeout: 30000,
    });

    let remotePath = config.scpRemotePath;
    if (remotePath.startsWith("~/")) {
      const cwd = await sftp.cwd();
      remotePath = remotePath.replace("~", cwd);
    }

    const remoteFilePath = path.posix.join(remotePath, targetName);
    await sftp.put(glbBuffer, remoteFilePath);

    const prefix = config.resourceUrlPrefix.endsWith("/")
      ? config.resourceUrlPrefix
      : config.resourceUrlPrefix + "/";

    return prefix + targetName;
  } finally {
    await sftp.end();
  }
}

// ─── Scene Operations ───────────────────────────────────────────────────────

interface SceneRef {
  scopeId: string;
  rootObjectId: string;
}

/**
 * Open a Manifold scene by name and return its scope + root object IDs.
 */
export async function openScene(
  config: ManifoldConfig
): Promise<SceneRef> {
  const client = await _makeClient(config);

  try {
    // List scenes to find the target
    const scenes = await client.listScenes({ scopeId: _scopeId(config) }) as any[];

    const scene = scenes.find(
      (s: any) => s.name === config.sceneName || s.id === config.sceneName
    );

    if (!scene) {
      throw new Error(
        `Scene "${config.sceneName}" not found. Available: ${scenes.map((s: any) => s.name).join(", ")}`
      );
    }

    // Open the scene to get root object
    const opened = await client.openScene({
      scopeId: _scopeId(config),
      sceneId: scene.id,
    }) as any;

    return {
      scopeId: _scopeId(config),
      rootObjectId: opened.rootObjectId ?? opened.id ?? "root",
    };
  } finally {
    await client.disconnect?.();
  }
}

/**
 * Create a 3D object in the Manifold scene at position (x, 0, z).
 * Returns the new object's ID.
 */
export async function createObject(
  resourceUrl: string,
  name: string,
  position: { x: number; z: number },
  rootObjectId: string,
  config: ManifoldConfig
): Promise<string> {
  const client = await _makeClient(config);

  try {
    const obj = await client.createObject({
      scopeId: _scopeId(config),
      parentId: rootObjectId,
      name,
      position: { x: position.x, y: 0, z: position.z },
      resourceReference: resourceUrl,
      objectType: "physical:default",
    }) as any;

    return obj.id ?? obj.objectId ?? name;
  } finally {
    await client.disconnect?.();
  }
}

// ─── Internal helpers ───────────────────────────────────────────────────────

function _scopeId(config: ManifoldConfig): string {
  // The scopeId is derived from the fabric URL in Manifold's protocol
  return config.fabricUrl;
}

async function _makeClient(config: ManifoldConfig) {
  // Dynamically import the vendored ManifolderClient
  // This avoids bundling issues and works in Next.js serverless
  const { createManifolderPromiseClient, normalizeUrl } = await import(
    /* webpackIgnore: true */
    "../lib/ManifolderClient/ManifolderClient.js" as string
  );

  const url = normalizeUrl(config.fabricUrl);
  const client = await createManifolderPromiseClient(url, {
    adminKey: config.adminKey,
  });

  return client;
}
