"use client";

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import ScrollReveal from './ScrollReveal';

export default function AboutCTA() {
  const { t } = useLanguage();

  return (
    <section>
      <ScrollReveal>
        <div className="font-mono rounded-xl border border-foreground/[0.08] bg-background/40 p-6 md:p-8">

          {/* Glowing headline */}
          <div className="text-center mb-8">
            <p className="text-[10px] font-bold tracking-[0.3em] text-foreground/25 uppercase mb-2">
              beta test phase
            </p>
            <p
              className="text-sm sm:text-base font-bold tracking-[0.22em] uppercase"
              style={{
                color: 'rgba(179, 136, 255, 0.9)',
                textShadow:
                  '0 0 18px rgba(179, 136, 255, 0.55), 0 0 40px rgba(179, 136, 255, 0.25)',
              }}
            >
              everyone can say hi to ai
            </p>
          </div>

          <p className="text-xs text-foreground/25 mb-5">{t('about.cta.thanks')}</p>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-primary/40 text-sm select-none">$</span>
            <span className="text-foreground text-xl font-code">{t('about.cta.title')}</span>
          </div>
          <p className="pl-5 text-xs text-foreground/55 mb-6"># {t('about.cta.description')}</p>

          <Link
            href="/unified"
            className="inline-flex items-center gap-2 text-sm text-primary/70 hover:text-primary transition-colors duration-150"
          >
            <span className="text-primary/40 select-none">$</span>
            {t('about.cta.button')}
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
