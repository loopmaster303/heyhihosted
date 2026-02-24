"use client";

import { Terminal, Sparkles, Layers } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import ScrollReveal from './ScrollReveal';

const items = [
  { key: 'about.whatIs.item1', icon: Terminal },
  { key: 'about.whatIs.item2', icon: Sparkles },
  { key: 'about.whatIs.item3', icon: Layers },
] as const;

export default function AboutWhatIs() {
  const { t } = useLanguage();

  return (
    <section>
      <ScrollReveal>
        <h2 className="text-2xl md:text-3xl font-code text-foreground">{t('about.whatIs.title')}</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">{t('about.whatIs.intro')}</p>
      </ScrollReveal>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <ScrollReveal key={item.key} delay={index * 0.1}>
              <article className="glass-panel rounded-2xl p-5 h-full">
                <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">{t(item.key)}</p>
              </article>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
