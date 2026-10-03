import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import AboutScrollContainer from '@/components/page/about/AboutScrollContainer';

export const metadata = {
  title: 'Über hey.hi',
  description: 'Was hey.hi ist, wie es funktioniert und warum deine Daten im Browser bleiben.',
};

/**
 * Die einzige Seite ausserhalb der Huelle. Sie braucht keinen Chat-Zustand —
 * frueher lud sie trotzdem alle Unterhaltungen aus IndexedDB, nur um eine
 * Seitenleiste zu zeichnen.
 */
export default function AboutPage() {
  return (
    <ErrorBoundary
      fallbackTitle="Die Seite konnte nicht geladen werden"
      fallbackMessage="Es gab ein Problem beim Laden. Bitte versuche es erneut."
    >
      <div className="min-h-[100dvh] bg-background text-foreground">
        <header className="sticky top-0 z-10 flex items-center border-b border-border/60 bg-background/85 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-xl">
          <Link
            href="/"
            className="press inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Zurück zu hey.hi
          </Link>
        </header>
        <main className="flex flex-col py-6 md:py-10">
          <AboutScrollContainer />
        </main>
      </div>
    </ErrorBoundary>
  );
}
