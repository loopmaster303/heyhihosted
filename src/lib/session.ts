const SESSION_KEY = 'heyhi_session_id';

export function getClientSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
