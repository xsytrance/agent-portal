import { describe, it, expect, spyOn, afterEach } from 'bun:test';
import { classifyEvent } from './costTiers';

describe('classifyEvent', () => {
  let consoleWarnMock: any;

  afterEach(() => {
    if (consoleWarnMock) {
      consoleWarnMock.mockRestore();
    }
  });

  it('should return "free" for known free events', () => {
    expect(classifyEvent('eye:blink')).toBe('free');
    expect(classifyEvent('ui:repaint')).toBe('free');
  });

  it('should return "cheap" for known cheap events', () => {
    expect(classifyEvent('message:template')).toBe('cheap');
    expect(classifyEvent('summary:simple')).toBe('cheap');
  });

  it('should return "expensive" for known expensive events', () => {
    expect(classifyEvent('llm:chat_completion')).toBe('expensive');
    expect(classifyEvent('web:live_search')).toBe('expensive');
  });

  it('should default to "expensive" and log a warning for unknown event types', () => {
    consoleWarnMock = spyOn(console, 'warn').mockImplementation(() => {});

    expect(classifyEvent('unknown:event')).toBe('expensive');

    expect(consoleWarnMock).toHaveBeenCalled();
    expect(consoleWarnMock.mock.calls[0][0]).toContain('Unknown event type "unknown:event" -- defaulting to expensive tier');
  });

  it('should handle empty string as unknown event', () => {
    consoleWarnMock = spyOn(console, 'warn').mockImplementation(() => {});

    expect(classifyEvent('')).toBe('expensive');

    expect(consoleWarnMock).toHaveBeenCalled();
  });
});
