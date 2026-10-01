import { act, renderHook } from '@testing-library/react';
import { usePanelState } from './usePanelState';

let search = '';
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(search),
}));

describe('usePanelState — das offene Sheet steht in der Adresse', () => {
  let push: jest.SpyInstance;
  let replace: jest.SpyInstance;
  let back: jest.SpyInstance;

  beforeEach(() => {
    search = '';
    window.history.replaceState(null, '', '/');
    push = jest.spyOn(window.history, 'pushState');
    replace = jest.spyOn(window.history, 'replaceState');
    back = jest.spyOn(window.history, 'back').mockImplementation(() => {});
  });

  afterEach(() => {
    push.mockRestore();
    replace.mockRestore();
    back.mockRestore();
  });

  it('opens with a history entry, so Back closes the sheet instead of leaving the app', () => {
    const { result, rerender } = renderHook(() => usePanelState());
    act(() => result.current.openPanel('settings'));
    expect(push).toHaveBeenCalledWith(null, '', '/?panel=settings');

    search = 'panel=settings';
    rerender();
    expect(result.current.panel).toBe('settings');

    act(() => result.current.closePanel());
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('switches between sheets without stacking history entries', () => {
    search = 'panel=history';
    const { result } = renderHook(() => usePanelState());
    act(() => result.current.openPanel('gallery'));
    expect(push).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith(null, '', '/?panel=gallery');
  });

  it('closes a deep-linked sheet in place — Back would leave the app', () => {
    search = 'panel=settings';
    const { result } = renderHook(() => usePanelState());
    act(() => result.current.closePanel());
    expect(back).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith(null, '', '/');
  });

  it('ignores unknown panels in the address', () => {
    search = 'panel=evil';
    const { result } = renderHook(() => usePanelState());
    expect(result.current.panel).toBeNull();
  });
});
