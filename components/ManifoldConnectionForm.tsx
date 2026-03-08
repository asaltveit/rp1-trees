"use client";

import { useState } from "react";
import type { ManifoldConfig } from "@/lib/types";

interface ManifoldConnectionFormProps {
  config: ManifoldConfig;
  outputMode: "manifold" | "download";
  onOutputModeChange: (mode: "manifold" | "download") => void;
  onChange: (config: ManifoldConfig) => void;
}

export default function ManifoldConnectionForm({
  config,
  outputMode,
  onOutputModeChange,
  onChange,
}: ManifoldConnectionFormProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [showConnectionOptions, setShowConnectionOptions] = useState(!config.fabricUrl);
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
        body: JSON.stringify({ manifoldConfig: config }),
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
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label className="label" htmlFor="output-mode">Output Option</label>
        <select
          id="output-mode"
          className="input"
          value={outputMode}
          onChange={(e) => onOutputModeChange(e.target.value as "manifold" | "download")}
        >
          <option value="manifold">Place in Manifold Scene</option>
          <option value="download">Download GLB File(s)</option>
        </select>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--forest-600)" }}>
          {outputMode === "manifold"
            ? "Uploads and places objects in your connected Manifold scene."
            : "Generates objects you can download directly from the result cards."}
        </p>
      </div>

      {outputMode === "manifold" && (
        <div>
          <button
            type="button"
            onClick={() => setShowConnectionOptions(!showConnectionOptions)}
            aria-expanded={showConnectionOptions}
            aria-controls="manifold-options-panel"
            style={{
              width: "100%",
              background: "rgba(13,26,7,0.65)",
              border: "1px solid rgba(74,124,47,0.4)",
              borderRadius: "0.5rem",
              cursor: "pointer",
              color: "var(--forest-200)",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "0.6rem 0.75rem",
            }}
          >
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {config.fabricUrl ? `Connection: ${config.fabricUrl}` : "Connection: Not configured"}
            </span>
            <span
              aria-hidden="true"
              style={{
                transform: showConnectionOptions ? "rotate(180deg)" : "none",
                transition: "transform 0.15s",
                color: "var(--forest-500)",
                flexShrink: 0,
              }}
            >
              ▼
            </span>
          </button>
        </div>
      )}

      {outputMode === "manifold" && showConnectionOptions && (
        <div
          id="manifold-options-panel"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            paddingTop: "0.5rem",
          }}
        >
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
              disabled={testing || !config.fabricUrl || !config.sceneName}
              style={{ fontSize: "0.8rem", padding: "0.35rem 0.875rem" }}
            >
              {testing ? "Testing…" : "Test Connection"}
            </button>
            <span
              aria-live="polite"
              style={{
                fontSize: "0.8rem",
                color: testResult?.ok ? "var(--forest-400)" : "#f87171",
              }}
            >
              {testResult && (testResult.ok ? "✓ Connection validated" : `✗ ${testResult.error ?? "Failed"}`)}
            </span>
          </div>

          {/* SCP / SFTP section (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setShowScp(!showScp)}
              aria-expanded={showScp}
              aria-controls="sftp-panel"
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
              <span aria-hidden="true" style={{ transform: showScp ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>▶</span>
              File Transfer (SFTP)
            </button>

            {showScp && (
              <div
                id="sftp-panel"
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
      )}
    </div>
  );
}
