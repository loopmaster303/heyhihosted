"use client";

import { useLanguage } from '@/components/LanguageProvider';
import ScrollReveal from './ScrollReveal';

const itemKeys = [
  'about.whatIs.item1',
  'about.whatIs.item2',
  'about.whatIs.item3',
] as const;

export default function AboutWhatIs() {
  const { t } = useLanguage();

  return (
    <section>
      <ScrollReveal>
        <h2 className="text-2xl md:text-3xl font-code text-foreground">{t('about.whatIs.title')}</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl text-sm">{t('about.whatIs.intro')}</p>
      </ScrollReveal>

      <ScrollReveal delay={0.12}>
        <div className="mt-5 font-mono rounded-xl border border-foreground/[0.08] bg-background/40 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-foreground/[0.08] bg-foreground/[0.03]">
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="ml-2 text-xs text-foreground/25">what-is-heyhi</span>
          </div>
          <div className="p-5 space-y-4">
            {itemKeys.map((key) => (
              <div key={key} className="flex gap-3">
                <span className="text-primary/40 text-sm select-none mt-0.5 shrink-0">{'>'}</span>
                <p className="text-sm text-foreground/90 leading-relaxed">{t(key)}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
