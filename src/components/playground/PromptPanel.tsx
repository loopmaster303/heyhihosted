"use client";
import { useLanguage } from '@/components/LanguageProvider';
import styles from '../../app/playground/playground.module.css';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onEnhance: () => void;
  enhancing: boolean;
}

export function PromptPanel({ value, onChange, onEnhance, enhancing }: Props) {
  const { t } = useLanguage();
  const disabled = enhancing || value.trim().length === 0;
  return (
    <div className={styles.promptBox}>
      <div className={`${styles.fieldLabel} ${styles.promptHeader}`}>
        <span>Prompt</span>
        <span className={styles.hint}>{value.length} / 1000</span>
      </div>
      <textarea
        className={styles.promptInput}
        value={value}
        maxLength={1000}
        onChange={(e) => onChange(e.target.value)}
        placeholder="describe what you want to see..."
        rows={4}
      />
      <div className={styles.promptActions}>
        <button
          className={styles.promptAction}
          onClick={onEnhance}
          disabled={disabled}
        >
          {enhancing ? 'Enhancing…' : t('playground.enhance')}
        </button>
      </div>
    </div>
  );
}
