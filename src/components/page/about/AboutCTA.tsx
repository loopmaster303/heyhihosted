"use client";

import Link from 'next/link';
import DecryptedText from '@/components/ui/DecryptedText';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/LanguageProvider';
import ScrollReveal from './ScrollReveal';

export default function AboutCTA() {
  const { t } = useLanguage();

  return (
    <section>
      <ScrollReveal>
        <div className="glass-panel rounded-2xl p-6 md:p-8 text-center border-primary/20">
          <h2 className="text-2xl md:text-3xl font-code text-foreground">
            <DecryptedText text={t('about.cta.title')} speed={40} animateOn="view" />
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{t('about.cta.description')}</p>

          <Button asChild size="lg" className="mt-6 px-8">
            <Link href="/unified">{t('about.cta.button')}</Link>
          </Button>

          <p className="mt-5 text-xs text-muted-foreground/85 max-w-2xl mx-auto leading-relaxed">
            {t('about.cta.thanks')}
          </p>
        </div>
      </ScrollReveal>
    </section>
  );
}
