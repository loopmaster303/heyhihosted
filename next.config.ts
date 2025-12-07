import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
        hostname: 'replicate.delivery',
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
  allowedDevOrigins: [
    'https://9000-firebase-studio-1750029856915.cluster-6frnii43o5blcu522sivebzpii.cloudworkstations.dev',
    'https://6000-firebase-studio-1750029856915.cluster-6frnii43o5blcu522sivebzpii.cloudworkstations.dev',
  ],
};

export default nextConfig;
