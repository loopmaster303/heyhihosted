"use client";

import { useLanguage } from '@/components/LanguageProvider';
import ScrollReveal from './ScrollReveal';

const stepKeys = [
  'about.howto.step1',
  'about.howto.step2',
  'about.howto.step3',
  'about.howto.step4',
  'about.howto.step5',
] as const;

export default function AboutHowTo() {
  const { t } = useLanguage();

  return (
    <section>
      <ScrollReveal>
        <h2 className="text-2xl md:text-3xl font-code text-foreground">{t('about.howto.title')}</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl text-sm">{t('about.howto.intro')}</p>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="mt-5 font-mono rounded-xl border border-foreground/[0.08] bg-background/40 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-foreground/[0.08] bg-foreground/[0.03]">
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="ml-2 text-xs text-foreground/25">setup.sh</span>
          </div>
          <div className="p-5 space-y-5">
            {stepKeys.map((stepKey, index) => (
              <div key={stepKey} className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-primary/40 text-sm select-none shrink-0">$</span>
                  <span className="text-foreground/90 text-sm">{t(`${stepKey}.title`)}</span>
                </div>
                <p className="pl-5 text-xs leading-relaxed">
                  <span className="text-foreground/30 select-none"># </span>
                  <span className="text-foreground/80">{t(`${stepKey}.description`)}</span>
                </p>
              </div>
            ))}
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-primary/40 text-sm select-none">$</span>
              <span className="text-primary/30 text-sm animate-pulse">_</span>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
