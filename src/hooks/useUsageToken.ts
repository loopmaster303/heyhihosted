
"use client";

import { useState, useEffect, useCallback } from 'react';
import useLocalStorageState from './useLocalStorageState';

function useUsageToken() {
  const [token, setToken] = useLocalStorageState<string>('premiumUsageToken', '');
  const [isValid, setIsValid] = useState(false);
  const [remainingUses, setRemainingUses] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateToken = useCallback(async () => {
    if (!token) {
      setIsValid(false);
      setRemainingUses(0);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate token');
      }
      
      setIsValid(data.isValid);
      setRemainingUses(data.remainingUses || 0);
      if (!data.isValid) {
        setError(data.error || 'Invalid token.');
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setIsValid(false);
      setRemainingUses(0);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Automatically validate token on initial load if it exists
  useEffect(() => {
    validateToken();
  }, [validateToken]);

  return {
    token,
    setToken,
    isValid,
    remainingUses,
    isLoading,
    error,
    validateToken,
  };
}

export default useUsageToken;
