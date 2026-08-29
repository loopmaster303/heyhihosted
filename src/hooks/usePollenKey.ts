'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getStoredPollenKey,
  removeStoredPollenKey,
  storePollenKey,
} from '@/lib/client-pollen-key';
import { getPollenHeaders } from '@/lib/pollen-key';

const ACCOUNT_POLL_INTERVAL = 60_000; // 60s

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
  const [accountInfo, setAccountInfo] = useState<PollenAccountInfo | null>(null);
  const [keyStatus, setKeyStatus] = useState<PollenKeyStatus>('none');
  const [keyDetail, setKeyDetail] = useState<string | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize: check localStorage + URL fragment on mount
  useEffect(() => {
    // 1. Check URL fragment first (OAuth redirect case)
    const fragmentKey = extractKeyFromFragment();
    if (fragmentKey) {
      const storedKey = storePollenKey(fragmentKey);
      if (storedKey) {
        setPollenKey(storedKey);
      }
      return;
    }

    // 2. Check localStorage (existing session)
    const storedKey = getStoredPollenKey();
    if (storedKey) {
      setPollenKey(storedKey);
    }
  }, []);

  // Fetch account info directly from Pollinations API (no proxy needed)
  const refreshAccount = useCallback(async () => {
    const key = getStoredPollenKey();
    if (!key) {
      setAccountInfo(null);
      setKeyStatus('none');
      setKeyDetail(null);
      return;
    }

    setIsLoadingAccount(true);
    try {
      const response = await fetch('/api/pollen/account', {
        method: 'GET',
        headers: getPollenHeaders(),
      });

      if (!response.ok) {
        // Der Status allein sagt nicht, warum: 403 kann ein abgelaufener
        // Token, eine fehlende Berechtigung oder ein fremder Schluessel sein.
        // Die Route reicht den Text von Pollinations durch — der gehoert ins Log.
        const detail = await response.json().catch(() => null);
        const reason = typeof detail?.error === 'string' ? detail.error : null;
        console.warn(
          '[BYOP] Failed to fetch account info:',
          response.status,
          reason ?? '(keine Begruendung von Pollinations)',
        );
        setAccountInfo(null);
        setKeyStatus(response.status === 401 ? 'rejected' : 'unverifiable');
        setKeyDetail(reason);
        return;
      }

      const data = await response.json();
      setAccountInfo(data);
      setKeyStatus('ok');
      setKeyDetail(null);
    } catch (error) {
      console.warn('[BYOP] Account info fetch error:', error);
      setAccountInfo(null);
      setKeyStatus('unverifiable');
      setKeyDetail(null);
    } finally {
      setIsLoadingAccount(false);
    }
  }, []);

  // Poll account info periodically when connected
  useEffect(() => {
    if (pollenKey) {
      // Fetch immediately
      refreshAccount();

      // Refresh on tab focus (more efficient than constant polling)
      const handleFocus = () => refreshAccount();
      window.addEventListener('focus', handleFocus);

      // Also poll periodically as fallback
      pollIntervalRef.current = setInterval(refreshAccount, ACCOUNT_POLL_INTERVAL);

      return () => {
        window.removeEventListener('focus', handleFocus);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    } else {
      setAccountInfo(null);
    }
  }, [pollenKey, refreshAccount]);

  // OAuth Connect: redirect to Pollinations authorize
  const connectOAuth = useCallback(() => {
    const redirectUrl = `${window.location.origin}/unified`;
    const authorizeUrl = new URL('https://enter.pollinations.ai/authorize');
    authorizeUrl.searchParams.set('redirect_url', redirectUrl);
    // Pollinations verlangt fuer den Kontostand `account:usage` (403-Begruendung
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
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    removeStoredPollenKey();
    setPollenKey(null);
    setAccountInfo(null);
    setKeyStatus('none');
    setKeyDetail(null);
  }, []);

  return {
    pollenKey,
    isConnected: !!pollenKey,
    keyStatus,
    keyDetail,
    accountInfo,
    isLoadingAccount,
    connectOAuth,
    connectManual,
    disconnect,
    refreshAccount,
  };
}
