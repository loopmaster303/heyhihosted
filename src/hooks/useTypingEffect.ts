// src/hooks/useTypingEffect.ts
'use client';
import { useState, useEffect } from 'react';

export const useTypingEffect = (
  fullText: string,
  speed: number = 100,
  startDelay: number = 0
): { text: string; isComplete: boolean } => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    // Reset state for new fullText or parameters
    setDisplayedText('');
    setIsTypingComplete(false);
    let currentIndex = 0;

    // Handle empty or null fullText immediately
    if (!fullText || fullText.length === 0) {
      setIsTypingComplete(true);
      return;
    }

    const delayTimer = setTimeout(() => {
      const intervalId = setInterval(() => {
        if (currentIndex < fullText.length) {
          // Append the character at the current index
          setDisplayedText((prevText) => prevText + fullText.charAt(currentIndex));
          currentIndex++; // Move to the next character
        } else {
          // All characters have been typed
          clearInterval(intervalId);
          setIsTypingComplete(true);
        }
      }, speed);

      // Cleanup for interval on unmount or before next effect run
      return () => clearInterval(intervalId);
    }, startDelay);

    // Cleanup for timeout on unmount or before next effect run
    return () => clearTimeout(delayTimer);

  }, [fullText, speed, startDelay]); // Dependencies for the effect

  return { text: displayedText, isComplete: isTypingComplete };
};
