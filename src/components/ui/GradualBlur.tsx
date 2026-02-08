'use client';

import React, { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface GradualBlurProps {
  /**
   * Direction of the blur gradient
   * @default 'bottom'
   */
  direction?: 'top' | 'bottom' | 'left' | 'right';

  /**
   * Blur intensity in pixels
   * @default 8
   */
  blurAmount?: number;

  /**
   * Height of the blur area (for top/bottom)
   * @default '120px'
   */
  height?: string;

  /**
   * Width of the blur area (for left/right)
   * @default '120px'
   */
  width?: string;

  /**
   * Additional class names
   */
  className?: string;

  /**
   * Z-index for the blur overlay
   * @default 10
   */
  zIndex?: number;

  /**
   * Gradient stops for blur transition
   * @default [0, 100] (fully transparent to fully blurred)
   */
  gradientStops?: {
    start: number; // 0-100
    end: number;   // 0-100
  };

  /**
   * Background color behind the blur
   * @default 'transparent'
   */
  backgroundColor?: string;

  /**
   * Enable backdrop filter (modern browsers)
   * @default true
   */
  useBackdropFilter?: boolean;
}

export default function GradualBlur({
  direction = 'bottom',
  blurAmount = 8,
  height = '120px',
  width = '120px',
  className,
  zIndex = 10,
  gradientStops = { start: 0, end: 100 },
  backgroundColor = 'transparent',
  useBackdropFilter = true,
}: GradualBlurProps) {

  // Determine size based on direction
  const size = direction === 'top' || direction === 'bottom' ? height : width;

  // Create gradient based on direction
  const getGradientDirection = () => {
    switch (direction) {
      case 'top':
        return '180deg'; // top to bottom
      case 'bottom':
        return '0deg';   // bottom to top
      case 'left':
        return '90deg';  // left to right
      case 'right':
        return '270deg'; // right to left
      default:
        return '0deg';
    }
  };

  // Position the blur overlay
  const getPositionStyles = (): CSSProperties => {
    switch (direction) {
      case 'top':
        return {
          top: 0,
          left: 0,
          right: 0,
          height: size,
        };
      case 'bottom':
        return {
          bottom: 0,
          left: 0,
          right: 0,
          height: size,
        };
      case 'left':
        return {
          left: 0,
          top: 0,
          bottom: 0,
          width: size,
        };
      case 'right':
        return {
          right: 0,
          top: 0,
          bottom: 0,
          width: size,
        };
      default:
        return {};
    }
  };

  // Create blur mask gradient
  const maskGradient = `linear-gradient(
    ${getGradientDirection()},
    transparent ${gradientStops.start}%,
    black ${gradientStops.end}%
  )`;

  const style: CSSProperties = {
    ...getPositionStyles(),
    position: 'absolute',
    pointerEvents: 'none',
    zIndex,
    backgroundColor,
    WebkitMaskImage: maskGradient,
    maskImage: maskGradient,
    backdropFilter: useBackdropFilter ? `blur(${blurAmount}px)` : undefined,
    WebkitBackdropFilter: useBackdropFilter ? `blur(${blurAmount}px)` : undefined,
  };

  // Fallback for browsers without backdrop-filter support
  const fallbackStyle: CSSProperties = {
    ...getPositionStyles(),
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: zIndex - 1,
    background: `linear-gradient(
      ${getGradientDirection()},
      ${backgroundColor} ${gradientStops.start}%,
      transparent ${gradientStops.end}%
    )`,
    filter: `blur(${blurAmount}px)`,
  };

  return (
    <>
      {/* Main blur overlay */}
      <div
        className={cn('gradual-blur', className)}
        style={style}
        aria-hidden="true"
      />

      {/* Fallback for older browsers */}
      {!useBackdropFilter && (
        <div
          className="gradual-blur-fallback"
          style={fallbackStyle}
          aria-hidden="true"
        />
      )}
    </>
  );
}
