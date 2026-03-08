import Link from "next/link";

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
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
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
            <span
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
              {icon} {label}
            </span>
          ))}
        </div>
      </section>

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

// Pure SVG fractal tree illustration
function FractalTreeSVG() {
  return (
    <svg
      width="320"
      height="400"
      viewBox="0 0 320 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Fractal tree illustration"
    >
      {/* Ground */}
      <ellipse cx="160" cy="385" rx="80" ry="10" fill="rgba(74,124,47,0.15)" />

      {/* Trunk */}
      <line x1="160" y1="385" x2="160" y2="280" stroke="#8B5E3C" strokeWidth="8" strokeLinecap="round" />

      {/* Level 1 branches */}
      <line x1="160" y1="280" x2="120" y2="230" stroke="#8B5E3C" strokeWidth="5" strokeLinecap="round" />
      <line x1="160" y1="280" x2="200" y2="230" stroke="#8B5E3C" strokeWidth="5" strokeLinecap="round" />
      <line x1="160" y1="280" x2="160" y2="220" stroke="#8B5E3C" strokeWidth="5" strokeLinecap="round" />

      {/* Level 2 branches - left */}
      <line x1="120" y1="230" x2="95" y2="195" stroke="#72ab54" strokeWidth="3" strokeLinecap="round" />
      <line x1="120" y1="230" x2="140" y2="195" stroke="#72ab54" strokeWidth="3" strokeLinecap="round" />
      {/* Level 2 branches - centre */}
      <line x1="160" y1="220" x2="140" y2="185" stroke="#72ab54" strokeWidth="3" strokeLinecap="round" />
      <line x1="160" y1="220" x2="180" y2="185" stroke="#72ab54" strokeWidth="3" strokeLinecap="round" />
      <line x1="160" y1="220" x2="160" y2="180" stroke="#72ab54" strokeWidth="3" strokeLinecap="round" />
      {/* Level 2 branches - right */}
      <line x1="200" y1="230" x2="180" y2="195" stroke="#72ab54" strokeWidth="3" strokeLinecap="round" />
      <line x1="200" y1="230" x2="220" y2="195" stroke="#72ab54" strokeWidth="3" strokeLinecap="round" />

      {/* Level 3 branches */}
      {[
        [95, 195, 78, 170], [95, 195, 108, 168],
        [140, 195, 125, 168], [140, 195, 152, 168],
        [140, 185, 126, 160], [140, 185, 150, 158],
        [180, 185, 166, 160], [180, 185, 192, 158],
        [160, 180, 148, 155], [160, 180, 172, 155], [160, 180, 160, 150],
        [180, 195, 168, 168], [180, 195, 194, 168],
        [220, 195, 208, 168], [220, 195, 232, 168],
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#8dc46c"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}

      {/* Leaf clusters */}
      {[
        [78, 162], [108, 160], [125, 160], [152, 160],
        [126, 152], [150, 150], [148, 147], [160, 142],
        [172, 147], [166, 152], [192, 150], [168, 160],
        [194, 160], [208, 160], [232, 160],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <ellipse
            cx={cx} cy={cy}
            rx={10 + (i % 3) * 2}
            ry={8 + (i % 2) * 2}
            fill={`rgba(${i % 2 ? "141,196,108" : "72,171,84"},0.${5 + (i % 4)})`}
          />
        </g>
      ))}

      {/* Glow effect */}
      <radialGradient id="glow" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stopColor="rgba(141,196,108,0.15)" />
        <stop offset="100%" stopColor="rgba(141,196,108,0)" />
      </radialGradient>
      <ellipse cx="160" cy="180" rx="130" ry="120" fill="url(#glow)" />
    </svg>
  );
}
