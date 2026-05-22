import { expect, test, describe, beforeAll, afterAll, beforeEach, mock } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { useReducedMotion } from "./useReducedMotion";

describe("useReducedMotion", () => {
  beforeAll(() => {
    GlobalRegistrator.register();
  });

  afterAll(() => {
    GlobalRegistrator.unregister();
  });

  let changeListeners: Array<(e: any) => void> = [];

  beforeEach(() => {
    changeListeners = [];
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mock((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: mock(), // Deprecated
        removeListener: mock(), // Deprecated
        addEventListener: mock((type: string, listener: any) => {
          if (type === 'change') {
            changeListeners.push(listener);
          }
        }),
        removeEventListener: mock((type: string, listener: any) => {
          if (type === 'change') {
            changeListeners = changeListeners.filter((l) => l !== listener);
          }
        }),
        dispatchEvent: mock(),
      })),
    });
  });

  test("returns false when prefers-reduced-motion is false", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  test("returns true when prefers-reduced-motion is true", () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mock((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: mock(),
        removeListener: mock(),
        addEventListener: mock(),
        removeEventListener: mock(),
        dispatchEvent: mock(),
      })),
    });

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  test("updates when change event is fired", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      changeListeners.forEach((listener) => listener({ matches: true }));
    });

    expect(result.current).toBe(true);

    act(() => {
      changeListeners.forEach((listener) => listener({ matches: false }));
    });

    expect(result.current).toBe(false);
  });

  test("cleans up event listener on unmount", () => {
    const removeEventListenerMock = mock();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mock((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: mock(),
        removeListener: mock(),
        addEventListener: mock((type: string, listener: any) => {
          if (type === 'change') {
            changeListeners.push(listener);
          }
        }),
        removeEventListener: removeEventListenerMock,
        dispatchEvent: mock(),
      })),
    });

    const { unmount } = renderHook(() => useReducedMotion());

    expect(changeListeners.length).toBe(1);

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledTimes(1);
    expect(removeEventListenerMock.mock.calls[0][0]).toBe('change');
  });
});
