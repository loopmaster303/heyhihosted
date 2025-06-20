
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
    let charIndex = 0;

    if (!fullText) {
      setIsTypingComplete(true);
      return;
    }

    const initialDelayTimer = setTimeout(() => {
      const typingInterval = setInterval(() => {
        if (charIndex < fullText.length) {
          setDisplayedText((prev) => prev + fullText[charIndex]);
          charIndex++;
        }
        
        if (charIndex >= fullText.length) {
          clearInterval(typingInterval);
          setIsTypingComplete(true);
        }
      }, speed);

      return () => clearInterval(typingInterval); 
    }, startDelay);

    return () => clearTimeout(initialDelayTimer); 
  }, [fullText, speed, startDelay]);

  return { text: displayedText, isComplete: isTypingComplete };
};
