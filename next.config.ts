import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Kein output: 'export' - normal Server-Build */
  turbopack: {
    root: process.cwd(),
  },
  // Dev-only: reaching the dev server over a Tailscale or LAN address instead of
  // localhost makes Next block /_next/* requests as cross-origin. The page still
  // loads, but lazily fetched chunks fail, which surfaces as a ChunkLoadError
  // and a full page reload. Has no effect on production builds.
  allowedDevOrigins: [
    '100.86.170.47',
    '172.20.10.8',
    '9000-firebase-studio-1750029856915.cluster-6frnii43o5blcu522sivebzpii.cloudworkstations.dev',
    '6000-firebase-studio-1750029856915.cluster-6frnii43o5blcu522sivebzpii.cloudworkstations.dev',
    '172.20.10.14',
    '10.90.74.88',
    'localhost',
    'macbook-air-von-john.tail898c40.ts.net',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gen.pollinations.ai',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.pollinations.ai',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'enter.pollinations.ai',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      }
    ],
  },

};

export default nextConfig;
