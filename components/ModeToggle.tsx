"use client";

interface ModeToggleProps {
  mode: "single" | "biome";
  onChange: (mode: "single" | "biome") => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "rgba(13,26,7,0.8)",
        border: "1px solid rgba(74,124,47,0.3)",
        borderRadius: "0.625rem",
        padding: "3px",
        gap: "3px",
      }}
    >
      {(["single", "biome"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: "0.45rem 1.25rem",
            borderRadius: "0.45rem",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.875rem",
            transition: "all 0.15s",
            background: mode === m ? "var(--forest-700)" : "transparent",
            color: mode === m ? "var(--forest-50)" : "var(--forest-500)",
          }}
        >
          {m === "single" ? "🌱 Single Plant" : "🌲 Biome Set"}
        </button>
      ))}
    </div>
  );
}
