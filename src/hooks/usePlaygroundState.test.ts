import { act, renderHook } from '@testing-library/react';
import { usePlaygroundState } from './usePlaygroundState';

describe('usePlaygroundState', () => {
  beforeEach(() => localStorage.clear());

  it('starts with defaults', () => {
    const { result } = renderHook(() => usePlaygroundState());
    expect(result.current.state.mode).toBe('t2i');
    expect(result.current.state.modelId).toBeNull();
    expect(result.current.state.prompt).toBe('');
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
    act(() => result.current.resetForModel({ aspectRatio: '16:9', durationSeconds: 5 }));
    expect(result.current.state.prompt).toBe('hello');
    expect(result.current.state.uploads).toEqual(['https://example.com/a.png']);
    expect(result.current.state.aspectRatio).toBe('16:9');
    expect(result.current.state.durationSeconds).toBe(5);
  });
});
