/* eslint-disable @next/next/no-page-custom-font */

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/ThemeProvider';
import { LanguageProvider } from '@/components/LanguageProvider';

export const metadata: Metadata = {
  title: 'hey.hi · local-first AI workspace',
  description: 'Chat und Create in einer Fläche: Text, Stimme, Bild, Video und Sound über viele Modelle. Deine Daten bleiben in deinem Browser.',
  keywords: ['local-first AI workspace', 'privacy-first multi-model chat', 'AI image and video generation'],
  applicationName: 'hey.hi',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'hey.hi',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
};

/**
 * `viewport-fit=cover` laesst die App bis unter Notch und Home-Indikator
 * reichen; Kopfzeile, Eingabe und Sheets halten mit env(safe-area-inset-*)
 * Abstand. Die Statusleiste nimmt die Farbe des Themas an.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e9dff8' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a10' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Code&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
            <Toaster />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
