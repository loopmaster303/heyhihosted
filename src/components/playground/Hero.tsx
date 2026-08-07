"use client";
import styles from '../../app/playground/playground.module.css';

export interface HeroMedia {
  url: string;
  kind: 'image' | 'video';
  prompt: string;
  modelName: string;
  ratio?: string | null;
  durationSeconds?: number | null;
}

interface Props {
  state: 'empty' | 'working' | 'ready' | 'error';
  media?: HeroMedia;
  error?: string;
}

export function Hero({ state, media, error }: Props) {
  return (
    <div className={styles.hero} data-state={state}>
      {state === 'empty' && (
        <div className={styles.heroEmpty}>
          <p>Ready to generate</p>
        </div>
      )}
      {state === 'working' && (
        <div className={styles.heroWorking}>
          <div className={styles.spinner} aria-label="Generating" />
        </div>
      )}
      {state === 'ready' && media && (
        <div className={styles.heroMedia}>
          <div className={styles.frame}>
            {media.kind === 'video' ? (
              <video src={media.url} controls autoPlay loop />
            ) : (
              <img src={media.url} alt={media.prompt} />
            )}
          </div>
          <div className={styles.heroMeta}>
            <strong>{media.modelName}</strong>
            {media.ratio && (
              <>
                <span className={styles.sep} aria-hidden="true" />
                <span>{media.ratio}</span>
              </>
            )}
            {media.durationSeconds != null && (
              <>
                <span className={styles.sep} aria-hidden="true" />
                <span>{media.durationSeconds}s</span>
              </>
            )}
          </div>
        </div>
      )}
      {state === 'error' && <p role="alert">{error ?? 'Something went wrong'}</p>}
    </div>
  );
}
