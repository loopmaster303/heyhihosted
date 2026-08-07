"use client";

import { useEffect, useState } from 'react';
import { useProviderMode } from '@/hooks/useProviderMode';
import { usePollenKey } from '@/hooks/usePollenKey';
import styles from '../../app/playground/playground.module.css';

export function ApiKeyField() {
  const { providerMode } = useProviderMode();
  const { pollenKey, connectManual, disconnect } = usePollenKey();
  const [prunaKey, setPrunaKeyLocal] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'error' | 'checking'>('idle');
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPrunaKeyLocal(localStorage.getItem('prunaApiKey') ?? '');
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'prunaApiKey') setPrunaKeyLocal(e.newValue ?? '');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isPollen = providerMode === 'pollinations';
  const value = isPollen ? (pollenKey ?? '') : prunaKey;
  const label = isPollen ? 'Pollinations Key' : 'Pruna Key';
  const inputId = isPollen ? 'pollen-key' : 'pruna-key';

  const onChange = (v: string) => {
    if (isPollen) {
      if (v) connectManual(v);
      else disconnect();
    } else {
      setPrunaKeyLocal(v);
      if (v) localStorage.setItem('prunaApiKey', v);
      else localStorage.removeItem('prunaApiKey');
    }
    setStatus('idle');
  };

  const runTest = async () => {
    if (!value) return;
    setStatus('checking');
    try {
      const url = isPollen ? '/api/pollen/account' : '/api/capabilities';
      const headers: Record<string, string> = isPollen ? { 'X-Pollen-Key': value } : { 'X-Pruna-Key': value };
      const res = await fetch(url, { headers });
      setStatus(res.ok ? 'ok' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.fieldLabel}>{label}</label>
      <div className={styles.keyRow}>
        <input
          id={inputId}
          type={reveal ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className={styles.keyInput}
        />
        <button
          type="button"
          aria-label={reveal ? 'Hide key' : 'Show key'}
          onClick={() => setReveal((r) => !r)}
          className={styles.iconButton}
        >
          {reveal ? '🙈' : '👁'}
        </button>
        <button
          type="button"
          onClick={runTest}
          disabled={!value || status === 'checking'}
          className={styles.testButton}
        >
          {status === 'checking' ? '…' : 'Test'}
        </button>
        <span
          data-testid="key-status"
          data-status={status}
          aria-live="polite"
          className={styles.keyStatus}
        />
      </div>
    </div>
  );
}
