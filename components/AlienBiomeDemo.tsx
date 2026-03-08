"use client";

import { useEffect, useState, useRef } from "react";

const STEP_DURATIONS = [2400, 1800, 3800]; // ms per step

// ─── Alien plant data ────────────────────────────────────────────────────────

const ALIEN_PLANTS = [
  {
    name: "Xenophyte-7",
    id: "xeno-7",
    height: "4.2 m",
    spread: "2.8 m",
    variant: "xenophyte" as const,
    stroke: "#06b6d4",
    glow: "rgba(6,182,212,0.18)",
  },
  {
    name: "Bioluminescent Tendril",
    id: "bio-tendril-3",
    height: "7.1 m",
    spread: "3.5 m",
    variant: "tendril" as const,
    stroke: "#a855f7",
    glow: "rgba(168,85,247,0.18)",
  },
  {
    name: "Crystalmoss",
    id: "crystalmoss-1",
    height: "1.8 m",
    spread: "1.2 m",
    variant: "crystalmoss" as const,
    stroke: "#34d399",
    glow: "rgba(52,211,153,0.18)",
  },
];

// ─── SVG plant illustrations ─────────────────────────────────────────────────

function XenophyteSVG({ stroke }: { stroke: string }) {
  return (
    <>
      {/* Wide spiraling branches */}
      <line x1="80" y1="130" x2="80" y2="72" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="100" x2="50" y2="72" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <line x1="80" y1="100" x2="110" y2="72" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="72" x2="35" y2="52" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="72" x2="62" y2="50" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="80" y1="72" x2="68" y2="50" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="80" y1="72" x2="80" y2="46" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="80" y1="72" x2="92" y2="50" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="110" y1="72" x2="98" y2="52" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="110" y1="72" x2="125" y2="52" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      {/* Leaf tips — glowing ellipses */}
      {([[35,46],[62,44],[68,44],[80,40],[92,44],[98,46],[125,46]] as [number,number][]).map(([cx, cy], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={7} ry={5} fill={stroke} fillOpacity={0.3} stroke={stroke} strokeWidth="0.5" />
      ))}
    </>
  );
}

function TendrilSVG({ stroke }: { stroke: string }) {
  return (
    <>
      {/* Central stalk */}
      <line x1="80" y1="130" x2="80" y2="55" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      {/* Long drooping filaments */}
      {[
        [80,90, 45,115], [80,90, 115,115],
        [80,75, 40,105], [80,75, 120,105],
        [80,62, 48,90],  [80,62, 112,90],
        [80,55, 55,78],  [80,55, 105,78],
      ].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2,3" />
      ))}
      {/* Tip glows */}
      {([[45,119],[115,119],[40,109],[120,109],[48,94],[112,94],[55,82],[105,82]] as [number,number][]).map(([cx,cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={4} fill={stroke} fillOpacity={0.5} />
      ))}
      {/* Crown glow */}
      <circle cx={80} cy={48} r={9} fill={stroke} fillOpacity={0.25} stroke={stroke} strokeWidth="0.5" />
    </>
  );
}

function CrystalSVG({ stroke }: { stroke: string }) {
  return (
    <>
      {/* Short stubby crystalline spikes radiating from centre */}
      <line x1="80" y1="120" x2="80" y2="80" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      {[
        [80,95, 55,72], [80,95, 105,72],
        [80,85, 58,60],  [80,85, 102,60],
        [80,80, 62,52],  [80,80, 98,52],
        [80,80, 72,46],  [80,80, 88,46],
        [80,80, 80,40],
      ].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={stroke} strokeWidth={i < 2 ? 2 : 1.5} strokeLinecap="round" />
      ))}
      {/* Crystal facets — diamonds */}
      {([
        [55,66,6,10], [105,66,6,10],
        [58,54,5,9],  [102,54,5,9],
        [62,46,4,8],  [98,46,4,8],
        [72,40,4,8],  [88,40,4,8],
        [80,34,5,9],
      ] as [number,number,number,number][]).map(([cx,cy,rx,ry], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry}
          fill={stroke} fillOpacity={0.35} stroke={stroke} strokeWidth="0.5" />
      ))}
    </>
  );
}

function AlienPlantSVG({ variant, stroke, glow, name }: {
  variant: "xenophyte" | "tendril" | "crystalmoss";
  stroke: string;
  glow: string;
  name: string;
}) {
  const gradId = `glow-${variant}`;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label={`Fractal illustration of ${name}`}>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="1" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="80" rx="68" ry="68" fill={`url(#${gradId})`} />
      {/* Ground */}
      <ellipse cx="80" cy="135" rx="28" ry="5" fill={stroke} fillOpacity={0.1} />
      {variant === "xenophyte" && <XenophyteSVG stroke={stroke} />}
      {variant === "tendril"   && <TendrilSVG stroke={stroke} />}
      {variant === "crystalmoss" && <CrystalSVG stroke={stroke} />}
    </svg>
  );
}

// ─── Step sub-components ──────────────────────────────────────────────────────

function Step0() {
  return (
    <div className="demo-step-enter" style={{ display: "flex", justifyContent: "center" }}>
      <div
        className="card"
        style={{ maxWidth: 420, width: "100%", border: "1px solid rgba(168,85,247,0.35)" }}
        aria-label="UI mockup: biome selector with Alien Bioluminescent World chosen"
      >
        <p className="label" style={{ marginBottom: "0.375rem" }}>Biome / World Theme</p>
        {/* Fake select highlight */}
        <div
          style={{
            background: "rgba(168,85,247,0.12)",
            border: "1px solid rgba(168,85,247,0.5)",
            borderRadius: "0.5rem",
            padding: "0.5rem 0.75rem",
            color: "#d8b4fe",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span aria-hidden="true">🌌</span> Alien Bioluminescent World
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--forest-600)", marginTop: "0.5rem" }}>
          Claude will generate 3–7 varied plants suited to this environment.
        </p>
        {/* Fake generate button */}
        <div
          aria-hidden="true"
          style={{
            marginTop: "1rem",
            background: "rgba(168,85,247,0.2)",
            border: "1px solid rgba(168,85,247,0.4)",
            borderRadius: "0.5rem",
            padding: "0.625rem",
            textAlign: "center",
            color: "#d8b4fe",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          <span aria-hidden="true">🌱</span> Generate Biome
        </div>
      </div>
    </div>
  );
}

function Step1() {
  return (
    <div
      className="demo-step-enter"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 220, gap: "1.25rem" }}
    >
      <svg
        width="44" height="44" viewBox="0 0 24 24"
        fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"
        aria-hidden="true"
        style={{ animation: "spin 0.9s linear infinite" }}
      >
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      <p style={{ color: "#c084fc", fontWeight: 600, fontSize: "1rem" }}>Generating alien plants…</p>
    </div>
  );
}

function Step2() {
  return (
    <div
      className="demo-step-enter"
      style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}
    >
      {ALIEN_PLANTS.map((plant) => (
        <article
          key={plant.id}
          className="card"
          style={{ width: 180, border: `1px solid ${plant.stroke}44`, flexShrink: 0 }}
          aria-label={`${plant.name}: height ${plant.height}, spread ${plant.spread}`}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AlienPlantSVG variant={plant.variant} stroke={plant.stroke} glow={plant.glow} name={plant.name} />
          </div>
          <p style={{ fontWeight: 700, color: "#e9d5ff", marginTop: "0.5rem", fontSize: "0.9rem" }}>{plant.name}</p>
          <p style={{ fontSize: "0.7rem", color: plant.stroke, marginBottom: "0.5rem" }}>{plant.id}</p>
          <div style={{ fontSize: "0.75rem", color: "#c4b5fd", lineHeight: 1.6 }}>
            <div>Height: {plant.height}</div>
            <div>Spread: {plant.spread}</div>
            <div>Biome: Alien Bioluminescent</div>
          </div>
          <div
            style={{
              marginTop: "0.75rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "#34d399",
              background: "rgba(52,211,153,0.12)",
              border: "1px solid rgba(52,211,153,0.3)",
              borderRadius: "999px",
              padding: "0.2rem 0.6rem",
            }}
          >
            ✓ Placed
          </div>
        </article>
      ))}
    </div>
  );
}

// ─── Main demo component ──────────────────────────────────────────────────────

export default function AlienBiomeDemo() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(() => {
      setStep((s) => (s + 1) % 3);
    }, STEP_DURATIONS[step]);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [step, paused]);

  const STEP_LABELS = [
    "Step 1 of 3: Selecting alien biome",
    "Step 2 of 3: Generating alien plants",
    "Step 3 of 3: Three alien plants generated",
  ];

  return (
    <section
      aria-label="Live demo: Alien biome generation"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      style={{
        background: "rgba(88,28,135,0.07)",
        borderTop: "1px solid rgba(168,85,247,0.15)",
        borderBottom: "1px solid rgba(168,85,247,0.15)",
        padding: "4rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2
          style={{
            fontSize: "1.75rem",
            textAlign: "center",
            color: "var(--forest-100)",
            marginBottom: "0.5rem",
          }}
        >
          See it in action
        </h2>
        <p style={{ textAlign: "center", color: "var(--forest-500)", marginBottom: "2.5rem", fontSize: "0.9rem" }}>
          Alien Bioluminescent World — hover to pause
        </p>

        {/* Screen-reader live region */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {STEP_LABELS[step]}
        </div>

        <div style={{ minHeight: 260 }}>
          {step === 0 && <Step0 />}
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
        </div>

        {/* Step indicator dots */}
        <div
          role="group"
          aria-label="Demo step indicators"
          style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}
        >
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to ${STEP_LABELS[i]}`}
              aria-current={step === i ? "step" : undefined}
              onClick={() => { setStep(i); setPaused(true); }}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                padding: 0,
                background: step === i ? "#a855f7" : "rgba(168,85,247,0.3)",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
