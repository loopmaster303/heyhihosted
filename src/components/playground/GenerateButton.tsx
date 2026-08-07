"use client";
import styles from '../../app/playground/playground.module.css';

type State = 'idle' | 'working' | 'disabled';

interface Props {
  state: State;
  onClick: () => void;
  onCancel: () => void;
}

export function GenerateButton({ state, onClick, onCancel }: Props) {
  if (state === 'working') {
    return (
      <button className={`${styles.generate} ${styles.working}`} onClick={onCancel} aria-label="Cancel">
        Cancel
      </button>
    );
  }
  return (
    <button className={styles.generate} onClick={onClick} disabled={state === 'disabled'}>
      Generate
    </button>
  );
}
