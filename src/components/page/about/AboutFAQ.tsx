"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import ScrollReveal from './ScrollReveal';

const faqKeys = [
  'about.faq.item1',
  'about.faq.item2',
  'about.faq.item3',
  'about.faq.item4',
  'about.faq.item5',
] as const;

export default function AboutFAQ() {
  const { t } = useLanguage();
  const [openItem, setOpenItem] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenItem((current) => (current === index ? null : index));
  };

  return (
    <section>
      <ScrollReveal>
        <h2 className="text-2xl md:text-3xl font-code text-foreground">{t('about.faq.title')}</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">{t('about.faq.intro')}</p>
      </ScrollReveal>

      <div className="mt-6 space-y-3">
        {faqKeys.map((faqKey, index) => {
          const isOpen = openItem === index;

          return (
            <ScrollReveal key={faqKey} delay={index * 0.06}>
              <article className="glass-panel rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full text-left p-4 md:p-5 flex items-center justify-between gap-3 hover:bg-primary/5 transition-colors"
                  aria-expanded={isOpen}
                >
                  <h3 className="text-base md:text-lg font-code text-foreground">{t(`${faqKey}.question`)}</h3>
                  <ChevronDown
                    className={cn('h-4 w-4 text-muted-foreground transition-transform duration-300 shrink-0', isOpen && 'rotate-180')}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-4 md:px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                        {t(`${faqKey}.answer`)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
