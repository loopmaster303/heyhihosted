/**
 * localStorage, das nie wirft.
 *
 * Safari verweigert den Zugriff in mehreren Lagen — privater Modus, blockierte
 * Cookies, eingeschränkte Rechte auf unsicheren Herkünften — und wirft dabei
 * eine SecurityError, statt null zu liefern. Passiert das während des Renderns,
 * reisst es die Hydration mit und die Seite zeigt nur noch
 * "Application error: a client-side exception has occurred".
 */

export function readLocal(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeLocal(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Nichts zu retten — der Aufrufer kommt auch ohne aus.
  }
}
