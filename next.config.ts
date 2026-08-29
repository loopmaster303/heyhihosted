import type { NextConfig } from 'next';

const CREATE_HOST = 'create.hey-hi.cloud';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Report-only first: collect violations before enforcing a CSP. The app
  // embeds user-generated media from many hosts, so an enforcing CSP needs
  // its allowlist validated against real traffic.
  {
    key: 'Content-Security-Policy-Report-Only',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https:",
  },
];

const nextConfig: NextConfig = {
  /* Kein output: 'export' - normal Server-Build */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  /* Kein output: 'export' - normal Server-Build */
  turbopack: {
    root: process.cwd(),
  },
  // Zwei unabhängige Umleitungen:
  //
  // 1. Der alte Routenpfad. Create liegt seit 2026-08-29 unter '/create';
  //    '/playground' war die Adresse davor und steht in Lesezeichen und in
  //    geteilten Links. permanent: false, damit eine spätere Korrektur nicht
  //    in fremden Browser-Caches festhängt.
  //
  // 2. create.hey-hi.cloud -> chat.hey-hi.cloud/create. Ein Redirect statt eines
  //    Rewrites, damit Chat und Create denselben Browser-Ursprung teilen (IndexedDB /
  //    localStorage sind pro Ursprung getrennt). Reihenfolge zählt: '/' muss vor
  //    '/:path*' stehen. Greift nur unter dem echten Host — localhost und
  //    Preview-Deployments bleiben unberührt. Die Domain existiert heute nicht
  //    (NXDOMAIN, geprüft 2026-08-29); die Regeln liegen bereit, falls sie kommt.
  async redirects() {
    return [
      {
        source: '/playground',
        destination: '/create',
        permanent: false,
      },
      {
        source: '/',
        has: [{ type: 'host', value: CREATE_HOST }],
        destination: 'https://chat.hey-hi.cloud/create',
        permanent: false,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: CREATE_HOST }],
        destination: 'https://chat.hey-hi.cloud/:path*',
        permanent: false,
      },
    ];
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
