import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number; // milliseconds per character
  delay?: number; // delay before starting
  onComplete?: () => void;
  skipAnimation?: boolean;
}

export function useTypewriter({ 
  text, 
  speed = 30, 
  delay = 0, 
  onComplete,
  skipAnimation = false 
}: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  const typeNextCharacter = useCallback(() => {
    if (indexRef.current < text.length) {
      const currentChar = text[indexRef.current];
      setDisplayedText(prev => prev + currentChar);
      indexRef.current++;

      // Variable speed based on character type
      let nextDelay = speed;
      if (currentChar === ' ') {
        nextDelay = speed * 0.3; // Faster for spaces
      } else if (currentChar === '.' || currentChar === '!' || currentChar === '?') {
        nextDelay = speed * 2; // Slower for sentence endings
      } else if (currentChar === ',' || currentChar === ';') {
        nextDelay = speed * 1.5; // Medium for commas
      }

      timeoutRef.current = setTimeout(typeNextCharacter, nextDelay);
    } else {
      // Typing complete
      setIsTyping(false);
      setIsComplete(true);
      onComplete?.();
    }
  }, [onComplete, speed, text]);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset state
    setDisplayedText('');
    setIsTyping(false);
    setIsComplete(false);
    indexRef.current = 0;

    if (!text || skipAnimation) {
      setDisplayedText(text);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    // Start typing after delay
    const startTimeout = setTimeout(() => {
      setIsTyping(true);
      typeNextCharacter();
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay, onComplete, skipAnimation, text, typeNextCharacter]);

  return {
    displayedText,
    isTyping,
    isComplete,
    // Utility to skip to end
    skipToEnd: () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setDisplayedText(text);
      setIsTyping(false);
      setIsComplete(true);
      onComplete?.();
    }
  };
}
