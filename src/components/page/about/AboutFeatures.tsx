"use client";

import { Sparkles, ImageIcon, Music, Search, Code2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import ScrollReveal from './ScrollReveal';

const features = [
  {
    key: 'about.features.items.chat',
    icon: Sparkles,
    color: 'text-primary',
    border: 'border-primary/20',
    bg: 'bg-primary/10',
  },
  {
    key: 'about.features.items.visualize',
    icon: ImageIcon,
    color: 'text-mode-visualize',
    border: 'border-mode-visualize/30',
    bg: 'bg-mode-visualize/10',
  },
  {
    key: 'about.features.items.compose',
    icon: Music,
    color: 'text-mode-compose',
    border: 'border-mode-compose/30',
    bg: 'bg-mode-compose/10',
  },
  {
    key: 'about.features.items.research',
    icon: Search,
    color: 'text-mode-research',
    border: 'border-mode-research/30',
    bg: 'bg-mode-research/10',
  },
  {
    key: 'about.features.items.code',
    icon: Code2,
    color: 'text-mode-code',
    border: 'border-mode-code/30',
    bg: 'bg-mode-code/10',
  },
  {
    key: 'about.features.items.privacy',
    icon: Shield,
    color: 'text-primary',
    border: 'border-primary/20',
    bg: 'bg-primary/10',
  },
] as const;

export default function AboutFeatures() {
  const { t } = useLanguage();

  return (
    <section>
      <ScrollReveal>
        <h2 className="text-2xl md:text-3xl font-code text-foreground">{t('about.features.title')}</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">{t('about.features.intro')}</p>
      </ScrollReveal>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <ScrollReveal key={feature.key} delay={index * 0.1}>
              <article className="glass-panel rounded-2xl p-5 h-full transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-glow-primary">
                <div
                  className={cn(
                    'inline-flex items-center justify-center h-10 w-10 rounded-lg border',
                    feature.bg,
                    feature.border,
                    feature.color,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 text-lg font-code text-foreground">
                  {t(`${feature.key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t(`${feature.key}.description`)}
                </p>
              </article>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
