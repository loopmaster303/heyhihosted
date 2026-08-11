import { readLocal, writeLocal, removeLocal } from './safe-storage';

/**
 * Safari verweigert den Zugriff auf localStorage in mehreren Lagen und wirft
 * dabei, statt null zu liefern. Genau das hat den Playground auf dem iPhone
 * beim Hydrieren zerlegt: "Application error: a client-side exception".
 */
function withThrowingStorage(run: () => void) {
  const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    },
  });
  try {
    run();
  } finally {
    if (original) Object.defineProperty(window, 'localStorage', original);
    else delete (window as unknown as Record<string, unknown>).localStorage;
  }
}

describe('safe-storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a value when storage works', () => {
    expect(writeLocal('k', 'v')).toBe(true);
    expect(readLocal('k')).toBe('v');
    removeLocal('k');
    expect(readLocal('k')).toBeNull();
  });

  it('returns null instead of throwing when storage is blocked', () => {
    withThrowingStorage(() => {
      expect(() => readLocal('k')).not.toThrow();
      expect(readLocal('k')).toBeNull();
    });
  });

  it('reports a failed write instead of throwing', () => {
    withThrowingStorage(() => {
      expect(() => writeLocal('k', 'v')).not.toThrow();
      expect(writeLocal('k', 'v')).toBe(false);
    });
  });

  it('swallows a failed removal', () => {
    withThrowingStorage(() => {
      expect(() => removeLocal('k')).not.toThrow();
    });
  });
});
