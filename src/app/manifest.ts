import type { MetadataRoute } from 'next';

/**
 * Vom Homescreen startet hey.hi als eigenstaendige App, nicht als Browser-Tab.
 * Kein Service Worker: Offline-Faehigkeit waere ein eigenes Projekt, und ein
 * falsch cachender Worker ist schwerer loszuwerden als gar keiner.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'hey.hi',
    short_name: 'hey.hi',
    description: 'Chat und Create in einer Fläche. Deine Daten bleiben in deinem Browser.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0c0a10',
    theme_color: '#0c0a10',
    lang: 'de',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
