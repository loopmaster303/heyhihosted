'use client';

import React, { useEffect, useState, useRef } from 'react';

interface DecryptedTextProps {
  text: string;
  className?: string;
  speed?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  characters?: string;
  useOriginalCharsOnly?: boolean;
  animateOn?: 'view' | 'hover' | 'mount' | 'both'; // 'both' = mount + hover
  onDecryptionComplete?: () => void;
}

export default function DecryptedText({
  text,
  className = '',
  speed = 50,
  sequential = false,
  revealDirection = 'start',
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?',
  useOriginalCharsOnly = false,
  animateOn = 'mount',
  onDecryptionComplete,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasDecrypted, setHasDecrypted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isDecryptingRef = useRef(false);
  const optionsRef = useRef({
    text,
    speed,
    sequential,
    revealDirection,
    characters,
    useOriginalCharsOnly,
    onDecryptionComplete,
  });

  optionsRef.current = {
    text,
    speed,
    sequential,
    revealDirection,
    characters,
    useOriginalCharsOnly,
    onDecryptionComplete,
  };

  const startDecryption = React.useCallback(() => {
    if (isDecryptingRef.current) return;

    isDecryptingRef.current = true;
    setIsDecrypting(true);

    const currentOptions = optionsRef.current;
    const currentTextValue = currentOptions.text;
    const charPool = currentOptions.useOriginalCharsOnly
      ? (() => {
          const uniqueChars = Array.from(new Set(currentTextValue.split(''))).join('');
          return uniqueChars || currentOptions.characters;
        })()
      : currentOptions.characters;
    const iterations = Math.ceil(currentTextValue.length * 1.5);
    let iterationCount = 0;

    let currentText = currentTextValue
      .split('')
      .map(() => charPool[Math.floor(Math.random() * charPool.length)])
      .join('');

    setDisplayText(currentText);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const progress = iterationCount / iterations;

      const newText = currentTextValue.split('').map((char, index) => {
        // Calculate reveal progress based on direction
        let revealThreshold: number;

        if (currentOptions.revealDirection === 'start') {
          revealThreshold = currentOptions.sequential
            ? index / currentTextValue.length
            : (index / currentTextValue.length) * 0.5;
        } else if (currentOptions.revealDirection === 'end') {
          revealThreshold = currentOptions.sequential
            ? (currentTextValue.length - index) / currentTextValue.length
            : ((currentTextValue.length - index) / currentTextValue.length) * 0.5;
        } else { // center
          const centerDist = Math.abs(index - currentTextValue.length / 2);
          revealThreshold = currentOptions.sequential
            ? centerDist / (currentTextValue.length / 2)
            : (centerDist / (currentTextValue.length / 2)) * 0.5;
        }

        // Reveal character if progress has reached it
        if (progress > revealThreshold) {
          return char;
        }

        // Otherwise show random character
        return char === ' ' ? ' ' : charPool[Math.floor(Math.random() * charPool.length)];
      }).join('');

      setDisplayText(newText);
      iterationCount++;

      // Complete decryption
      if (iterationCount >= iterations) {
        setDisplayText(currentTextValue);
        setIsDecrypting(false);
        isDecryptingRef.current = false;
        setHasDecrypted(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (currentOptions.onDecryptionComplete) {
          currentOptions.onDecryptionComplete();
        }
      }
    }, currentOptions.speed);
  }, []);

  // Handle mount animation
  useEffect(() => {
    if (animateOn === 'mount' || animateOn === 'both') {
      const timer = setTimeout(() => startDecryption(), 100);
      return () => clearTimeout(timer);
    }
  }, [animateOn, startDecryption]);

  // Handle view animation (intersection observer)
  useEffect(() => {
    if (animateOn === 'view' && spanRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasDecrypted) {
              startDecryption();
            }
          });
        },
        { threshold: 0.1 }
      );

      observerRef.current.observe(spanRef.current);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [animateOn, hasDecrypted, startDecryption]);

  // Handle hover animation
  useEffect(() => {
    if ((animateOn === 'hover' || animateOn === 'both') && isHovered && !isDecrypting) {
      startDecryption();
    }
  }, [isHovered, animateOn, isDecrypting, startDecryption]);

  // Update text when prop changes
  useEffect(() => {
    setDisplayText(text);
    setHasDecrypted(false);
    isDecryptingRef.current = false;
    if (animateOn === 'mount' || animateOn === 'both') {
      const timer = setTimeout(() => startDecryption(), 100);
      return () => clearTimeout(timer);
    }
  }, [text, animateOn, startDecryption]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      isDecryptingRef.current = false;
    };
  }, []);

  const isHoverable = animateOn === 'hover' || animateOn === 'both';

  return (
    <span
      ref={spanRef}
      className={`decrypted-text ${isHoverable ? 'decrypted-text-hoverable' : ''} ${className}`}
      onMouseEnter={() => isHoverable && setIsHovered(true)}
      onMouseLeave={() => isHoverable && setIsHovered(false)}
      style={{
        fontVariantNumeric: 'tabular-nums',
        fontFamily: 'inherit',
      }}
      title={isHoverable ? 'Hover to re-decrypt ✨' : undefined}
    >
      {displayText}
    </span>
  );
}
