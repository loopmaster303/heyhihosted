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
        <p className="mt-2 text-muted-foreground max-w-3xl">{t('about.howto.intro')}</p>
      </ScrollReveal>

      <div className="mt-6 glass-panel rounded-2xl p-5 md:p-7">
        <ol className="space-y-6">
          {stepKeys.map((stepKey, index) => (
            <ScrollReveal key={stepKey} delay={index * 0.15}>
              <li className="relative pl-14">
                {index < stepKeys.length - 1 && (
                  <span className="absolute left-5 top-10 w-px h-[calc(100%+1.5rem)] bg-primary/20" />
                )}

                <span className="absolute left-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/30 text-primary font-bold text-sm">
                  {index + 1}
                </span>

                <h3 className="text-lg font-code text-foreground">{t(`${stepKey}.title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(`${stepKey}.description`)}</p>
              </li>
            </ScrollReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
