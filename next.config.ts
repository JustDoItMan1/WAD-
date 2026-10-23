import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Stops Next from treating a package-lock.json in a parent folder as the project root
  turbopack: { root: process.cwd() },
};

export default nextConfig;
