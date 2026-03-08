// Shared TypeScript interfaces for the plant generation API

export interface ManifoldConfig {
  fabricUrl: string;         // wss://... Manifold Fabric WebSocket URL
  adminKey: string;          // Auth key for scope
  scpHost: string;           // SFTP hostname
  scpUser: string;           // SSH username
  scpPassword: string;       // SSH password
  scpRemotePath: string;     // Remote base path, e.g. "/var/www/resources"
  resourceUrlPrefix: string; // Public HTTP base, e.g. "https://fabric.example.com/resources/"
  sceneName: string;         // Target scene name
}

export interface GenerateRequest {
  mode: "single" | "biome";
  outputMode?: "manifold" | "download";
  description?: string;       // for single mode
  theme?: string;             // for biome mode
  seed?: number;
  baseX: number;              // world X coordinate for placement
  baseZ: number;              // world Z coordinate for placement
  manifoldConfig: ManifoldConfig;
}

export interface PlantResult {
  glb_b64: string;            // base64 encoded GLB bytes
  species_id: string;
  plant_name: string;
  height_m: number;
  branch_count: number;
  leaf_count: number;
  parse_method: string;
  glb_size_kb: number;
  x_offset?: number;          // relative placement offset (biome mode)
  z_offset?: number;
}

export interface PlacedPlant {
  objectId: string;
  resourceUrl: string;
  downloadUrl?: string;
  plant_name: string;
  species_id: string;
  x: number;
  z: number;
  status: "placed" | "error";
  errorMessage?: string;
  glb_size_kb?: number;
}

export interface GenerateResponse {
  results: PlacedPlant[];
  errors?: string[];
}

export interface PythonGenerateResponse {
  plants: PlantResult[];
  error?: string;
}
