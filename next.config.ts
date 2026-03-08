import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark native Node.js packages as external so they aren't bundled
  serverExternalPackages: ["ssh2-sftp-client", "ssh2", "ws"],

  // Use empty turbopack config to silence the webpack/turbopack mismatch warning
  turbopack: {},
};

export default nextConfig;
