import { useEffect } from 'react';

/**
 * Hook to handle ESC key press for closing panels/modals
 * @param callback Function to call when ESC key is pressed
 * @param active Whether the listener should be active
 */
export function useEscapeKey(callback: () => void, active: boolean = true) {
  useEffect(() => {
    if (!active) return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [callback, active]);
}

export default useEscapeKey;

