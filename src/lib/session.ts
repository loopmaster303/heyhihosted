import { generateUUID } from '@/lib/uuid';

const SESSION_KEY = 'heyhi_session_id';

export function getClientSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    // crypto.randomUUID() only exists in secure contexts (HTTPS/localhost);
    // over plain HTTP (e.g. a Tailscale IP on mobile) it is undefined, so use
    // the secure-context-safe helper with a fallback.
    sessionId = generateUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
