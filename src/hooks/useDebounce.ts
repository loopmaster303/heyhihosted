import { useState, useEffect } from 'react';

// Eine einfache Implementierung des useDebounce Hooks
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Setzen Sie einen Timer, der den Wert nach der Verzögerung aktualisiert
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Bereinigen Sie den Timer, wenn sich der Wert ändert oder die Komponente unmountet
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Führen Sie den Effekt nur aus, wenn sich der Wert oder die Verzögerung ändert

  return debouncedValue;
}