/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery';

describe('useMediaQuery', () => {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let matches = false;

  beforeEach(() => {
    listeners.clear();
    matches = false;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: jest.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.add(listener);
        }),
        removeEventListener: jest.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
          listeners.delete(listener);
        }),
        dispatchEvent: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });
  });

  it('returns the current media query match and updates on changes', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 640px)'));

    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
    });

    expect(result.current).toBe(true);
  });
});
