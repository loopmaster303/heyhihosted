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
  const textRef = useRef<HTMLSpanElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Extract unique characters from text
  const getCharPool = () => {
    if (useOriginalCharsOnly) {
      const uniqueChars = Array.from(new Set(text.split(''))).join('');
      return uniqueChars || characters;
    }
    return characters;
  };

  const startDecryption = () => {
    if (isDecrypting) return;

    setIsDecrypting(true);
    const charPool = getCharPool();
    const iterations = Math.ceil(text.length * 1.5);
    let iterationCount = 0;

    // Create initial scrambled text
    let currentText = text
      .split('')
      .map(() => charPool[Math.floor(Math.random() * charPool.length)])
      .join('');

    setDisplayText(currentText);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const progress = iterationCount / iterations;

      let newText = text.split('').map((char, index) => {
        // Calculate reveal progress based on direction
        let revealThreshold: number;

        if (revealDirection === 'start') {
          revealThreshold = sequential
            ? index / text.length
            : (index / text.length) * 0.5;
        } else if (revealDirection === 'end') {
          revealThreshold = sequential
            ? (text.length - index) / text.length
            : ((text.length - index) / text.length) * 0.5;
        } else { // center
          const centerDist = Math.abs(index - text.length / 2);
          revealThreshold = sequential
            ? centerDist / (text.length / 2)
            : (centerDist / (text.length / 2)) * 0.5;
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
        setDisplayText(text);
        setIsDecrypting(false);
        setHasDecrypted(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (onDecryptionComplete) {
          onDecryptionComplete();
        }
      }
    }, speed);
  };

  // Handle mount animation
  useEffect(() => {
    if (animateOn === 'mount' || animateOn === 'both') {
      const timer = setTimeout(() => startDecryption(), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle view animation (intersection observer)
  useEffect(() => {
    if (animateOn === 'view' && textRef.current) {
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

      observerRef.current.observe(textRef.current);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [animateOn, hasDecrypted]);

  // Handle hover animation
  useEffect(() => {
    if ((animateOn === 'hover' || animateOn === 'both') && isHovered && !isDecrypting) {
      startDecryption();
    }
  }, [isHovered, animateOn]);

  // Update text when prop changes
  useEffect(() => {
    setDisplayText(text);
    setHasDecrypted(false);
    if (animateOn === 'mount' || animateOn === 'both') {
      const timer = setTimeout(() => startDecryption(), 100);
      return () => clearTimeout(timer);
    }
  }, [text]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const isHoverable = animateOn === 'hover' || animateOn === 'both';

  return (
    <span
      ref={textRef}
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
