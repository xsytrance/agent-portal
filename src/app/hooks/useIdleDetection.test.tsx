import { renderHook, act } from '@testing-library/react';
import { useIdleDetection } from './useIdleDetection';
import { describe, it, expect, mock } from 'bun:test';
import { setTimeout } from 'timers/promises';

describe('useIdleDetection', () => {
  it('should be initially active', () => {
    const { result } = renderHook(() => useIdleDetection());
    expect(result.current.isIdle()).toBe(false);
  });

  it('should become idle after default timeout', async () => {
    const onIdle = mock();
    const { result } = renderHook(() => useIdleDetection({ timeoutMs: 50, onIdle }));

    expect(result.current.isIdle()).toBe(false);
    expect(onIdle).not.toHaveBeenCalled();

    await act(async () => {
      await setTimeout(60);
    });

    expect(result.current.isIdle()).toBe(true);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('should call onActive when returning from idle', async () => {
    const onIdle = mock();
    const onActive = mock();
    const { result } = renderHook(() => useIdleDetection({ timeoutMs: 50, onIdle, onActive }));

    await act(async () => {
      await setTimeout(60);
    });

    expect(result.current.isIdle()).toBe(true);
    expect(onIdle).toHaveBeenCalledTimes(1);
    expect(onActive).not.toHaveBeenCalled();

    // Trigger activity
    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });

    expect(result.current.isIdle()).toBe(false);
    expect(onActive).toHaveBeenCalledTimes(1);
  });

  it('should not become idle if events keep firing', async () => {
    const onIdle = mock();
    const { result } = renderHook(() => useIdleDetection({ timeoutMs: 100, onIdle }));

    // Wait half the timeout, then fire an event
    await act(async () => {
      await setTimeout(60);
    });

    act(() => {
      window.dispatchEvent(new Event('keydown'));
    });

    // Wait another half timeout (total 120ms > 100ms), should still be active
    await act(async () => {
      await setTimeout(60);
    });

    expect(result.current.isIdle()).toBe(false);
    expect(onIdle).not.toHaveBeenCalled();

    // Now wait fully without events
    await act(async () => {
      await setTimeout(110);
    });

    expect(result.current.isIdle()).toBe(true);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('should cleanup timer on unmount', async () => {
    const onIdle = mock();
    const { result, unmount } = renderHook(() => useIdleDetection({ timeoutMs: 50, onIdle }));

    unmount();

    await act(async () => {
      await setTimeout(60);
    });

    // Since it was unmounted, it should not have triggered the timeout
    expect(onIdle).not.toHaveBeenCalled();
    // And isIdle should technically still be false based on the ref
    expect(result.current.isIdle()).toBe(false);
  });

  it('should respond to multiple interactive events', async () => {
    const onIdle = mock();
    const onActive = mock();
    const { result } = renderHook(() => useIdleDetection({ timeoutMs: 50, onIdle, onActive }));

    await act(async () => {
      await setTimeout(60);
    });

    expect(result.current.isIdle()).toBe(true);

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

    for (const event of events) {
      act(() => {
        window.dispatchEvent(new Event(event));
      });
      expect(result.current.isIdle()).toBe(false);

      // Wait for it to become idle again
      await act(async () => {
        await setTimeout(60);
      });
      expect(result.current.isIdle()).toBe(true);
    }

    // onIdle should be called once for initial timeout + once per event (6)
    expect(onIdle).toHaveBeenCalledTimes(7);
    // onActive should be called once per event (6)
    expect(onActive).toHaveBeenCalledTimes(6);
  });
});
