"use client";

import { useState } from "react";
import type { ManifoldConfig } from "@/lib/types";

interface ManifoldConnectionFormProps {
  config: ManifoldConfig;
  onChange: (config: ManifoldConfig) => void;
}

export default function ManifoldConnectionForm({ config, onChange }: ManifoldConnectionFormProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [showScp, setShowScp] = useState(false);

  function update(field: keyof ManifoldConfig, value: string) {
    onChange({ ...config, [field]: value });
    setTestResult(null);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fabricUrl: config.fabricUrl, adminKey: config.adminKey }),
      });
      const result = await res.json();
      setTestResult(result);
    } catch {
      setTestResult({ ok: false, error: "Network error" });
    } finally {
      setTesting(false);
    }
  }

  const field = (
    id: keyof ManifoldConfig,
    label: string,
    placeholder: string,
    type = "text"
  ) => (
    <div key={id}>
      <label className="label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        className="input"
        placeholder={placeholder}
        value={config[id]}
        onChange={(e) => update(id, e.target.value)}
        autoComplete="off"
      />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Fabric connection */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {field("fabricUrl", "Fabric URL", "wss://your-fabric.example.com")}
        {field("adminKey", "Admin Key", "your-admin-key", "password")}
        {field("sceneName", "Scene Name", "My Scene")}
      </div>

      {/* Test connection */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleTest}
          disabled={testing || !config.fabricUrl}
          style={{ fontSize: "0.8rem", padding: "0.35rem 0.875rem" }}
        >
          {testing ? "Testing…" : "Test Connection"}
        </button>
        {testResult && (
          <span
            style={{
              fontSize: "0.8rem",
              color: testResult.ok ? "var(--forest-400)" : "#f87171",
            }}
          >
            {testResult.ok ? "✓ Reachable" : `✗ ${testResult.error ?? "Failed"}`}
          </span>
        )}
      </div>

      {/* SCP / SFTP section (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowScp(!showScp)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--forest-500)",
            fontSize: "0.8rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: 0,
          }}
        >
          <span style={{ transform: showScp ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>▶</span>
          File Transfer (SFTP)
        </button>

        {showScp && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.875rem",
              marginTop: "0.875rem",
              paddingTop: "0.875rem",
              borderTop: "1px solid rgba(74,124,47,0.2)",
            }}
          >
            {field("scpHost", "SFTP Host", "files.example.com")}
            {field("scpUser", "SFTP User", "username")}
            {field("scpPassword", "SFTP Password", "••••••••", "password")}
            {field("scpRemotePath", "Remote Path", "/var/www/resources")}
            {field("resourceUrlPrefix", "Public URL Prefix", "https://files.example.com/resources/")}
          </div>
        )}
      </div>
    </div>
  );
}
