import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Kein output: 'export' - normal Server-Build */
  turbopack: {
    root: process.cwd(),
  },
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
  // Next vergleicht nur den HOSTNAMEN der anfragenden Herkunft — Schema und Port
  // sieht der Abgleich nie. Eintraege wie 'http://host:3000' matchen deshalb
  // nichts. Und sobald diese Liste ueberhaupt gesetzt ist, blockiert Next
  // fremde Herkuenfte, statt nur zu warnen: jede /_next/*-Anfrage bekommt 403,
  // die Seite laedt ihr HTML und stirbt dann beim Hydrieren mit
  // "Application error: a client-side exception has occurred".
  allowedDevOrigins: [
    '9000-firebase-studio-1750029856915.cluster-6frnii43o5blcu522sivebzpii.cloudworkstations.dev',
    '6000-firebase-studio-1750029856915.cluster-6frnii43o5blcu522sivebzpii.cloudworkstations.dev',
    '172.20.10.14',   // LAN
    '10.90.74.88',    // LAN (aktuelles Netz)
    '100.86.170.47',  // Tailscale, dieser Mac
  ],
};

export default nextConfig;
