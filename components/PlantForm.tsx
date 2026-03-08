"use client";

const BIOME_PRESETS = [
  "Temperate Forest",
  "Tropical Rainforest",
  "Desert & Scrubland",
  "Arctic Tundra",
  "Mediterranean Shrubland",
  "Alien Bioluminescent World",
  "Enchanted Fantasy Forest",
  "Custom…",
];

interface PlantFormProps {
  mode: "single" | "biome";
  description: string;
  theme: string;
  baseX: number;
  baseZ: number;
  seed: string;
  onChange: (field: string, value: string | number) => void;
}

export default function PlantForm({
  mode,
  description,
  theme,
  baseX,
  baseZ,
  seed,
  onChange,
}: PlantFormProps) {
  const isCustomBiome = !BIOME_PRESETS.slice(0, -1).includes(theme);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {mode === "single" ? (
        <div>
          <label className="label" htmlFor="description">
            Plant Description
          </label>
          <textarea
            id="description"
            className="input"
            rows={4}
            placeholder="e.g. a tall weeping willow with a gently curved trunk and sparse leaves, beside a river"
            value={description}
            onChange={(e) => onChange("description", e.target.value)}
            style={{ resize: "vertical", minHeight: "100px" }}
          />
          <p style={{ fontSize: "0.75rem", color: "var(--forest-600)", marginTop: "0.4rem" }}>
            Describe any real or fictional plant. Claude will generate an L-system grammar for it.
          </p>
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="biome-preset">
            Biome / World Theme
          </label>
          <select
            id="biome-preset"
            className="input"
            value={isCustomBiome ? "Custom…" : theme}
            onChange={(e) => {
              if (e.target.value === "Custom…") {
                onChange("theme", "");
              } else {
                onChange("theme", e.target.value);
              }
            }}
            style={{ marginBottom: "0.5rem" }}
          >
            {BIOME_PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {(isCustomBiome || theme === "") && (
            <input
              type="text"
              className="input"
              placeholder="Describe your world or biome…"
              value={theme}
              onChange={(e) => onChange("theme", e.target.value)}
            />
          )}
          <p style={{ fontSize: "0.75rem", color: "var(--forest-600)", marginTop: "0.4rem" }}>
            Claude will generate 3–7 varied plants suited to this environment.
          </p>
        </div>
      )}

      {/* Coordinates */}
      <div>
        <label className="label">Placement Coordinates (metres)</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label
              htmlFor="baseX"
              style={{ fontSize: "0.7rem", color: "var(--forest-500)", display: "block", marginBottom: "0.25rem" }}
            >
              X axis
            </label>
            <input
              id="baseX"
              type="number"
              className="input"
              step="0.5"
              value={baseX}
              onChange={(e) => onChange("baseX", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label
              htmlFor="baseZ"
              style={{ fontSize: "0.7rem", color: "var(--forest-500)", display: "block", marginBottom: "0.25rem" }}
            >
              Z axis
            </label>
            <input
              id="baseZ"
              type="number"
              className="input"
              step="0.5"
              value={baseZ}
              onChange={(e) => onChange("baseZ", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        {mode === "biome" && (
          <p style={{ fontSize: "0.75rem", color: "var(--forest-600)", marginTop: "0.4rem" }}>
            Individual plants will be offset relative to this centre point.
          </p>
        )}
      </div>

      {/* Seed */}
      <div>
        <label className="label" htmlFor="seed">
          Seed <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional — for reproducibility)</span>
        </label>
        <input
          id="seed"
          type="number"
          className="input"
          placeholder="Random"
          value={seed}
          onChange={(e) => onChange("seed", e.target.value)}
        />
      </div>
    </div>
  );
}
