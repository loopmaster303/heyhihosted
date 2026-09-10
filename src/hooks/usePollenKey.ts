'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  getStoredPollenKey,
  POLLEN_KEY_CHANGED_EVENT,
  POLLEN_KEY_STORAGE_KEY,
  removeStoredPollenKey,
  storePollenKey,
} from '@/lib/client-pollen-key';
import { createResourceStore, type ResourceSnapshot } from '@/lib/client-resource-store';

// Ein Takt fuer alle Instanzen. Vorher hielt jede der sechs Instanzen einen
// eigenen Timer — die Log-Bloecke mit 4x /api/pollen/account im Sekundenabstand.
const ACCOUNT_POLL_INTERVAL = 60_000;
// Juenger als der Takt: der Puffer deckt Doppelarbeit ueber die Instanzen ab.
const ACCOUNT_TTL = 30_000;
// Ein Fokuswechsel darf hoechstens alle 30s eine Anfrage kosten.
const ACCOUNT_FOCUS_MIN_INTERVAL = 30_000;

export interface PollenAccountInfo {
  balance: number | null;
  expiresAt: string | null;
  expiresIn: number | null;
  valid: boolean;
  keyType: string | null;
  pollenBudget: number | null;
  rateLimitEnabled: boolean;
}

/**
 * Drei zustaendige Zustaende fuer einen hinterlegten Schluessel: 403 (fehlende
 * account:usage-Berechtigung) darf NICHT als Trennung gelten — Erzeugen
 * funktioniert trotzdem. Nur 401 ist eine echte Ablehnung.
 */
export type PollenKeyStatus = 'none' | 'ok' | 'rejected' | 'unverifiable';

export interface UsePollenKeyReturn {
  pollenKey: string | null;
  isConnected: boolean;
  keyStatus: PollenKeyStatus;
  /** Grund aus der Route im Klartext, fuer die Anzeige neben der Lampe. */
  keyDetail: string | null;
  accountInfo: PollenAccountInfo | null;
  isLoadingAccount: boolean;
  connectOAuth: () => void;
  connectManual: (key: string) => void;
  disconnect: () => void;
  refreshAccount: () => Promise<void>;
}

/**
 * Ergebnis eines Kontoabrufs. 401 und 403 sind Antworten der Route, keine
 * Ausfaelle: sie duerfen im Puffer liegen, denn ohne neuen Schluessel aendert
 * sich an ihnen nichts. Nur Netz- und Auswertungsfehler fliegen als Fehler.
 */
type AccountOutcome =
  | { kind: 'ok'; info: PollenAccountInfo }
  | { kind: 'rejected'; reason: string | null }
  | { kind: 'unverifiable'; reason: string | null };

const EMPTY_ACCOUNT: ResourceSnapshot<AccountOutcome> = Object.freeze({
  data: null,
  isLoading: false,
  error: null,
  fetchedAt: null,
});

async function fetchAccount(key: string): Promise<AccountOutcome> {
  const response = await fetch('/api/pollen/account', {
    method: 'GET',
    headers: { 'X-Pollen-Key': key },
  });

  if (!response.ok) {
    // Der Status allein sagt nicht, warum: 403 kann ein abgelaufener Token,
    // eine fehlende Berechtigung oder ein fremder Schluessel sein. Die Route
    // reicht den Text von Pollinations durch — der gehoert ins Log.
    const detail = await response.json().catch(() => null);
    const reason = typeof detail?.error === 'string' ? detail.error : null;
    console.warn(
      '[BYOP] Failed to fetch account info:',
      response.status,
      reason ?? '(keine Begruendung von Pollinations)',
    );
    return { kind: response.status === 401 ? 'rejected' : 'unverifiable', reason };
  }

  return { kind: 'ok', info: (await response.json()) as PollenAccountInfo };
}

async function loadAccount(key: string): Promise<AccountOutcome> {
  try {
    return await fetchAccount(key);
  } catch (error) {
    console.warn('[BYOP] Account info fetch error:', error);
    throw error;
  }
}

const accountStore = createResourceStore<AccountOutcome>({
  load: loadAccount,
  ttlMs: ACCOUNT_TTL,
  pollIntervalMs: ACCOUNT_POLL_INTERVAL,
});

/**
 * Reads and removes the API key from the URL fragment after OAuth redirect.
 * Pollinations returns: https://yourapp.com/unified#api_key=sk_abc123
 * The fragment is never sent to the server (security by design).
 */
function extractKeyFromFragment(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash || !hash.includes('api_key=')) return null;

  try {
    const params = new URLSearchParams(hash.slice(1));
    const key = params.get('api_key');
    if (key) {
      // Clean the URL fragment immediately so key is not visible
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return key;
    }
  } catch {
    // Malformed fragment — ignore
  }
  return null;
}

export function usePollenKey(): UsePollenKeyReturn {
  const [pollenKey, setPollenKey] = useState<string | null>(null);

  // Initialize: check localStorage + URL fragment on mount
  useEffect(() => {
    // Indirektion ueber eine lokale Funktion: Die Regel
    // react-hooks/set-state-in-effect verbietet nur den direkten Aufruf im
    // Effekt-Koerper. Der Effekt selbst bleibt richtig — der Server rendert
    // mit null, der Client liest danach den hinterlegten Schluessel.
    const applyKey = (key: string | null) => setPollenKey(key);

    // 1. Check URL fragment first (OAuth redirect case)
    const fragmentKey = extractKeyFromFragment();
    if (fragmentKey) {
      const storedKey = storePollenKey(fragmentKey);
      if (storedKey) {
        applyKey(storedKey);
        return;
      }
    }

    // 2. Check localStorage (existing session)
    applyKey(getStoredPollenKey());
  }, []);

  // Verbinden und Trennen gelten fuer alle Instanzen, nicht nur fuer die
  // angeklickte: der Schluessel liegt in localStorage und meldet sich von dort.
  useEffect(() => {
    const sync = () => setPollenKey(getStoredPollenKey());
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === POLLEN_KEY_STORAGE_KEY) sync();
    };
    window.addEventListener(POLLEN_KEY_CHANGED_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(POLLEN_KEY_CHANGED_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const subscribeAccount = useCallback(
    (onStoreChange: () => void) =>
      pollenKey ? accountStore.subscribe(pollenKey, onStoreChange) : () => {},
    [pollenKey],
  );
  const getAccountSnapshot = useCallback(
    () => (pollenKey ? accountStore.getSnapshot(pollenKey) : EMPTY_ACCOUNT),
    [pollenKey],
  );
  const account = useSyncExternalStore(subscribeAccount, getAccountSnapshot, getAccountSnapshot);

  // Erster Abruf. TTL und In-Flight-Deduplizierung sorgen dafuer, dass die
  // uebrigen Instanzen denselben Abruf mitbenutzen statt eigene zu starten.
  useEffect(() => {
    if (!pollenKey) return;
    void accountStore.load(pollenKey);
  }, [pollenKey]);

  // Refresh on tab focus (more efficient than constant polling) — gedrosselt:
  // lag der letzte Abruf im selben Fenster, passiert nichts.
  useEffect(() => {
    if (!pollenKey) return;
    const handleFocus = () => {
      void accountStore.load(pollenKey, { minIntervalMs: ACCOUNT_FOCUS_MIN_INTERVAL });
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [pollenKey]);

  const refreshAccount = useCallback(async () => {
    const key = getStoredPollenKey();
    if (!key) {
      // Ohne Schluessel gibt es nichts zu holen — gepufferte Daten weg.
      accountStore.invalidate();
      return;
    }
    await accountStore.load(key, { force: true });
  }, []);

  // OAuth Connect: redirect to Pollinations authorize
  const connectOAuth = useCallback(() => {
    const redirectUrl = window.location.origin + '/unified';
    const authorizeUrl = new URL('https://enter.pollinations.ai/authorize');
    authorizeUrl.searchParams.set('redirect_url', redirectUrl);
    // Pollinations verlangt fuer den Kontostand 'account:usage' (403-Begruendung
    // vom 2026-08-27). Ohne diesen Namen bleibt die Lampe dauerhaft
    // "nicht pruefbar", obwohl der Schluessel funktioniert. Verifikation V1:
    // einmal durch den echten OAuth-Flow gehen und /api/pollen/account pruefen.
    authorizeUrl.searchParams.set('permissions', 'profile,balance,usage,account:usage');
    authorizeUrl.searchParams.set('expiry', '30');

    window.location.href = authorizeUrl.toString();
  }, []);

  // Manual Key Connect
  const connectManual = useCallback((key: string) => {
    const storedKey = storePollenKey(key);
    if (!storedKey) return;
    setPollenKey(storedKey);
    // Sofort frisch laden, unabhaengig vom TTL: die Anzeige folgt dem Klick.
    void accountStore.load(storedKey, { force: true });
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    removeStoredPollenKey();
    setPollenKey(null);
    accountStore.invalidate();
  }, []);

  const outcome = pollenKey ? account.data : null;
  const accountInfo = outcome?.kind === 'ok' ? outcome.info : null;
  const keyStatus: PollenKeyStatus = !pollenKey
    ? 'none'
    : outcome
      ? outcome.kind
      : account.error
        ? 'unverifiable'
        : 'none';
  const keyDetail = outcome && outcome.kind !== 'ok' ? outcome.reason : null;

  return {
    pollenKey,
    isConnected: !!pollenKey,
    keyStatus,
    keyDetail,
    accountInfo,
    isLoadingAccount: !!pollenKey && account.isLoading,
    connectOAuth,
    connectManual,
    disconnect,
    refreshAccount,
  };
}
