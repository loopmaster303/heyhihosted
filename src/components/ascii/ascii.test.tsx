/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { AsciiSpinner, AsciiProgress, AsciiDone, AsciiSignature } from './index';

const setReducedMotion = (reduced: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: reduced,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      onchange: null,
      dispatchEvent: jest.fn(),
    }),
  });
};

describe('ASCII-Effekte', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setReducedMotion(false);
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps the effect visible but frozen under reduced motion — a loading state must not vanish', () => {
    setReducedMotion(true);
    const { container } = render(<AsciiSpinner label="denkt nach" />);
    const glyph = container.querySelector('[aria-hidden="true"]');
    expect(glyph?.textContent).toBe('⠋');

    act(() => { jest.advanceTimersByTime(1000); });
    expect(glyph?.textContent).toBe('⠋');
  });

  it('advances frames when motion is allowed', () => {
    const { container } = render(<AsciiSpinner />);
    const glyph = container.querySelector('[aria-hidden="true"]');
    expect(glyph?.textContent).toBe('⠋');

    act(() => { jest.advanceTimersByTime(80); });
    expect(glyph?.textContent).toBe('⠙');
  });

  it('exposes the real state as text, never as spinner glyphs', () => {
    render(<AsciiSpinner label="denkt nach" />);
    const live = screen.getByText('denkt nach');
    expect(live).toHaveAttribute('aria-live', 'polite');
    // Das animierte Zeichen selbst bleibt fuer Screenreader unsichtbar.
    expect(live.getAttribute('aria-hidden')).toBeNull();
  });

  it('clamps progress and reports the number in the live region', () => {
    render(<AsciiProgress value={140} />);
    expect(screen.getByText('100%')).toHaveAttribute('aria-live', 'polite');
  });

  it('stops the done glyph on its last frame instead of looping', () => {
    const { container } = render(<AsciiDone label="Bild fertig" />);
    act(() => { jest.advanceTimersByTime(2000); });
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe('◉');
  });

  it('holds the signature still when it is not the active mode', () => {
    const { container } = render(<AsciiSignature pattern="≈ ≈ ≈" active={false} />);
    const sig = container.querySelector('[aria-hidden="true"]');
    act(() => { jest.advanceTimersByTime(1000); });
    expect(sig?.textContent).toBe('≈ ≈ ≈');
  });
});
