import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from './useReducedMotion';

describe('useReducedMotion', () => {
  let addEventListenerMock: ReturnType<typeof mock>;
  let removeEventListenerMock: ReturnType<typeof mock>;
  let matchMediaMock: ReturnType<typeof mock>;

  beforeEach(() => {
    addEventListenerMock = mock(() => {});
    removeEventListenerMock = mock(() => {});

    matchMediaMock = mock((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      dispatchEvent: mock(() => true),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  it('should return false by default if matchMedia is false', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('should return true if matchMedia is true', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      dispatchEvent: mock(() => true),
    }));

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('should update when media query changes', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    expect(addEventListenerMock.mock.calls.length).toBe(1);
    expect(addEventListenerMock.mock.calls[0][0]).toBe('change');
    const handler = addEventListenerMock.mock.calls[0][1];

    act(() => {
      handler({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);
  });

  it('should clean up event listener on unmount', () => {
    const { unmount } = renderHook(() => useReducedMotion());

    unmount();

    expect(removeEventListenerMock.mock.calls.length).toBe(1);
    expect(removeEventListenerMock.mock.calls[0][0]).toBe('change');
    const addHandler = addEventListenerMock.mock.calls[0][1];
    const removeHandler = removeEventListenerMock.mock.calls[0][1];
    expect(addHandler).toBe(removeHandler);
  });
});
