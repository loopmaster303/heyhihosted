"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import PageLoader from '@/components/ui/PageLoader';

function EntryDraftPageContent() {
  const router = useRouter();
  const [userDisplayName] = useLocalStorageState<string>('userDisplayName', 'user');
  const [mode, setMode] = useState<'chat' | 'visualize'>('chat');
  const [typed, setTyped] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const targetLine = "(!hey.hi = '" + ((userDisplayName || 'user').trim() || 'user') + "')";

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Simplified typewriter effect
  useEffect(() => {
    if (!isClient) return;

    setIsTyping(true);
    setIsTypingComplete(false);
    setTyped('');

    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      setTyped(targetLine.slice(0, idx));
      if (idx >= targetLine.length) {
        clearInterval(timer);
        setIsTyping(false);
        setIsTypingComplete(true);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [isClient, targetLine]);

  const handleNavigate = () => {
    router.push(mode === 'chat' ? '/chat' : '/visualizepro');
  };

  if (!isClient) {
    return <PageLoader text="Lade Startseite..." />;
  }

  return (
    <AppLayout
      onNewChat={() => { }}
      onToggleHistoryPanel={() => { }}
      onToggleGalleryPanel={() => { }}
      currentPath="/"
      chatHistory={[]}
      onSelectChat={() => { }}
      onRequestEditTitle={() => { }}
      onDeleteChat={() => { }}
      isHistoryPanelOpen={false}
      isGalleryPanelOpen={false}
      allConversations={[]}
      activeConversation={null}
    >
      <div className="flex flex-col items-center justify-center h-full px-4 py-10">
        {/* Typewriter-Effekt */}
        <div className="mb-10 font-code text-4xl sm:text-5xl md:text-6xl font-bold text-center">
          <span className="text-transparent bg-gradient-to-r from-purple-300 to-purple-600 bg-clip-text">
            {typed}
            {isTyping && <span className="animate-pulse">|</span>}
          </span>
        </div>

        {/* Modus-Toggle - nur wenn Typewriter komplett */}
        {isTypingComplete && (
          <>
            <div className="flex gap-4 mb-8">
              <button
                className={cn(
                  'px-6 py-2 rounded-full text-sm font-medium transition border-2',
                  mode === 'chat'
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 dark:shadow-primary/50 dark:shadow-primary/30'
                    : 'bg-muted/50 text-foreground/60 border-transparent hover:border-primary/50 dark:hover:border-primary/70 dark:bg-muted/30 dark:hover:bg-muted/40'
                )}
                onClick={() => setMode('chat')}
              >
                Gespräch
              </button>
              <button
                className={cn(
                  'px-6 py-2 rounded-full text-sm font-medium transition border-2',
                  mode === 'visualize'
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 dark:shadow-primary/50 dark:shadow-primary/30'
                    : 'bg-muted/50 text-foreground/60 border-transparent hover:border-primary/50 dark:hover:border-primary/70 dark:bg-muted/30 dark:hover:bg-muted/40'
                )}
                onClick={() => setMode('visualize')}
              >
                Visualisieren
              </button>
            </div>

            {/* Platzhalter-Text */}
            <div className="mb-8 text-center text-muted-foreground max-w-md">
              {mode === 'chat' ? (
                <>
                  Worüber möchtest du sprechen?
                  <br /><br />
                  Ob man es nun KI, Künstliche Intelligenz oder Artificial Intelligence nennt - am Ende ist es einfach nur ein Computerprogramm. Und nein, davor muss man absolut keine Angst haben!
                  Zwar schreibt und spricht eine KI oft verblüffend ähnlich wie ein echter Mensch, aber im Kern bleibt sie eine Maschine. Sie ist ein Werkzeug, das über unsere ganz normale Sprache Zugriff auf Wissen und Fähigkeiten aus der ganzen Welt bietet.
                  Sag Hey. Hi zur AI
                </>
              ) : (
                <>
                  Was möchtest du erschaffen?
                  <br /><br />
                  Die Künstliche Intelligenz kann nicht nur via Text mit dir kommunizieren, sie kann auch Kunst. Über ganz normale Sprache kannst du Bilder erschaffen – und dabei gibt es keine Limits.
                  Du musst dafür keinen Pinsel in die Hand nehmen: Beschreibe einfach deine Idee und lass die KI deine Gedanken direkt sichtbar machen. Egal wie verrückt deine Vorstellung ist, sag es der Maschine und sieh zu, wie dein Bild entsteht.
                </>
              )}
            </div>

            {/* Los geht's Button */}
            <button
              onClick={handleNavigate}
              className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90"
            >
              {"Los geht's"}
            </button>
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default function EntryDraftPage() {
  return (
    <EntryDraftPageContent />
  );
}
