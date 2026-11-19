import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the file-tracing root to this project. Other lockfiles exist higher up
  // the user's home directory, and without this Next infers the wrong root.
  outputFileTracingRoot: projectRoot,
  // Content Fragment images render with a plain <img> (publish renditions)
  // rather than next/image, so no remotePatterns config is needed.
};

export default nextConfig;
