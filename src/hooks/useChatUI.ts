import { useState } from 'react';

/**
 * Laeuft gerade eine Antwort? Panels und Sheets gehoeren der Huelle
 * (AppShell), nicht dem Chat-Zustand.
 */
export function useChatUI() {
  const [isAiResponding, setIsAiResponding] = useState(false);

  return {
    isAiResponding,
    setIsAiResponding,
  };
}
