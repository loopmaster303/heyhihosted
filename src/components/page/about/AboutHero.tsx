"use client";

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import DecryptedText from '@/components/ui/DecryptedText';
import { BlinkingCursor } from '@/components/ui/BlinkingCursor';
import { useLanguage } from '@/components/LanguageProvider';

const ASCIIText = dynamic(() => import('@/components/ui/ASCIIText'), {
  ssr: false,
  loading: () => <div className="h-24 sm:h-28 md:h-32" />,
});

export default function AboutHero() {
  const { t } = useLanguage();

  return (
    <section className="relative rounded-2xl glass-panel p-6 md:p-10 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at center, hsl(267 78% 65% / 0.05), transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center text-center">
        <div className="w-full h-24 sm:h-28 md:h-32">
          <ASCIIText
            text="hey.hi"
            asciiFontSize={9}
            densityScale={1.2}
            enableWaves={true}
            enableGlitch={true}
            glitchDurationMs={2000}
            glitchIntervalMs={120000}
            glitchIntensity={1.5}
            color="rgba(179, 136, 255, 0.95)"
            className="w-full h-full"
          />
        </div>

        <p className="mt-4 text-[11px] sm:text-xs uppercase tracking-[0.22em] text-foreground/45 font-semibold">
          {t('about.hero.kicker')}
        </p>

        <h1 className="mt-4 text-3xl md:text-4xl font-code text-foreground leading-tight max-w-3xl">
          <DecryptedText
            text={t('about.hero.title')}
            speed={45}
            sequential={false}
            revealDirection="start"
            animateOn="mount"
          />
        </h1>

        <p className="mt-4 max-w-2xl text-sm md:text-base text-muted-foreground leading-relaxed">
          {t('about.hero.description')}
        </p>

        <div className="mt-5 inline-flex items-center gap-2 text-xs text-primary font-semibold">
          <span>{t('about.hero.cursorLabel')}</span>
          <BlinkingCursor className="h-3" color="hsl(var(--primary))" />
        </div>

        <motion.div
          className="mt-7 flex flex-col items-center text-muted-foreground/70"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          <span className="text-[10px] uppercase tracking-[0.18em]">{t('about.hero.scroll')}</span>
          <ChevronDown className="h-4 w-4 mt-1" />
        </motion.div>
      </div>
    </section>
  );
}
