
"use client";

import React, { useState, useEffect, useCallback } from 'react';

function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Initialize with default; hydrate from storage after mount to avoid SSR mismatch
  const [value, setValueState] = useState<T>(defaultValue);

  // Load from localStorage after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        setValueState(JSON.parse(storedValue));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      // If parsing fails (e.g. invalid JSON), we stick to defaultValue
      // Optionally we could verify if it's a raw string, but standard is JSON.
      // If the value is critically corrupt, we might want to clear it:
      // localStorage.removeItem(key); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (updater: React.SetStateAction<T>) => {
      setValueState((prev) => {
        const next = typeof updater === 'function' ? (updater as (prevState: T) => T)(prev) : updater;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(key, JSON.stringify(next));
            window.dispatchEvent(new CustomEvent(`local-storage-${key}`, { detail: next }));
          } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
          }
        }
        return next;
      });
    },
    [key]
  );

  // Sync across components in the same tab
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent;
      if (custom.detail !== undefined) {
        // Defer to avoid setState during another component render
        setTimeout(() => setValueState(custom.detail), 0);
      }
    };
    const eventName = `local-storage-${key}`;
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [key]);

  return [value, setValue];
}

export default useLocalStorageState;
