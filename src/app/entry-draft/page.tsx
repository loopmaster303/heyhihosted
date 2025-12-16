"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import PageLoader from '@/components/ui/PageLoader';
import { useTypewriter } from '@/hooks/useTypewriter';
import { ChevronUp, Mic, Plus, Send, Settings2, Sparkles } from 'lucide-react';

type LandingMode = 'chat' | 'visualize';

function EntryDraftPageContent() {
  const router = useRouter();
  const [userDisplayName] = useLocalStorageState<string>('userDisplayName', 'user');

  const [isClient, setIsClient] = useState(false);
  const [mode, setMode] = useState<LandingMode>('chat');
  const [draftPrompt, setDraftPrompt] = useState('');
  const [phase, setPhase] = useState<'idle' | 'transitioning'>('idle');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const targetLine = useMemo(() => {
    const safeName = ((userDisplayName || 'user').trim() || 'user').toLowerCase();
    return `(!hey.hi = '${safeName}')`;
  }, [userDisplayName]);

  const { displayedText, isTyping, isComplete } = useTypewriter({
    text: targetLine,
    speed: 55,
    delay: 150,
    skipAnimation: !isClient,
  });

  const canSubmit = draftPrompt.trim().length > 0 && phase === 'idle';

  const placeholder =
    mode === 'chat'
      ? 'Worüber möchtest du sprechen?'
      : 'Beschreib deine Idee – vielseitig, schnell, gut für Drafts, Skizzen, Comics, Manga und fotorealistische Experimente.';

  const rightCtaLabel = mode === 'chat' ? 'Senden' : 'Generate';
  const rightModelLabel = mode === 'chat' ? 'Claude' : 'GPT-Image';

  const beginTransitionAndNavigate = useCallback(() => {
    if (!canSubmit) return;

    setPhase('transitioning');

    const encoded = encodeURIComponent(draftPrompt.trim());
    const href = mode === 'chat' ? `/chat?draft=${encoded}` : `/visualizepro?draft=${encoded}`;

    // Allow the “container down” animation to play before route change.
    window.setTimeout(() => {
      router.push(href);
    }, 520);
  }, [canSubmit, draftPrompt, mode, router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On landing we do NOT auto-send on Enter; user explicitly clicks Send/Generate.
    // But we keep Enter behavior available for multiline.
    if (e.key === 'Enter' && !e.shiftKey) {
      // Let it insert newline (don’t preventDefault).
    }
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
      <div className="relative flex flex-col items-center justify-center h-full px-4 py-10 overflow-hidden">
        {/* Background hints (visualize) */}
        {mode === 'visualize' && (
          <>
            <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
              <div className="absolute top-[44%] left-[14%] font-code text-3xl sm:text-4xl text-foreground/60">Prompt und</div>
              <div className="absolute top-[52%] left-[14%] font-code text-3xl sm:text-4xl text-foreground/60">Modelvorschlag</div>
              <div className="absolute top-[44%] right-[14%] font-code text-3xl sm:text-4xl text-foreground/60 text-right">Prompt und</div>
              <div className="absolute top-[52%] right-[14%] font-code text-3xl sm:text-4xl text-foreground/60 text-right">Modelvorschlag</div>
              <div className="absolute top-[60%] left-1/2 -translate-x-1/2 font-code text-3xl sm:text-4xl text-foreground/60 text-center">Prompt und</div>
              <div className="absolute top-[68%] left-1/2 -translate-x-1/2 font-code text-3xl sm:text-4xl text-foreground/60 text-center">Modelvorschlag</div>
            </div>
          </>
        )}

        <div
          className={cn(
            'relative w-full max-w-4xl flex flex-col items-center transition-transform duration-500 ease-out',
            phase === 'transitioning' && 'translate-y-16 opacity-90'
          )}
        >
          {/* Hero / Typewriter */}
          <div className="mb-6 font-code text-4xl sm:text-5xl md:text-6xl font-bold text-center">
            <span className="text-transparent bg-gradient-to-r bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, hsl(330 70% 75%), hsl(330 65% 62%))' }}>
              {displayedText}
              {isTyping && <span className="animate-pulse">|</span>}
            </span>
          </div>

          {/* Toggle line */}
          {isComplete && (
            <div className="mb-6 text-center text-muted-foreground/80 text-base sm:text-lg">
              <span>Hier </span>
              <button
                onClick={() => setMode('chat')}
                className={cn(
                  'px-3 py-1 rounded-md border transition-colors',
                  mode === 'chat'
                    ? 'border-primary/80 text-foreground shadow-[0_0_0_1px_rgba(232,154,184,0.35)]'
                    : 'border-border/60 hover:border-primary/40'
                )}
              >
                Chatten
              </button>
              <span> und da </span>
              <button
                onClick={() => setMode('visualize')}
                className={cn(
                  'px-3 py-1 rounded-md border transition-colors',
                  mode === 'visualize'
                    ? 'border-primary/80 text-foreground shadow-[0_0_0_1px_rgba(232,154,184,0.35)]'
                    : 'border-border/60 hover:border-primary/40'
                )}
              >
                Visualisieren
              </button>
            </div>
          )}

          {/* Prompt Card */}
          {isComplete && (
            <div className="w-full relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-white/10 to-white/10 rounded-[2rem] blur opacity-30" />
              <div className="relative bg-muted/40 backdrop-blur-xl border border-border/50 rounded-[2rem] p-3 sm:p-4 shadow-lg">
                <Textarea
                  value={draftPrompt}
                  onChange={(e) => setDraftPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="w-full bg-transparent border-none shadow-none resize-none placeholder:text-muted-foreground focus-visible:ring-0 p-2 min-h-[70px] max-h-[220px]"
                  style={{ lineHeight: '1.5rem', fontSize: '16px' }}
                  disabled={phase === 'transitioning'}
                />

                <div className="flex w-full items-center justify-between gap-2 mt-2">
                  {/* Left cluster (dummies for now) */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-lg h-12 w-12 text-muted-foreground hover:text-foreground"
                      disabled
                      aria-label="Quick settings"
                    >
                      <Settings2 className="w-5 h-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-lg h-12 w-12 text-muted-foreground hover:text-foreground"
                      disabled
                      aria-label="Plus"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-lg h-12 px-3 text-muted-foreground hover:text-foreground"
                      disabled
                      aria-label="Tools"
                    >
                      <span className="text-sm font-medium">Tools</span>
                      <ChevronUp className="w-3 h-3 opacity-60 ml-1" />
                    </Button>
                  </div>

                  {/* Right cluster */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-lg h-12 px-3 text-muted-foreground hover:text-foreground"
                      disabled
                      aria-label="Model"
                    >
                      <span className="text-sm font-medium">{rightModelLabel}</span>
                      <ChevronUp className="w-3 h-3 opacity-60 ml-1" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-lg h-12 w-12 text-muted-foreground hover:text-foreground"
                      disabled={mode === 'visualize'}
                      aria-label="Mic"
                    >
                      <Mic className="w-5 h-5" />
                    </Button>

                    {mode === 'visualize' && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-lg h-12 px-3 text-muted-foreground hover:text-foreground"
                        disabled
                        aria-label="Enhance"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Enhance</span>
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={beginTransitionAndNavigate}
                      className={cn(
                        'rounded-lg h-12 w-12',
                        canSubmit ? 'text-blue-500 hover:text-blue-600' : 'text-muted-foreground'
                      )}
                      disabled={!canSubmit}
                      aria-label={rightCtaLabel}
                    >
                      <Send className="w-6 h-6" />
                    </Button>
                  </div>
                </div>

                {/* Suggestions (optional, currently lightweight dummies) */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {(mode === 'chat'
                    ? ['Schnell ein Bild her!', 'Hey Hi?', 'Etwas schreiben', 'Coding']
                    : ['Prompt und Modelvorschlag', 'Noch ein Vorschlag', 'Stil: Cinematic'])
                    .slice(0, 4)
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDraftPrompt((p) => (p ? p + ' ' + s : s))}
                        className="bg-muted/40 hover:bg-muted/70 text-xs md:text-sm px-3 py-1.5 rounded-lg text-muted-foreground transition-colors text-left"
                        disabled={phase === 'transitioning'}
                      >
                        {s}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default function EntryDraftPage() {
  return <EntryDraftPageContent />;
}
