"use client";

import { useLanguage } from '@/components/LanguageProvider';
import ScrollReveal from './ScrollReveal';

const features = [
  { key: 'about.features.items.chat',     id: 'chat',     accent: 'text-primary' },
  { key: 'about.features.items.visualize', id: 'visualize', accent: 'text-mode-visualize' },
  { key: 'about.features.items.compose',  id: 'compose',  accent: 'text-mode-compose' },
  { key: 'about.features.items.research', id: 'research', accent: 'text-mode-research' },
  { key: 'about.features.items.privacy',  id: 'privacy',  accent: 'text-primary' },
] as const;

export default function AboutFeatures() {
  const { t } = useLanguage();

  return (
    <section>
      <ScrollReveal>
        <h2 className="text-2xl md:text-3xl font-code text-foreground">{t('about.features.title')}</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl text-sm">{t('about.features.intro')}</p>
      </ScrollReveal>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {features.map((feature, index) => (
          <ScrollReveal key={feature.key} delay={index * 0.07}>
            <article className="rounded-xl border border-foreground/[0.07] bg-background/30 p-4 h-full hover:border-foreground/[0.15] transition-colors duration-200">
              <span className={`font-mono text-xs ${feature.accent} opacity-60`}>{feature.id}</span>
              <h3 className="mt-2.5 text-sm font-code text-foreground">
                {t(`${feature.key}.title`)}
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {t(`${feature.key}.description`)}
              </p>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
