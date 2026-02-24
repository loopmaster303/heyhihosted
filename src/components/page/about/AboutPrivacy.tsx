"use client";

import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import ScrollReveal from './ScrollReveal';

const points = [
  'about.privacy.point1',
  'about.privacy.point2',
  'about.privacy.point3',
] as const;

export default function AboutPrivacy() {
  const { t } = useLanguage();

  return (
    <section>
      <ScrollReveal>
        <div className="glass-panel rounded-2xl p-6 md:p-8 border-primary/20">
          <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <h2 className="mt-4 text-2xl md:text-3xl font-code text-foreground">{t('about.privacy.title')}</h2>
          <p className="mt-2 text-muted-foreground max-w-3xl">{t('about.privacy.intro')}</p>

          <ul className="mt-5 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-foreground/90 leading-relaxed">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                <span>{t(point)}</span>
              </li>
            ))}
          </ul>
        </div>
      </ScrollReveal>
    </section>
  );
}
