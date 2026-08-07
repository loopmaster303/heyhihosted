"use client";

import styles from '../../app/playground/playground.module.css';

export function MobileBar({
  prompt,
  onPrompt,
  onGenerate,
  onOpenParams,
}: {
  prompt: string;
  onPrompt: (v: string) => void;
  onGenerate: () => void;
  onOpenParams: () => void;
}) {
  return (
    <div className={styles.mobileBar}>
      <button className={styles.mobileSettingsBtn} onClick={onOpenParams} aria-label="Settings">
        ⚙
      </button>
      <input
        value={prompt}
        onChange={(e) => onPrompt(e.target.value)}
        placeholder="quick prompt..."
        className={styles.mobilePromptInput}
      />
      <button className={styles.mobileGenerateBtn} onClick={onGenerate}>
        Generate
      </button>
    </div>
  );
}
