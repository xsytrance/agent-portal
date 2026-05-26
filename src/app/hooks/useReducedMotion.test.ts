import { describe, it, expect, beforeEach, mock, afterEach } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from './useReducedMotion';

describe('useReducedMotion', () => {
  let addEventListenerMock: ReturnType<typeof mock>;
  let removeEventListenerMock: ReturnType<typeof mock>;

  beforeEach(() => {
    addEventListenerMock = mock(() => {});
    removeEventListenerMock = mock(() => {});

    // Default mock setup for matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mock().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: mock(), // Deprecated but often needed in tests
        removeListener: mock(), // Deprecated
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
        dispatchEvent: mock(),
      })),
    });
  });

  afterEach(() => {
    // Clean up
    mock.restore();
  });

  it('should return false by default if media query does not match', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('should return true if media query matches', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mock().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: mock(),
        removeListener: mock(),
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
        dispatchEvent: mock(),
      })),
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('should update value when media query changes', () => {
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    // Find the event listener that was registered
    const listener = addEventListenerMock.mock.calls[0][1];

    // Simulate change event where matches becomes true
    act(() => {
      listener({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);
  });

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => useReducedMotion());

    expect(addEventListenerMock).toHaveBeenCalledTimes(1);
    const listener = addEventListenerMock.mock.calls[0][1];

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledTimes(1);
    expect(removeEventListenerMock).toHaveBeenCalledWith('change', listener);
  });
});
