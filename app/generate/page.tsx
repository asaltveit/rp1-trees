"use client";

import { useState, useCallback, useEffect } from "react";
import type { ManifoldConfig, PlacedPlant, GenerateResponse } from "@/lib/types";
import ModeToggle from "@/components/ModeToggle";
import PlantForm from "@/components/PlantForm";
import ManifoldConnectionForm from "@/components/ManifoldConnectionForm";
import PlacementMap from "@/components/PlacementMap";
import PlantCard from "@/components/PlantCard";

const CONFIG_KEY = "fractal-forest-manifold-config";

const defaultConfig: ManifoldConfig = {
  fabricUrl: "",
  adminKey: "",
  scpHost: "",
  scpUser: "",
  scpPassword: "",
  scpRemotePath: "",
  resourceUrlPrefix: "",
  sceneName: "",
};

export default function GeneratePage() {
  const [mode, setMode] = useState<"single" | "biome">("single");
  const [outputMode, setOutputMode] = useState<"manifold" | "download">("manifold");
  const [resultOutputMode, setResultOutputMode] = useState<"manifold" | "download">("manifold");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("Temperate Forest");
  const [baseX, setBaseX] = useState(0);
  const [baseZ, setBaseZ] = useState(0);
  const [seed, setSeed] = useState("");
  const [manifoldConfig, setManifoldConfig] = useState<ManifoldConfig>(defaultConfig);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PlacedPlant[]>([]);
  const [statusMsg, setStatusMsg] = useState("");

  // Persist Manifold config in localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      try {
        setManifoldConfig(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const handleConfigChange = useCallback((cfg: ManifoldConfig) => {
    setManifoldConfig(cfg);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  }, []);

  const handleFieldChange = useCallback((field: string, value: string | number) => {
    switch (field) {
      case "description": setDescription(String(value)); break;
      case "theme": setTheme(String(value)); break;
      case "baseX": setBaseX(Number(value)); break;
      case "baseZ": setBaseZ(Number(value)); break;
      case "seed": setSeed(String(value)); break;
    }
  }, []);

  const canSubmit =
    !loading &&
    ((mode === "single" && description.trim()) ||
      (mode === "biome" && theme.trim())) &&
    (outputMode === "download" || manifoldConfig.fabricUrl.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setStatusMsg(mode === "biome" ? "Generating biome plants…" : "Generating plant…");

    try {
      const requestedOutputMode = outputMode;
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          outputMode: requestedOutputMode,
          description: description.trim() || undefined,
          theme: theme.trim() || undefined,
          seed: seed ? parseInt(seed) : undefined,
          baseX,
          baseZ,
          manifoldConfig,
        }),
      });

      const data: GenerateResponse & { error?: string } = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Server error: ${res.status}`);
      }

      setResults(data.results);
      setResultOutputMode(requestedOutputMode);
      const succeeded = data.results.filter((r) => r.status === "placed").length;
      setStatusMsg(
        requestedOutputMode === "manifold"
          ? `Done — ${succeeded} of ${data.results.length} plant(s) placed.`
          : `Done — ${succeeded} of ${data.results.length} plant(s) generated for download.`
      );
    } catch (err) {
      setError((err as Error).message);
      setStatusMsg("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="leaf-bg"
      style={{ minHeight: "calc(100vh - 57px)", padding: "2rem 1.5rem" }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Persistent live region — always mounted so screen readers pick up changes */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {statusMsg || (error ? `Error: ${error}` : "")}
        </div>

        <h1
          style={{
            fontSize: "1.75rem",
            color: "var(--forest-100)",
            marginBottom: "0.5rem",
          }}
        >
          Plant Generator
        </h1>
        <p style={{ color: "var(--forest-500)", marginBottom: "2rem", fontSize: "0.9rem" }}>
          Generate fractal 3D plants and either place them in Manifold or download GLB files.
        </p>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
              gap: "1.5rem",
              alignItems: "start",
            }}
          >
            {/* Left: Plant config */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="card">
                <div style={{ marginBottom: "1.25rem" }}>
                  <ModeToggle mode={mode} onChange={setMode} />
                </div>
                <PlantForm
                  mode={mode}
                  description={description}
                  theme={theme}
                  baseX={baseX}
                  baseZ={baseZ}
                  seed={seed}
                  onChange={handleFieldChange}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn-primary"
                disabled={!canSubmit}
                style={{ width: "100%", fontSize: "1rem", padding: "0.75rem" }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <Spinner /> {statusMsg || "Generating…"}
                  </span>
                ) : (
                  <><span aria-hidden="true">🌱</span>{" "}{mode === "biome" ? "Generate Biome" : "Generate Plant"}</>

                )}
              </button>

              {error && (
                <div
                  role="alert"
                  style={{
                    padding: "0.875rem",
                    borderRadius: "0.5rem",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#fca5a5",
                    fontSize: "0.875rem",
                  }}
                >
                  <strong>Error:</strong> {error}
                </div>
              )}
            </div>

            {/* Right: Manifold config */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="card">
                <h2
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "var(--forest-300)",
                    marginBottom: "1.25rem",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-inter, sans-serif)",
                  }}
                >
                  Output & Connection
                </h2>
                <ManifoldConnectionForm
                  config={manifoldConfig}
                  outputMode={outputMode}
                  onOutputModeChange={setOutputMode}
                  onChange={handleConfigChange}
                />
              </div>

              {/* Placement map */}
              {resultOutputMode === "manifold" && results.length > 0 && (
                <div className="card">
                  <PlacementMap plants={results} baseX={baseX} baseZ={baseZ} />
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ marginTop: "2rem" }}>
            <h2
              style={{
                fontSize: "1.1rem",
                color: "var(--forest-200)",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              {statusMsg}
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--forest-600)",
                  fontFamily: "sans-serif",
                  fontWeight: 400,
                }}
              >
                {results.filter((r) => r.status === "placed").length}{" "}
                {resultOutputMode === "manifold" ? "placed" : "generated"} ·{" "}
                {results.filter((r) => r.status === "error").length} errors
              </span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {results.map((plant, i) => (
                <PlantCard
                  key={plant.objectId || i}
                  plant={plant}
                  fabricUrl={resultOutputMode === "manifold" ? manifoldConfig.fabricUrl : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
      style={{
        animation: "spin 0.8s linear infinite",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
