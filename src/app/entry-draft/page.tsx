"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import useLocalStorageState from '@/hooks/useLocalStorageState';

const quickChatPrompts = {
  de: [
    'Fasse die wichtigsten Schlagzeilen von heute in 2 Sätzen zusammen.',
    'Erkläre mir in einfachen Worten, wie Quantencomputer funktionieren.',
    'Gib mir 3 Ideen für ein Wochenende in Berlin, Indoor & Outdoor gemischt.',
  ],
  en: [
    'Summarize today’s top headlines in two sentences.',
    'Explain quantum computers in simple words.',
    'Give me 3 ideas for a weekend in Berlin, mixed indoor & outdoor.',
  ],
};

const quickVisualPrompts = {
  de: [
    'Hochformat-Portrait einer Person im warmen Studiolicht, analoger Look, 50mm.',
    'Weitwinkel-Stadtansicht bei Sonnenaufgang, leichter Nebel, Pastellfarben, 16:9.',
    'Cinematic Produktshot eines Smartphones auf Marmortisch, weiches Rim-Light, 3:2.',
  ],
  en: [
    'Portrait, warm studio light, analog look, 50mm, shoulder-up, soft background.',
    'Wide cityscape at sunrise with light fog, pastel palette, 16:9.',
    'Cinematic product shot of a smartphone on marble, soft rim light, 3:2.',
  ],
};

export default function EntryDraftPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [userDisplayName] = useLocalStorageState<string>('userDisplayName', 'user');
  const isGerman = language === 'de';
  const [mode, setMode] = useState<'chat' | 'visualize'>('chat');
  const [prompt, setPrompt] = useState('');
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<'idle' | 'typing' | 'ready'>('idle');
  const targetLine = useMemo(
    () => `(!hey.hi = '${(userDisplayName || 'user').trim() || 'user'}')`,
    [userDisplayName]
  );

  const chips = useMemo(() => {
    const lang = isGerman ? 'de' : 'en';
    return mode === 'chat' ? quickChatPrompts[lang] : quickVisualPrompts[lang];
  }, [isGerman, mode]);

  useEffect(() => {
    setPrompt('');
  }, [mode]);

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    try {
      localStorage.setItem('sidebar-preload-prompt', prompt.trim());
      localStorage.setItem('sidebar-preload-target', mode);
    } catch {}
    const event = new CustomEvent('sidebar-reuse-prompt', { detail: prompt.trim() });
    window.dispatchEvent(event);
    router.push(mode === 'chat' ? '/chat' : '/visualizepro');
  };

  // Delay then type full line
  useEffect(() => {
    if (phase === 'idle') {
      const delay = setTimeout(() => setPhase('typing'), 5000);
      return () => clearTimeout(delay);
    }
    if (phase !== 'typing') return;
    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      setTyped(targetLine.slice(0, idx));
      if (idx >= targetLine.length) {
        clearInterval(timer);
        setTimeout(() => setPhase('ready'), 800);
      }
    }, 200);
    return () => clearInterval(timer);
  }, [phase, targetLine]);

  return (
    <AppLayout>
      <div className="relative flex flex-col items-center justify-center h-full px-4 py-10 overflow-hidden">
        {/* Typewriter overlay */}
        {phase !== 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm">
            <div className="font-code text-4xl sm:text-5xl md:text-6xl font-bold text-foreground drop-shadow-[0_0_16px_rgba(255,105,180,0.55)]">
              <span className="text-transparent bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text">
                {typed}
              </span>
              <span className="animate-pulse text-foreground">|</span>
            </div>
          </div>
        )}

        {/* Persistent typed line */}
        {phase === 'ready' && (
          <div className="mb-10 font-code text-4xl sm:text-5xl md:text-6xl font-bold text-center text-foreground drop-shadow-[0_0_20px_rgba(255,105,180,0.65)]">
            <span className="text-transparent bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text">
              {targetLine}
            </span>
          </div>
        )}

        <div
          className={cn(
            "max-w-2xl w-full bg-card/60 border border-border rounded-3xl shadow-2xl p-6 space-y-6 transition-all duration-300",
            phase === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
          )}
        >
          <div className="flex items-center justify-center gap-3">
            <button
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition',
                mode === 'chat' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/80'
              )}
              onClick={() => setMode('chat')}
            >
              {isGerman ? 'Gespräch' : 'Chat'}
            </button>
            <button
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition',
                mode === 'visualize' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/80'
              )}
              onClick={() => setMode('visualize')}
            >
              {isGerman ? 'Visualisieren' : 'Visualize'}
            </button>
          </div>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === 'chat'
                ? isGerman
                  ? 'Worüber möchtest du sprechen?'
                  : 'What do you want to talk about?'
                : isGerman
                ? 'Beschreibe, was du sehen willst...'
                : 'Describe what you want to see...'
            }
            className="min-h-[140px] bg-background/80"
          />

          <div className="flex flex-wrap gap-2">
            {chips.map((c, idx) => (
              <button
                key={idx}
                className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground hover:text-foreground"
                onClick={() => setPrompt(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button disabled={!prompt.trim()} onClick={handleSubmit}>
              {isGerman ? 'Los geht’s' : "Let's go"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
