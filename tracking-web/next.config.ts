import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'standalone',
  // This is intentionally an independent Next.js app nested in the API repo.
  outputFileTracingRoot: path.join(__dirname)
};

export default nextConfig;
