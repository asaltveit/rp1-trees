"use client";

import { useState } from "react";
import type { PlacedPlant } from "@/lib/types";

interface PlacementMapProps {
  plants: PlacedPlant[];
  baseX: number;
  baseZ: number;
}

const SVG_SIZE = 280;
const PADDING = 30;
const INNER = SVG_SIZE - PADDING * 2;

export default function PlacementMap({ plants, baseX, baseZ }: PlacementMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (plants.length === 0) {
    return (
      <div
        style={{
          width: SVG_SIZE,
          height: SVG_SIZE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px dashed rgba(74,124,47,0.3)",
          borderRadius: "0.75rem",
          color: "var(--forest-700)",
          fontSize: "0.8rem",
          textAlign: "center",
          padding: "1rem",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Plant positions will appear here after generation
      </div>
    );
  }

  // Compute bounds
  const xs = plants.map((p) => p.x);
  const zs = plants.map((p) => p.z);
  const minX = Math.min(...xs, baseX) - 5;
  const maxX = Math.max(...xs, baseX) + 5;
  const minZ = Math.min(...zs, baseZ) - 5;
  const maxZ = Math.max(...zs, baseZ) + 5;

  const scaleX = (x: number) =>
    PADDING + ((x - minX) / (maxX - minX || 1)) * INNER;
  const scaleZ = (z: number) =>
    PADDING + ((z - minZ) / (maxZ - minZ || 1)) * INNER;

  // Grid lines
  const gridLines: React.ReactNode[] = [];
  const stepX = Math.ceil((maxX - minX) / 4);
  const stepZ = Math.ceil((maxZ - minZ) / 4);
  for (let x = Math.floor(minX / 10) * 10; x <= maxX; x += stepX) {
    const sx = scaleX(x);
    gridLines.push(
      <line key={`vg${x}`} x1={sx} y1={PADDING} x2={sx} y2={SVG_SIZE - PADDING}
        stroke="rgba(74,124,47,0.15)" strokeWidth="0.5" strokeDasharray="3,3" />
    );
    gridLines.push(
      <text key={`vt${x}`} x={sx} y={SVG_SIZE - 10}
        textAnchor="middle" fill="rgba(141,196,108,0.5)" fontSize="8">{x.toFixed(0)}m</text>
    );
  }
  for (let z = Math.floor(minZ / 10) * 10; z <= maxZ; z += stepZ) {
    const sz = scaleZ(z);
    gridLines.push(
      <line key={`hg${z}`} x1={PADDING} y1={sz} x2={SVG_SIZE - PADDING} y2={sz}
        stroke="rgba(74,124,47,0.15)" strokeWidth="0.5" strokeDasharray="3,3" />
    );
    gridLines.push(
      <text key={`ht${z}`} x={8} y={sz + 3}
        textAnchor="middle" fill="rgba(141,196,108,0.5)" fontSize="8">{z.toFixed(0)}</text>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <p className="label" style={{ marginBottom: "0.5rem" }}>Placement Map</p>
      <svg
        width={SVG_SIZE}
        height={SVG_SIZE}
        role="img"
        aria-label={`Placement map showing ${plants.length} plant${plants.length !== 1 ? "s" : ""}`}
        style={{
          background: "rgba(13,26,7,0.8)",
          border: "1px solid rgba(74,124,47,0.25)",
          borderRadius: "0.75rem",
          display: "block",
        }}
      >
        {/* Grid */}
        {gridLines}

        {/* Origin cross */}
        <line x1={scaleX(baseX) - 6} y1={scaleZ(baseZ)} x2={scaleX(baseX) + 6} y2={scaleZ(baseZ)}
          stroke="rgba(139,94,60,0.5)" strokeWidth="1" />
        <line x1={scaleX(baseX)} y1={scaleZ(baseZ) - 6} x2={scaleX(baseX)} y2={scaleZ(baseZ) + 6}
          stroke="rgba(139,94,60,0.5)" strokeWidth="1" />

        {/* Plants */}
        {plants.map((plant) => {
          const cx = scaleX(plant.x);
          const cy = scaleZ(plant.z);
          const isHov = hovered === plant.objectId;
          const color = plant.status === "placed" ? "var(--forest-400)" : "#f87171";

          return (
            <g
              key={plant.objectId || `${plant.x}-${plant.z}`}
              role="button"
              tabIndex={0}
              aria-label={`${plant.plant_name} at (${plant.x.toFixed(1)}, ${plant.z.toFixed(1)}) metres — ${plant.status}`}
              onMouseEnter={() => setHovered(plant.objectId)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(plant.objectId)}
              onBlur={() => setHovered(null)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setHovered(plant.objectId); }}
              style={{ cursor: "default" }}
            >
              <circle cx={cx} cy={cy} r={isHov ? 7 : 5}
                fill={color} fillOpacity={0.25}
                stroke={color} strokeWidth="1.5" />
              {/* Tree icon */}
              <line x1={cx} y1={cy + 2} x2={cx} y2={cy - 3}
                stroke={color} strokeWidth="1" />
              <line x1={cx} y1={cy - 1} x2={cx - 3} y2={cy - 5}
                stroke={color} strokeWidth="0.8" />
              <line x1={cx} y1={cy - 1} x2={cx + 3} y2={cy - 5}
                stroke={color} strokeWidth="0.8" />

              {/* Tooltip */}
              {isHov && (
                <g>
                  <rect
                    x={cx + 8} y={cy - 18}
                    width={Math.min(plant.plant_name.length * 5.5 + 16, 120)} height={28}
                    rx="4" fill="rgba(26,46,13,0.95)"
                    stroke="rgba(74,124,47,0.4)" strokeWidth="1"
                  />
                  <text x={cx + 16} y={cy - 6}
                    fill="var(--forest-100)" fontSize="9" fontWeight="600">
                    {plant.plant_name}
                  </text>
                  <text x={cx + 16} y={cy + 4}
                    fill="var(--forest-500)" fontSize="8">
                    {plant.x.toFixed(1)}, {plant.z.toFixed(1)}m
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
