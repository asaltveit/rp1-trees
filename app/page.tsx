import Link from "next/link";
import AlienBiomeDemo from "@/components/AlienBiomeDemo";

export default function HomePage() {
  return (
    <main className="leaf-bg" style={{ minHeight: "calc(100vh - 57px)" }}>
      {/* Hero */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "5rem 1.5rem 3rem",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4rem",
          alignItems: "center",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--forest-400)",
              marginBottom: "1rem",
            }}
          >
            Procedural L-System Generator
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              lineHeight: 1.15,
              color: "var(--forest-50)",
              marginBottom: "1.5rem",
            }}
          >
            Grow a&nbsp;Forest from&nbsp;Words
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              lineHeight: 1.75,
              color: "var(--forest-300)",
              maxWidth: "480px",
              marginBottom: "2.5rem",
            }}
          >
            Describe a plant or choose a biome. Claude interprets your words into
            L-system grammars, generating fractal 3D trees exported as{" "}
            <code style={{ color: "var(--bark-300)" }}>.glb</code> files — then
            places them into your Manifold Fabric scene at precise coordinates.
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/generate" className="btn-primary" style={{ fontSize: "1rem" }}>
              Start Growing →
            </Link>
            <a
              href="#how-it-works"
              className="btn-secondary"
              style={{ fontSize: "1rem" }}
            >
              How it works
            </a>
          </div>
        </div>

        {/* Fractal tree SVG illustration */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <FractalTreeSVG />
        </div>
      </section>

      {/* Feature pills */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        <ul
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {[
            { icon: "🌿", label: "L-System Fractals" },
            { icon: "🤖", label: "Claude-Powered" },
            { icon: "📦", label: "GLB Export" },
            { icon: "🗺️", label: "Manifold Placement" },
            { icon: "🌍", label: "Biome Sets" },
            { icon: "🎲", label: "Seed Reproducible" },
          ].map(({ icon, label }) => (
            <li
              key={label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.4rem 1rem",
                borderRadius: "999px",
                background: "rgba(74,124,47,0.15)",
                border: "1px solid rgba(74,124,47,0.3)",
                color: "var(--forest-200)",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              <span aria-hidden="true">{icon}</span> {label}
            </li>
          ))}
        </ul>
      </section>

      <AlienBiomeDemo />

      {/* How it works */}
      <section
        id="how-it-works"
        style={{
          background: "rgba(26,46,13,0.4)",
          borderTop: "1px solid rgba(74,124,47,0.15)",
          borderBottom: "1px solid rgba(74,124,47,0.15)",
          padding: "4rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "1.75rem",
              textAlign: "center",
              color: "var(--forest-100)",
              marginBottom: "3rem",
            }}
          >
            How It Works
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              {
                step: "01",
                title: "Describe",
                body: 'Type a plant description ("a weeping willow with sparse leaves") or choose a biome theme.',
              },
              {
                step: "02",
                title: "Interpret",
                body: "Claude API translates your words into L-system grammar rules and growth parameters.",
              },
              {
                step: "03",
                title: "Generate",
                body: "A fractal turtle walks the grammar, building a 3D branching mesh with procedural bark and leaf textures.",
              },
              {
                step: "04",
                title: "Place",
                body: "The .glb file is uploaded to your Manifold Fabric server and placed at your specified coordinates.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="card">
                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: "var(--forest-600)",
                    marginBottom: "0.5rem",
                  }}
                >
                  STEP {step}
                </div>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    color: "var(--forest-100)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--forest-300)", lineHeight: 1.6 }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.75rem", color: "var(--forest-100)", marginBottom: "1rem" }}>
          Ready to grow your forest?
        </h2>
        <p style={{ color: "var(--forest-400)", marginBottom: "2rem" }}>
          Connect your Manifold Fabric scene and start generating.
        </p>
        <Link href="/generate" className="btn-primary" style={{ fontSize: "1.1rem" }}>
          Open Generator →
        </Link>
      </section>
    </main>
  );
}

// L-system fractal tree illustration (Prusinkiewicz plant, 5 iterations)
function FractalTreeSVG() {
  const W = 320, H = 420;

  // Expand L-system
  const rules: Record<string, string> = { X: "F+[[X]-X]-F[-FX]+X", F: "FF" };
  let str = "X";
  for (let i = 0; i < 5; i++) str = [...str].map(c => rules[c] ?? c).join("");

  // Turtle walk → segments
  type Seg = { x1: number; y1: number; x2: number; y2: number; d: number };
  const segs: Seg[] = [];
  const stk: { x: number; y: number; a: number; d: number }[] = [];
  let px = 0, py = 0, angle = -90, depth = 0;
  const STEP = 4, DEG2RAD = Math.PI / 180;

  for (const c of str) {
    if (c === "F") {
      const nx = px + STEP * Math.cos(angle * DEG2RAD);
      const ny = py + STEP * Math.sin(angle * DEG2RAD);
      segs.push({ x1: px, y1: py, x2: nx, y2: ny, d: depth });
      px = nx; py = ny;
    } else if (c === "+") angle += 25;
    else if (c === "-") angle -= 25;
    else if (c === "[") { stk.push({ x: px, y: py, a: angle, d: depth }); depth++; }
    else if (c === "]") { const s = stk.pop()!; px = s.x; py = s.y; angle = s.a; depth = s.d; }
  }

  // Fit bounding box into SVG canvas
  let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
  for (const s of segs) {
    bx0 = Math.min(bx0, s.x1, s.x2); bx1 = Math.max(bx1, s.x1, s.x2);
    by0 = Math.min(by0, s.y1, s.y2); by1 = Math.max(by1, s.y1, s.y2);
  }
  const PAD = 20, GPAD = 28;
  const scale = Math.min((W - 2 * PAD) / (bx1 - bx0), (H - 2 * PAD - GPAD) / (by1 - by0));
  const ox = W / 2;            // trunk base (turtle x=0) maps to canvas centre
  const oy = PAD - by0 * scale;
  const sx = (v: number) => v * scale + ox;
  const sy = (v: number) => v * scale + oy;

  const maxD = Math.max(...segs.map(s => s.d));
  // Color: brown bark (#8B5E3C) → green tips (#8DC46C)
  const color = (d: number) => {
    const t = d / maxD;
    return `rgb(${Math.round(139 + 2 * t)},${Math.round(94 + 102 * t)},${Math.round(60 + 48 * t)})`;
  };
  // Width tapers with depth
  const strokeW = (d: number) => Math.max(0.8, 5.5 * Math.pow(1 - d / maxD, 1.4));

  const groundY = sy(by1) + 14;
  const glowCY = sy(by0 + (by1 - by0) * 0.45);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none"
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="L-system fractal tree">
      <defs>
        <radialGradient id="canopy-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(141,196,108,0.4)" />
          <stop offset="65%" stopColor="rgba(141,196,108,0.15)" />
          <stop offset="100%" stopColor="rgba(141,196,108,0)" />
        </radialGradient>
      </defs>
      {/* Canopy glow */}
      <ellipse cx={W / 2} cy={glowCY} rx={145} ry={115} fill="url(#canopy-glow)" />
      {/* Ground shadow */}
      <ellipse cx={W / 2} cy={groundY} rx={65} ry={8} fill="rgba(74,124,47,0.2)" />
      {/* Branches */}
      {segs.map((s, i) => (
        <line key={i} x1={sx(s.x1)} y1={sy(s.y1)} x2={sx(s.x2)} y2={sy(s.y2)}
          stroke={color(s.d)} strokeWidth={strokeW(s.d)} strokeLinecap="round" />
      ))}
      {/* Leaf dots at branch tips */}
      {segs.filter(s => s.d >= maxD - 1).map((s, i) => (
        <circle key={i} cx={sx(s.x2)} cy={sy(s.y2)} r={2.5} fill="rgba(141,196,108,0.65)" />
      ))}
    </svg>
  );
}
