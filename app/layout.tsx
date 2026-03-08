import type { Metadata } from "next";
import { Merriweather, Inter } from "next/font/google";
import "./globals.css";

const merriweather = Merriweather({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-merriweather",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fractal Forest — Procedural Plant Generator",
  description:
    "Generate 3D fractal plants and trees from descriptions or biomes, then place them in your Manifold Fabric scene.",
  keywords: ["procedural", "L-system", "3D plants", "GLB", "Manifold", "fractal trees"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${merriweather.variable} ${inter.variable}`}>
      <body className="antialiased">
        <nav
          style={{
            borderBottom: "1px solid rgba(74,124,47,0.25)",
            background: "rgba(13,26,7,0.8)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0.75rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <a
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
                color: "var(--forest-200)",
                fontFamily: "var(--font-merriweather)",
                fontWeight: 700,
                fontSize: "1.1rem",
              }}
            >
              <TreeIcon />
              Fractal Forest
            </a>
            <a
              href="/generate"
              className="btn-primary"
              style={{ fontSize: "0.875rem", padding: "0.4rem 1rem" }}
            >
              Grow Plants
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}

function TreeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--forest-400)" }}
    >
      <path d="M12 22V13" />
      <path d="M12 13L7 8" />
      <path d="M12 13L17 8" />
      <path d="M12 8L8 4" />
      <path d="M12 8L16 4" />
      <path d="M9 22h6" />
    </svg>
  );
}
