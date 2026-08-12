import { act, renderHook } from '@testing-library/react';
import { usePlaygroundState } from './usePlaygroundState';

describe('usePlaygroundState', () => {
  beforeEach(() => localStorage.clear());

  it('starts with defaults', () => {
    const { result } = renderHook(() => usePlaygroundState());
    expect(result.current.state.mode).toBe('t2i');
    expect(result.current.state.modelId).toBeNull();
    expect(result.current.state.prompt).toBe('');
    expect(result.current.state.params).toEqual({});
    expect(result.current.state.uploads).toEqual([]);
  });

  it('persists mode change to localStorage', () => {
    const { result } = renderHook(() => usePlaygroundState());
    act(() => result.current.setMode('t2v'));
    const raw = JSON.parse(localStorage.getItem('playgroundState')!);
    expect(raw.mode).toBe('t2v');
  });

  it('resetForModel merges defaults but preserves prompt and uploads', () => {
    const { result } = renderHook(() => usePlaygroundState());
    act(() => result.current.setPrompt('hello'));
    act(() => result.current.setUploads(['https://example.com/a.png']));
    act(() => result.current.resetForModel({ params: { width: 1024 } }));
    expect(result.current.state.prompt).toBe('hello');
    expect(result.current.state.uploads).toEqual(['https://example.com/a.png']);
    expect(result.current.state.params).toEqual({ width: 1024 });
  });

  it('sets params', () => {
    const { result } = renderHook(() => usePlaygroundState());
    act(() => result.current.setParams({ seed: 42, aspect_ratio: '16:9' }));
    expect(result.current.state.params).toEqual({ seed: 42, aspect_ratio: '16:9' });
  });
});

describe('usePlaygroundState migration', () => {
  // Vor dem Parameter-Umbau lagen seed/negativePrompt/guidance/steps im
  // gespeicherten Zustand und kein params. Ein solcher Eintrag ersetzte die
  // Vorgabe komplett, state.params wurde undefined und ParamControls starb mit
  // "undefined is not an object (evaluating 'values.image')".
  it('fills in fields a stored state from an older version does not have', () => {
    localStorage.setItem('playgroundState', JSON.stringify({
      mode: 't2i', modelId: 'flux', prompt: 'alt',
      seed: '42', negativePrompt: 'x', guidance: '7', steps: '30',
    }));

    const { result } = renderHook(() => usePlaygroundState());

    expect(result.current.state.params).toEqual({});
    expect(result.current.state.uploads).toEqual([]);
    expect(result.current.state.sourceVideo).toBeNull();
    // Was der alte Eintrag kennt, bleibt erhalten.
    expect(result.current.state.prompt).toBe('alt');
    expect(result.current.state.modelId).toBe('flux');
  });

  it('survives a stored state whose uploads are not an array', () => {
    localStorage.setItem('playgroundState', JSON.stringify({ uploads: 'kaputt' }));
    const { result } = renderHook(() => usePlaygroundState());
    expect(result.current.state.uploads).toEqual([]);
  });
});
