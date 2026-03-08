"use client";

import { useEffect, useState, useRef, useCallback } from "react";

// Step 0 runs for 2900ms, step 1 for 450ms, step 2 for 3600ms
const STEP_DURATIONS = [2900, 300, 500];

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

// ─── Cursor ───────────────────────────────────────────────────────────────────

function FakeCursor({ pressing }: { pressing: boolean }) {
  return (
    <svg
      width="20"
      height="26"
      viewBox="0 0 20 26"
      aria-hidden="true"
      style={{
        filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.55))",
        transform: pressing ? "scale(0.84)" : "scale(1)",
        transition: "transform 0.07s ease",
      }}
    >
      <polygon
        points="0,0 0,20 4.5,14.5 7.5,22 10,21 7,13.5 13,13.5"
        fill="white"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Layout constants ─────────────────────────────────────────────────────────
//
// Card has 1.25rem (20px) padding on all sides.
// Card inner width ≈ 380px (within 420px max-width container).
//
// Measured from the TOP-LEFT of the outer position:relative container:
//
//  y ≈  20   card top padding starts
//  y ≈  38   "Biome / World Theme" label (18px text, 6px margin-bottom)
//  y ≈  44   dropdown trigger top
//  y ≈  86   dropdown trigger bottom  (padding 0.5rem = 8px, line-height 24px, total 40px)
//  y ≈  65   dropdown trigger CENTRE  (cursor tip should rest here)
//  y ≈  86   dropdown list starts (position:absolute, borderless top)
//  y ≈ 116   option 0 centre  (item height 30px → centre at +15)
//  y ≈ 146   option 1 centre
//  y ≈ 176   option 2 centre
//  y ≈ 206   option 3 centre
//  y ≈ 236   option 4 centre
//  y ≈ 266   option 5 centre  ← "Alien Bioluminescent World"
//  y ≈ 296   option 6 centre
//  y ≈ 316   dropdown list bottom
//  (dropdown closed — elements below the trigger resume):
//  y ≈ 100   description text top  (86 + 8px margin-top)
//  y ≈ 150   button top            (100 + 30px text + 8px + 16px margin-bottom = ~150)
//  y ≈ 170   button CENTRE         (button height ~40px)
//
//  Chevron is near x ≈ 360 (right of 380px inner, minus right-padding 20px ≈ x 360)
//  Option text starts at x ≈ 32 (12px left-padding + some indent)
//  Button centre x ≈ 210

// Cursor tip positions (x, y) relative to the .demo-cursor-container div
// Phase:
//  0  entry   – above the card
//  1  hover   – over the dropdown chevron
//  2  open    – dropdown opens (cursor stays on chevron)
//  3  option  – cursor drifts onto "Alien Bioluminescent World"
//  4  select  – item selected, cursor stays on the closed dropdown trigger
//  5  pause   – cursor remains on trigger (pause before moving)
//  6  button  – cursor moves to button centre
//  7  click   – cursor micro-drops (click press)

const CURSOR_POS = [
  { x: 295, y: -14 },   // 0  entry from above
  { x: 358, y:  65 },   // 1  chevron on dropdown trigger
  { x: 358, y:  65 },   // 2  stay while dropdown opens
  { x: 175, y: 266 },   // 3  "Alien Bioluminescent World" option
  { x: 358, y:  65 },   // 4  back to trigger (value updated)
  { x: 358, y:  65 },   // 5  deliberate pause
  { x: 210, y: 170 },   // 6  arrive on button
  { x: 210, y: 174 },   // 7  micro-drop for click
] as const;

// Timing (ms after mount) for each phase transition
const PHASE_TIMES = [360, 700, 1080, 1520, 1760, 2180, 2560] as const;
//                   →1   →2   →3    →4    →5    →6    →7

const BIOME_OPTIONS = [
  "Temperate Forest",
  "Tropical Rainforest",
  "Desert & Scrubland",
  "Arctic Tundra",
  "Mediterranean Shrubland",
  "Alien Bioluminescent World",
  "Enchanted Fantasy Forest",
];

// ─── Animated Step 0 ──────────────────────────────────────────────────────────

function AnimatedStep0({ onAdvance }: { onAdvance: () => void }) {
  const [phase, setPhase] = useState<0|1|2|3|4|5|6|7>(0);

  useEffect(() => {
    const timers = PHASE_TIMES.map((t, i) =>
      setTimeout(() => setPhase((i + 1) as 1|2|3|4|5|6|7), t)
    );
    // Advance to loading slide 150ms after the click (PHASE_TIMES[6] = phase 7 fires)
    const advanceTimer = setTimeout(onAdvance, PHASE_TIMES[6] + 150);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(advanceTimer);
    };
  }, [onAdvance]);

  const dropdownOpen = phase >= 2 && phase <= 3;
  const itemSelected = phase >= 4;
  const buttonHovered = phase >= 6;
  const buttonClicking = phase === 7;
  const cur = CURSOR_POS[phase];

  return (
    <div className="demo-step-enter" style={{ display: "flex", justifyContent: "center" }}>
      {/* position:relative root for absolute cursor */}
      <div
        className="demo-cursor-container"
        style={{ position: "relative", maxWidth: 420, width: "100%", overflow: "visible" }}
      >
        {/* ── Fake cursor ── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: cur.x,
            top: cur.y,
            zIndex: 20,
            pointerEvents: "none",
            // phase 0 → instant placement; all others → smooth glide
            transition: phase === 0
              ? "none"
              : "left 0.36s cubic-bezier(0.3,0.85,0.4,1), top 0.36s cubic-bezier(0.3,0.85,0.4,1)",
          }}
        >
          <FakeCursor pressing={buttonClicking} />
        </div>

        {/* ── The mock UI card ── */}
        <div
          className="card"
          style={{ border: "1px solid rgba(168,85,247,0.35)", userSelect: "none" }}
        >
          <p className="label" style={{ marginBottom: "0.375rem" }}>Biome / World Theme</p>

          {/* Dropdown trigger + options */}
          <div style={{ position: "relative" }}>
            {/* Trigger */}
            <div
              style={{
                background: dropdownOpen || (phase === 1)
                  ? "rgba(168,85,247,0.18)"
                  : "rgba(13,26,7,0.8)",
                border: `1px solid ${dropdownOpen || phase === 1 ? "rgba(168,85,247,0.65)" : "rgba(74,124,47,0.5)"}`,
                borderRadius: dropdownOpen ? "0.5rem 0.5rem 0 0" : "0.5rem",
                padding: "0.5rem 0.75rem",
                color: itemSelected ? "#d8b4fe" : "var(--forest-100)",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "background 0.15s, border-color 0.15s, color 0.2s",
              }}
            >
              <span>
                {itemSelected && <span aria-hidden="true">🌌 </span>}
                {itemSelected ? "Alien Bioluminescent World" : "Temperate Forest"}
              </span>
              {/* Chevron */}
              <svg
                width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{
                  transform: dropdownOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                  opacity: 0.55,
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* Dropdown list */}
            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "rgba(10,20,6,0.98)",
                  border: "1px solid rgba(168,85,247,0.45)",
                  borderTop: "none",
                  borderRadius: "0 0 0.5rem 0.5rem",
                  zIndex: 5,
                  animation: "slideDown 0.16s ease",
                }}
              >
                <style>{`
                  @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-5px); }
                    to   { opacity: 1; transform: translateY(0); }
                  }
                  @keyframes btnFlash {
                    0%   { opacity: 0.7; }
                    100% { opacity: 0; }
                  }
                `}</style>
                {BIOME_OPTIONS.map((opt) => {
                  const hovered = opt === "Alien Bioluminescent World" && phase === 3;
                  return (
                    <div
                      key={opt}
                      style={{
                        padding: "0.38rem 0.75rem",
                        fontSize: "0.85rem",
                        color: hovered ? "#e9d5ff" : "var(--forest-400)",
                        background: hovered ? "rgba(168,85,247,0.22)" : "transparent",
                        borderLeft: hovered ? "2px solid #a855f7" : "2px solid transparent",
                        transition: "background 0.1s, color 0.1s",
                        lineHeight: 1.4,
                      }}
                    >
                      {opt === "Alien Bioluminescent World" && "🌌 "}{opt}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Description */}
          <p style={{
            fontSize: "0.75rem",
            color: "var(--forest-600)",
            marginTop: "0.5rem",
            marginBottom: "1rem",
          }}>
            Claude will generate 3–7 varied plants suited to this environment.
          </p>

          {/* Generate button */}
          <div
            aria-hidden="true"
            style={{ position: "relative", borderRadius: "0.5rem", overflow: "hidden" }}
          >
            <div
              style={{
                background: buttonClicking
                  ? "rgba(168,85,247,0.55)"
                  : buttonHovered
                  ? "rgba(168,85,247,0.32)"
                  : "rgba(168,85,247,0.15)",
                border: `1px solid rgba(168,85,247,${buttonHovered ? "0.75" : "0.35"})`,
                borderRadius: "0.5rem",
                padding: "0.625rem",
                textAlign: "center",
                color: "#d8b4fe",
                fontWeight: 600,
                fontSize: "0.9rem",
                transform: buttonClicking ? "scale(0.94)" : "scale(1)",
                boxShadow: buttonClicking
                  ? "0 0 28px rgba(168,85,247,0.7), inset 0 0 12px rgba(168,85,247,0.3)"
                  : buttonHovered
                  ? "0 0 12px rgba(168,85,247,0.25)"
                  : "none",
                transition: "background 0.12s, transform 0.07s, box-shadow 0.12s, border-color 0.15s",
              }}
            >
              <span aria-hidden="true">🌱</span>{" "}Generate Biome
            </div>
            {/* Click flash overlay */}
            {buttonClicking && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "0.5rem",
                  background: "rgba(216,180,254,0.35)",
                  animation: "btnFlash 0.35s ease-out forwards",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: spinner ──────────────────────────────────────────────────────────

function Step1() {
  return (
    <div
      className="demo-step-enter"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: "1.25rem",
      }}
    >
      <svg
        width="44" height="44" viewBox="0 0 24 24"
        fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"
        aria-hidden="true"
        style={{ animation: "spin 0.9s linear infinite" }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      <p style={{ color: "#c084fc", fontWeight: 600, fontSize: "1rem" }}>
        Generating alien plants…
      </p>
    </div>
  );
}

// ─── Step 2: results ──────────────────────────────────────────────────────────

function Step2() {
  return (
    <div
      className="demo-step-enter"
      style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", alignContent: "flex-start" }}
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
          <p style={{ fontWeight: 700, color: "#e9d5ff", marginTop: "0.5rem", fontSize: "0.9rem" }}>
            {plant.name}
          </p>
          <p style={{ fontSize: "0.7rem", color: plant.stroke, marginBottom: "0.5rem" }}>
            {plant.id}
          </p>
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

// ─── SVG plant illustrations ─────────────────────────────────────────────────

function XenophyteSVG({ stroke }: { stroke: string }) {
  return (
    <>
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
      {([[35,46],[62,44],[68,44],[80,40],[92,44],[98,46],[125,46]] as [number,number][]).map(([cx, cy], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={7} ry={5} fill={stroke} fillOpacity={0.3} stroke={stroke} strokeWidth="0.5" />
      ))}
    </>
  );
}

function TendrilSVG({ stroke }: { stroke: string }) {
  return (
    <>
      <line x1="80" y1="130" x2="80" y2="55" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      {[
        [80,90, 45,115], [80,90, 115,115],
        [80,75, 40,105], [80,75, 120,105],
        [80,62, 48,90],  [80,62, 112,90],
        [80,55, 55,78],  [80,55, 105,78],
      ].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2,3" />
      ))}
      {([[45,119],[115,119],[40,109],[120,109],[48,94],[112,94],[55,82],[105,82]] as [number,number][]).map(([cx,cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={4} fill={stroke} fillOpacity={0.5} />
      ))}
      <circle cx={80} cy={48} r={9} fill={stroke} fillOpacity={0.25} stroke={stroke} strokeWidth="0.5" />
    </>
  );
}

function CrystalSVG({ stroke }: { stroke: string }) {
  return (
    <>
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
      <ellipse cx="80" cy="135" rx="28" ry="5" fill={stroke} fillOpacity={0.1} />
      {variant === "xenophyte"   && <XenophyteSVG stroke={stroke} />}
      {variant === "tendril"     && <TendrilSVG stroke={stroke} />}
      {variant === "crystalmoss" && <CrystalSVG stroke={stroke} />}
    </svg>
  );
}

// ─── Main demo component ──────────────────────────────────────────────────────

export default function AlienBiomeDemo() {
  const [step, setStep] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advanceStep = useCallback(() => {
    // Clear any pending timer then immediately advance
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep((s) => {
      const next = (s + 1) % 3;
      if (next === 0) setCycleKey((k) => k + 1);
      return next;
    });
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(advanceStep, STEP_DURATIONS[step]);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [step, paused, advanceStep]);

  const STEP_LABELS = [
    "Step 1 of 3: Selecting alien biome",
    "Step 2 of 3: Generating alien plants",
    "Step 3 of 3: Three alien plants placed",
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
        <p style={{
          textAlign: "center",
          color: "var(--forest-500)",
          marginBottom: "2.5rem",
          fontSize: "0.9rem",
        }}>
          Alien Bioluminescent World — hover to pause
        </p>

        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {STEP_LABELS[step]}
        </div>

        {/* Fixed-height stage — tall enough for open dropdown + breathing room */}
        <div style={{ height: 380, position: "relative" }}>
          {step === 0 && <AnimatedStep0 key={cycleKey} onAdvance={advanceStep} />}
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
