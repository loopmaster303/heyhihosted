import React from 'react';
import { cn } from '@/lib/utils';

interface BlinkingCursorProps {
  className?: string;
  color?: string;
}

export const BlinkingCursor: React.FC<BlinkingCursorProps> = ({ 
  className,
  color = "currentColor"
}) => {
  return (
    <span 
      className={cn(
        "inline-block w-0.5 h-4 bg-current animate-pulse",
        className
      )}
      style={{ 
        animation: 'blink 1s infinite',
        color: color
      }}
    >
      |
    </span>
  );
};
