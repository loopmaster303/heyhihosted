
// src/hooks/useTypingEffect.ts
'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for creating a typing animation effect.
 * @param fullText The full string to be typed out.
 * @param speed The speed of typing in milliseconds per character.
 * @param startDelay The delay in milliseconds before typing starts.
 * @returns An object containing the currently displayed text and a boolean indicating completion.
 */
export const useTypingEffect = (
  fullText: string,
  speed: number = 100,
  startDelay: number = 0
): { text: string; isComplete: boolean } => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    setDisplayedText(''); 
    setIsTypingComplete(false);
    let charIndex = 0; // Current character index to type

    if (!fullText) {
      setIsTypingComplete(true);
      return;
    }

    const initialDelayTimer = setTimeout(() => {
      const typingInterval = setInterval(() => {
        // If charIndex is less than fullText.length, it's a valid index
        if (charIndex < fullText.length) {
          setDisplayedText((prev) => prev + fullText[charIndex]);
          charIndex++; // Increment *after* using the current charIndex
        } else { // All characters have been typed
          clearInterval(typingInterval);
          setIsTypingComplete(true);
        }
      }, speed);

      // Cleanup function for the interval
      return () => clearInterval(typingInterval);
    }, startDelay);

    // Cleanup function for the initial delay timer
    return () => clearTimeout(initialDelayTimer);
  }, [fullText, speed, startDelay]); // Dependencies for the useEffect

  return { text: displayedText, isComplete: isTypingComplete };
};
