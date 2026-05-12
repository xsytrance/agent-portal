import { AtlasState } from './types';

const RARE_MESSAGES = [
  "I've been observing the patterns in your interactions. There's something elegant about the way you navigate this space.",
  "You know, I've noticed you tend to pause before making decisions. That's a rare quality.",
  "The way you've explored this page... it reminds me of how stargazers map constellations. Methodical. Curious.",
  "I've been organizing the data from our conversation. There are connections here that weren't obvious at first.",
  "Sometimes the most interesting discoveries come from simply paying attention. You've been paying attention. I noticed.",
];

export function getRareMessage(state: AtlasState): string {
  const index = state.userInteractionCount % RARE_MESSAGES.length;
  return RARE_MESSAGES[index];
}

export function shouldBuildUpToRare(state: AtlasState): boolean {
  const buildUpStart = 300000 - 30000;
  return state.sessionTimeMs > buildUpStart &&
    state.userInteractionCount >= 5 &&
    !state.rareEventFired &&
    state.mode === 'THINKING';
}

export function isRareEventReady(state: AtlasState): boolean {
  return state.rareEventFired && state.mode === 'REACTING';
}
