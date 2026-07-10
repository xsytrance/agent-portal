// ============================================
// Emotion protocol — ported from sayhai (the desktop companion).
//
// The model starts every reply with its emotion in brackets:
//   [excited] ohhh you found the eye? bold move.
// The moment the reply lands we know the mood, so the presence layer
// (eye + particles) can react to WHAT was said, not just THAT something
// was said. Single source of truth shared by the chat route (which
// builds the prompt and parses the reply) and the brain (which maps
// emotions to behavior).
// ============================================

export const EMOTIONS = [
  'neutral',
  'happy',
  'excited',
  'mischievous',
  'curious',
  'thinking',
  'surprised',
  'sad',
  'sleepy',
  'grumpy',
  'love',
  'dizzy',
] as const;

export type AgentEmotion = (typeof EMOTIONS)[number];

/** Appended to every agent's persona so replies carry their emotion. */
export function emotionProtocol(): string {
  return `
FORMAT — reply with your emotion in square brackets, then your reply, nothing else:
[<one of: ${EMOTIONS.join(', ')}>] <your reply>
Example: [mischievous] ohhh you found the eye? bold move.`;
}

const BRACKET_RE = /^\s*\[([a-z]+)\]\s*/i;
const STRAY_TAG_RE = new RegExp(`\\s*\\[(?:${EMOTIONS.join('|')})\\]\\s*`, 'gi');

/**
 * Paranoid parse of an emotion-tagged reply (never throws).
 * Unknown or missing emotions fall back to 'neutral' and the text
 * is returned untouched minus the bracket prefix. Enthusiastic models
 * sometimes emote mid-reply too — stray tags are scrubbed from the body.
 */
export function parseEmotionReply(raw: string): { emotion: AgentEmotion; text: string } {
  const match = raw.match(BRACKET_RE);
  if (match) {
    const candidate = match[1].toLowerCase() as AgentEmotion;
    const text = raw.slice(match[0].length).replace(STRAY_TAG_RE, ' ').trim();
    if ((EMOTIONS as readonly string[]).includes(candidate) && text) {
      return { emotion: candidate, text };
    }
    if (text) return { emotion: 'neutral', text };
  }
  return { emotion: 'neutral', text: raw.replace(STRAY_TAG_RE, ' ').trim() };
}
