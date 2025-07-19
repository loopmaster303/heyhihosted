
"use client";

import React, { useState, useEffect, useCallback } from 'react';

function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    // This function now runs only on the client during initial state creation.
    // It prevents the server from trying to access localStorage.
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    // This effect handles saving the value to localStorage whenever it changes.
    // It also only runs on the client.
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorageState;
