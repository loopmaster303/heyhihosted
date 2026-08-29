import { renderHook } from '@testing-library/react';
import { useViewportHeight } from './useViewportHeight';

type Listener = () => void;

function fakeViewport(height: number) {
  const listeners: Listener[] = [];
  const vv = {
    height,
    addEventListener: (_: string, fn: Listener) => { listeners.push(fn); },
    removeEventListener: (_: string, fn: Listener) => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    },
  };
  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true });
  return {
    resizeTo(next: number) { vv.height = next; listeners.forEach((fn) => fn()); },
    get listenerCount() { return listeners.length; },
  };
}

afterEach(() => {
  Object.defineProperty(window, 'visualViewport', { value: undefined, configurable: true });
  document.documentElement.style.removeProperty('--vvh');
});

test('setzt --vvh auf die Hoehe des visual viewport', () => {
  fakeViewport(812);
  renderHook(() => useViewportHeight());
  expect(document.documentElement.style.getPropertyValue('--vvh')).toBe('812px');
});

test('zieht --vvh nach, wenn die Tastatur den viewport verkleinert', () => {
  const vv = fakeViewport(812);
  renderHook(() => useViewportHeight());
  vv.resizeTo(476);
  expect(document.documentElement.style.getPropertyValue('--vvh')).toBe('476px');
});

test('raeumt Listener und Variable beim Unmount ab', () => {
  const vv = fakeViewport(812);
  const { unmount } = renderHook(() => useViewportHeight());
  unmount();
  expect(vv.listenerCount).toBe(0);
  expect(document.documentElement.style.getPropertyValue('--vvh')).toBe('');
});

test('ohne visualViewport passiert nichts', () => {
  renderHook(() => useViewportHeight());
  expect(document.documentElement.style.getPropertyValue('--vvh')).toBe('');
});
