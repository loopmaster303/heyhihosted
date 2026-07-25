import { act, renderHook } from '@testing-library/react';
import { usePrunaKey } from './usePrunaKey';

describe('usePrunaKey', () => {
  beforeEach(() => localStorage.clear());

  it('connects and disconnects a manual key', () => {
    const { result } = renderHook(() => usePrunaKey());

    act(() => result.current.connect('pruna_test_1234567890'));
    expect(result.current.isConnected).toBe(true);
    expect(result.current.prunaKey).toBe('pruna_test_1234567890');

    act(() => result.current.disconnect());
    expect(result.current.isConnected).toBe(false);
    expect(localStorage.getItem('prunaApiKey')).toBeNull();
  });

  it('ignores invalid manual keys', () => {
    const { result } = renderHook(() => usePrunaKey());
    act(() => result.current.connect('short'));
    expect(result.current.isConnected).toBe(false);
  });
});
