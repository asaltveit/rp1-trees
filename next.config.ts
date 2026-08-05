import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript 7 uses the CLI instead of the legacy compiler API
  experimental: {
    useTypeScriptCli: true,
  },

  // Mark native Node.js packages as external so they aren't bundled
  serverExternalPackages: ["ssh2-sftp-client", "ssh2", "ws"],

  // Use empty turbopack config to silence the webpack/turbopack mismatch warning
  turbopack: {},
};

export default nextConfig;
