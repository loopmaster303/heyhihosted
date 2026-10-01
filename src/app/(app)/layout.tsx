import { Suspense } from 'react';
import { AppShell } from '@/components/shell/AppShell';

/**
 * Chat und Create teilen sich diese eine Huelle. Das Layout bleibt beim
 * Wechsel zwischen `/` und `/create` gemountet — darum ueberleben Eingabe,
 * Verlauf und laufende Generierungen den Raumwechsel. Die Seiten selbst
 * tragen nur ihre Metadaten; was sichtbar ist, entscheidet AppShell.
 *
 * Suspense, weil AppShell `useSearchParams` liest (offenes Sheet in ?panel=).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="h-[100dvh] bg-background" aria-busy="true" />}>
        <AppShell />
      </Suspense>
      {children}
    </>
  );
}
