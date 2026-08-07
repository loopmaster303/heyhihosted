"use client";
import { useLanguage } from '@/components/LanguageProvider';
import styles from '../../app/playground/playground.module.css';

type State = 'idle' | 'working' | 'disabled';

interface Props {
  state: State;
  onClick: () => void;
  onCancel: () => void;
}

export function GenerateButton({ state, onClick, onCancel }: Props) {
  const { t } = useLanguage();
  if (state === 'working') {
    return (
      <button className={`${styles.generate} ${styles.working}`} onClick={onCancel} aria-label={t('playground.cancel')}>
        {t('playground.cancel')}
      </button>
    );
  }
  return (
    <button className={styles.generate} onClick={onClick} disabled={state === 'disabled'}>
      {t('playground.generate')}
    </button>
  );
}
