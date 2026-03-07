"use client";

import { useLanguage } from '@/components/LanguageProvider';
import ScrollReveal from './ScrollReveal';

const points = [
  'about.privacy.point1',
  'about.privacy.point2',
  'about.privacy.point3',
] as const;

const configEntries = [
  { key: 'local_first',    value: 'true',       valueClass: 'text-green-400/60' },
  { key: 'login_required', value: 'false',      valueClass: 'text-green-400/60' },
  { key: 'data_paths',     value: '"explicit"', valueClass: 'text-yellow-400/60' },
] as const;

export default function AboutPrivacy() {
  const { t } = useLanguage();

  return (
    <section>
      <ScrollReveal>
        <div className="font-mono rounded-xl border border-foreground/[0.08] bg-background/40 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-foreground/[0.08] bg-foreground/[0.03]">
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
            <span className="ml-2 text-xs text-foreground/25">privacy.config</span>
          </div>

          <div className="p-5 md:p-6">
            <p className="text-xs text-foreground/25 mb-4"># {t('about.privacy.title')}</p>

            <div className="space-y-2 text-sm mb-6">
              {configEntries.map((entry) => (
                <div key={entry.key} className="flex items-center gap-3">
                  <span className="text-primary/50 min-w-[120px]">{entry.key}</span>
                  <span className="text-foreground/25">=</span>
                  <span className={entry.valueClass}>{entry.value}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-foreground/[0.06] pt-4 space-y-2.5">
              {points.map((point) => (
                <p key={point} className="text-xs leading-relaxed">
                  <span className="text-foreground/30 select-none"># </span>
                  <span className="text-foreground/85">{t(point)}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
