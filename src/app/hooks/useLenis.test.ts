import { GlobalRegistrator } from '@happy-dom/global-registrator';
GlobalRegistrator.register();

import { expect, test, describe, mock, beforeEach, afterEach } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { useLenis } from './useLenis';
import Lenis from 'lenis';

const mockLenisInstance = {
  raf: mock(),
  destroy: mock(),
};

mock.module('lenis', () => {
  return {
    default: mock(function () {
      return mockLenisInstance;
    })
  };
});

describe('useLenis', () => {
  let requestAnimationFrameSpy: ReturnType<typeof mock>;

  beforeEach(() => {
    mockLenisInstance.raf.mockClear();
    mockLenisInstance.destroy.mockClear();

    // @ts-ignore
    if (Lenis.mockClear) {
      // @ts-ignore
      Lenis.mockClear();
    }

    requestAnimationFrameSpy = mock((cb: FrameRequestCallback) => {
      return 123;
    });
    globalThis.requestAnimationFrame = requestAnimationFrameSpy;
  });

  afterEach(() => {
    mock.restore();
  });

  test('should initialize Lenis with correct options', () => {
    renderHook(() => useLenis());

    expect(Lenis).toHaveBeenCalledTimes(1);

    // @ts-ignore
    const args = Lenis.mock.calls[0][0];
    expect(args.duration).toBe(1.2);
    expect(args.touchMultiplier).toBe(2);
    expect(typeof args.easing).toBe('function');
  });

  test('should setup requestAnimationFrame loop', () => {
    renderHook(() => useLenis());

    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);

    const rafCallback = requestAnimationFrameSpy.mock.calls[0][0] as FrameRequestCallback;

    rafCallback(1000);

    expect(mockLenisInstance.raf).toHaveBeenCalledWith(1000);
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(2);
  });

  test('should cleanup on unmount', () => {
    const { unmount, result } = renderHook(() => useLenis());

    expect(result.current.current).toBe(mockLenisInstance);

    unmount();

    expect(mockLenisInstance.destroy).toHaveBeenCalledTimes(1);
    expect(result.current.current).toBeNull();
  });
});
