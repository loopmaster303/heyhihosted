"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  amount?: number;
  once?: boolean;
}

const getInitialOffset = (direction: ScrollRevealProps['direction']) => {
  switch (direction) {
    case 'down':
      return { opacity: 0, y: -30 };
    case 'left':
      return { opacity: 0, x: 30 };
    case 'right':
      return { opacity: 0, x: -30 };
    case 'up':
    default:
      return { opacity: 0, y: 30 };
  }
};

export default function ScrollReveal({
  children,
  className,
  delay = 0,
  duration = 0.6,
  direction = 'up',
  amount = 0.2,
  once = true,
}: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial={getInitialOffset(direction)}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}
