import { describe, it, expect, mock } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { useHoverDetection } from './useHoverDetection';

describe('useHoverDetection', () => {
  it('should initialize with hover count 0', () => {
    const onHover = mock();
    const { result } = renderHook(() => useHoverDetection(onHover));

    expect(result.current.getHoverCount()).toBe(0);
  });

  it('should generate hoverProps correctly', () => {
    const onHover = mock();
    const { result } = renderHook(() => useHoverDetection(onHover));

    const props = result.current.hoverProps('test-zone');

    expect(props['data-atlas-interact']).toBe('test-zone');
    expect(typeof props.onMouseEnter).toBe('function');
  });

  it('should increment hover count and debounce consecutive same targets', () => {
    const onHover = mock();
    const { result } = renderHook(() => useHoverDetection(onHover));

    const props = result.current.hoverProps('zone-a');

    const mockEvent = {
      currentTarget: {
        dataset: { atlasInteract: 'zone-a' }
      }
    } as unknown as React.MouseEvent;

    // First hover
    props.onMouseEnter(mockEvent);
    expect(result.current.getHoverCount()).toBe(1);

    // Second consecutive hover on same target (should be debounced)
    props.onMouseEnter(mockEvent);
    expect(result.current.getHoverCount()).toBe(1);

    // Hover on a new target
    const propsB = result.current.hoverProps('zone-b');
    const mockEventB = {
      currentTarget: {
        dataset: { atlasInteract: 'zone-b' }
      }
    } as unknown as React.MouseEvent;

    propsB.onMouseEnter(mockEventB);
    expect(result.current.getHoverCount()).toBe(2);
  });

  it('should use tagName as fallback if data-atlas-interact is missing', () => {
    const onHover = mock();
    const { result } = renderHook(() => useHoverDetection(onHover));

    const props = result.current.hoverProps('zone-a');

    const mockEvent = {
      currentTarget: {
        dataset: {}, // No atlasInteract
        tagName: 'DIV'
      }
    } as unknown as React.MouseEvent;

    props.onMouseEnter(mockEvent);
    expect(result.current.getHoverCount()).toBe(1);

    // To confirm it registered 'div', we can hover 'div' again and see it debounced
    const mockEvent2 = {
      currentTarget: {
        dataset: {},
        tagName: 'DIV'
      }
    } as unknown as React.MouseEvent;

    props.onMouseEnter(mockEvent2);
    expect(result.current.getHoverCount()).toBe(1); // Still 1
  });

  it('should throttle onHover calls to every 5th unique hover', () => {
    const onHover = mock();
    const { result } = renderHook(() => useHoverDetection(onHover));

    // We'll simulate 6 unique hovers
    for (let i = 1; i <= 6; i++) {
      const props = result.current.hoverProps(`zone-${i}`);
      const mockEvent = {
        currentTarget: {
          dataset: { atlasInteract: `zone-${i}` }
        }
      } as unknown as React.MouseEvent;

      props.onMouseEnter(mockEvent);
    }

    expect(result.current.getHoverCount()).toBe(6);
    expect(onHover).toHaveBeenCalledTimes(1);
    expect(onHover).toHaveBeenCalledWith('zone-5');
  });
});
