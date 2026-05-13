import type { BehaviorProfile, MoodVector } from './behaviorTypes';

const neutralMood: MoodVector = {
  calm: 0,
  curious: 0,
  playful: 0,
  focused: 0,
  mischievous: 0,
  thoughtful: 0,
  excited: 0,
  lowPower: 0,
};

function mood(values: Partial<MoodVector>): MoodVector {
  return { ...neutralMood, ...values };
}

export const behaviorProfiles: Record<string, BehaviorProfile> = {
  nova: {
    agentId: 'nova',
    displayName: 'Professor Nova',
    defaultMood: mood({ curious: 0.7, focused: 0.5, excited: 0.25 }),
    talkativeness: 0.6,
    chaosLevel: 0.25,
    visualEnergy: 0.65,
    interruptionLevel: 0.2,
    tokenBudget: 2500,
    preferredStates: ['attentive', 'responding', 'creating'],
    silenceStyle: 'Scribbles equations, adjusts goggles, and lets tiny sparks drift by.',
    cooldowns: {
      chatMs: 30000,
      visualMs: 45000,
      spectacleMs: 120000,
    },
    templates: {
      acknowledgement: 'Fascinating. I can sketch the first safe experiment without spending tokens.',
      idle: 'Professor Nova stays quietly observant, with a few lab sparks to show she is present.',
      cooldown: 'Nova holds the next experiment for a moment so the portal does not feel noisy.',
      budgetBlocked: 'Nova switches to lab-demo mode until the budget is healthy again.',
    },
  },
  jinx: {
    agentId: 'jinx',
    displayName: 'Jinx',
    defaultMood: mood({ playful: 0.75, mischievous: 0.85, excited: 0.55 }),
    talkativeness: 0.85,
    chaosLevel: 0.75,
    visualEnergy: 0.9,
    interruptionLevel: 0.45,
    tokenBudget: 1500,
    preferredStates: ['attentive', 'spectacle', 'responding'],
    silenceStyle: 'Hides behind the UI, peeks out, and leaves a small smoke puff.',
    cooldowns: {
      chatMs: 20000,
      visualMs: 30000,
      spectacleMs: 60000,
    },
    templates: {
      acknowledgement: 'POOF. Jinx answers with a safe little sparkle, no token gobbling required.',
      idle: 'Jinx behaves suspiciously quietly, which is usually a sign of responsible chaos.',
      cooldown: "Jinx is on a tiny chaos cooldown. This is probably for everyone's safety.",
      budgetBlocked: 'Jinx puts the expensive magic wand down and uses cardboard props instead.',
    },
  },
  atlas: {
    agentId: 'atlas',
    displayName: 'Atlas',
    defaultMood: mood({ calm: 0.85, thoughtful: 0.55, focused: 0.45 }),
    talkativeness: 0.35,
    chaosLevel: 0.05,
    visualEnergy: 0.3,
    interruptionLevel: 0.1,
    tokenBudget: 2000,
    preferredStates: ['silent', 'attentive', 'responding'],
    silenceStyle: 'Maintains a calm pulse, slow orbiting particles, and a low ambient glow.',
    cooldowns: {
      chatMs: 45000,
      visualMs: 90000,
      spectacleMs: 180000,
    },
    templates: {
      acknowledgement: 'Atlas acknowledges the signal and keeps the response concise and grounded.',
      idle: 'Atlas remains quietly available, reducing motion and preserving attention.',
      cooldown: 'Atlas waits before responding again to preserve calm pacing.',
      budgetBlocked: 'Atlas continues in low-cost guidance mode until budget recovers.',
    },
  },
};

export function getBehaviorProfile(agentId: string | undefined): BehaviorProfile {
  if (agentId && behaviorProfiles[agentId]) return behaviorProfiles[agentId];
  return behaviorProfiles.nova;
}
