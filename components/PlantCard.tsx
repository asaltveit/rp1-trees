import type { PlacedPlant } from "@/lib/types";

interface PlantCardProps {
  plant: PlacedPlant;
  fabricUrl?: string;
}

export default function PlantCard({ plant, fabricUrl }: PlantCardProps) {
  const placed = plant.status === "placed";
  const generatedForDownload = placed && !plant.objectId && !!plant.downloadUrl;
  const downloadName = `${plant.species_id || plant.plant_name || "plant"}.glb`
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_");
  const downloadUrl =
    plant.downloadUrl ||
    (placed && plant.resourceUrl
      ? `/api/download?url=${encodeURIComponent(plant.resourceUrl)}&filename=${encodeURIComponent(downloadName)}${
          fabricUrl ? `&fabricUrl=${encodeURIComponent(fabricUrl)}` : ""
        }`
      : null);

  return (
    <div
      className="card"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
        borderColor: placed ? "rgba(74,124,47,0.25)" : "rgba(248,113,113,0.25)",
      }}
    >
      {/* Status dot */}
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: placed ? "var(--forest-400)" : "#f87171",
          marginTop: "0.3rem",
          flexShrink: 0,
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, color: "var(--forest-100)", fontSize: "0.95rem" }}>
            {plant.plant_name}
          </span>
          <span
            style={{
              fontSize: "0.7rem",
              padding: "0.15rem 0.5rem",
              borderRadius: "999px",
              background: "rgba(74,124,47,0.15)",
              color: "var(--forest-400)",
              border: "1px solid rgba(74,124,47,0.3)",
            }}
          >
            {plant.species_id}
          </span>
          <span
            style={{
              fontSize: "0.7rem",
              padding: "0.15rem 0.5rem",
              borderRadius: "999px",
              background: placed ? "rgba(74,124,47,0.1)" : "rgba(248,113,113,0.1)",
              color: placed ? "var(--forest-400)" : "#f87171",
              border: `1px solid ${placed ? "rgba(74,124,47,0.3)" : "rgba(248,113,113,0.3)"}`,
            }}
          >
            {placed ? (generatedForDownload ? "✓ Download Ready" : "✓ Placed") : "✗ Error"}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "1.25rem",
            marginTop: "0.4rem",
            fontSize: "0.8rem",
            color: "var(--forest-500)",
            flexWrap: "wrap",
          }}
        >
          <span>📍 ({plant.x.toFixed(1)}, {plant.z.toFixed(1)}) m</span>
          {plant.glb_size_kb && <span>📦 {plant.glb_size_kb} KB</span>}
          {placed && plant.resourceUrl && (
            <a
              href={plant.resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--forest-400)", textDecoration: "underline" }}
            >
              View GLB ↗
            </a>
          )}
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={downloadName}
              style={{ color: "var(--forest-200)", textDecoration: "underline" }}
            >
              Download GLB file
            </a>
          )}
        </div>

        {plant.errorMessage && (
          <p style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#f87171" }}>
            {plant.errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
