import { describe, it, expect } from 'bun:test';
import { getRareMessage, shouldBuildUpToRare, isRareEventReady } from './rare';
import { AtlasState } from './types';

const mockState: AtlasState = {
  mode: 'OBSERVING',
  mood: 'calm',
  attentionLevel: 50,
  silenceMode: 'OBSERVING',
  sessionTimeMs: 0,
  lastActivityMs: 0,
  lastBehaviorChangeMs: 0,
  behaviorChangeCount: 0,
  rareEventFired: false,
  userInteractionCount: 0,
  isIdle: false,
  density: 'low'
};

describe('rare functions', () => {
  describe('getRareMessage', () => {
    it('should return the first message when userInteractionCount is 0', () => {
      const state = { ...mockState, userInteractionCount: 0 };
      const message = getRareMessage(state);
      expect(message).toBe("I've been observing the patterns in your interactions. There's something elegant about the way you navigate this space.");
    });

    it('should return the second message when userInteractionCount is 1', () => {
      const state = { ...mockState, userInteractionCount: 1 };
      const message = getRareMessage(state);
      expect(message).toBe("You know, I've noticed you tend to pause before making decisions. That's a rare quality.");
    });

    it('should cycle back to the first message when userInteractionCount equals the number of messages', () => {
      const state = { ...mockState, userInteractionCount: 5 };
      const message = getRareMessage(state);
      expect(message).toBe("I've been observing the patterns in your interactions. There's something elegant about the way you navigate this space.");
    });
  });

  describe('shouldBuildUpToRare', () => {
    it('should return true when all conditions are met', () => {
      const state: AtlasState = {
        ...mockState,
        sessionTimeMs: 270001,
        userInteractionCount: 5,
        rareEventFired: false,
        mode: 'THINKING'
      };
      expect(shouldBuildUpToRare(state)).toBe(true);
    });

    it('should return false when sessionTimeMs is 270000 or less', () => {
      const state: AtlasState = {
        ...mockState,
        sessionTimeMs: 270000,
        userInteractionCount: 5,
        rareEventFired: false,
        mode: 'THINKING'
      };
      expect(shouldBuildUpToRare(state)).toBe(false);
    });

    it('should return false when userInteractionCount is less than 5', () => {
      const state: AtlasState = {
        ...mockState,
        sessionTimeMs: 270001,
        userInteractionCount: 4,
        rareEventFired: false,
        mode: 'THINKING'
      };
      expect(shouldBuildUpToRare(state)).toBe(false);
    });

    it('should return false when rareEventFired is true', () => {
      const state: AtlasState = {
        ...mockState,
        sessionTimeMs: 270001,
        userInteractionCount: 5,
        rareEventFired: true,
        mode: 'THINKING'
      };
      expect(shouldBuildUpToRare(state)).toBe(false);
    });

    it('should return false when mode is not THINKING', () => {
      const state: AtlasState = {
        ...mockState,
        sessionTimeMs: 270001,
        userInteractionCount: 5,
        rareEventFired: false,
        mode: 'OBSERVING'
      };
      expect(shouldBuildUpToRare(state)).toBe(false);
    });
  });

  describe('isRareEventReady', () => {
    it('should return true when rareEventFired is true and mode is REACTING', () => {
      const state: AtlasState = {
        ...mockState,
        rareEventFired: true,
        mode: 'REACTING'
      };
      expect(isRareEventReady(state)).toBe(true);
    });

    it('should return false when rareEventFired is false', () => {
      const state: AtlasState = {
        ...mockState,
        rareEventFired: false,
        mode: 'REACTING'
      };
      expect(isRareEventReady(state)).toBe(false);
    });

    it('should return false when mode is not REACTING', () => {
      const state: AtlasState = {
        ...mockState,
        rareEventFired: true,
        mode: 'THINKING'
      };
      expect(isRareEventReady(state)).toBe(false);
    });
  });
});
