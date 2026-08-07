"use client";
import styles from './playground.module.css';

export function PlaygroundShell() {
  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.logo}>
          <span className={styles.logoDot} aria-hidden />
          <span>heyhi</span>
          <span className={styles.slash}>/</span>
          <span className={styles.sub}>playground</span>
        </div>
      </header>
      <main className={styles.workspace}>
        <aside className={styles.params} aria-label="Parameters">
          <div className={styles.paramsScroll} data-testid="params-panel">
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Params sidebar</p>
          </div>
        </aside>
        <section className={styles.output}>
          <div className={styles.hero} data-testid="hero-placeholder">
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Hero placeholder</p>
          </div>
          <div className={styles.gallery} data-testid="gallery-placeholder">
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Gallery placeholder</p>
          </div>
        </section>
      </main>
    </div>
  );
}
