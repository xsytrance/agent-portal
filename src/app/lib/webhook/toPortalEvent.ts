import type { Signal } from '../behavior/types';
import type { PortalEvent } from '../events/eventTypes';

const MAX_MESSAGE_CHARS = 200;

/**
 * Convert a normalized external Signal into a public PortalEvent the
 * frontend theater can react to. This is the handoff that used to be
 * a `// behaviorDirector.ingestSignal(signal)` comment.
 *
 * Only a whitelisted, length-capped `message` string survives into the
 * public payload — webhook bodies are external input and these events
 * are shown to every visitor.
 */
export function signalToPortalEvent(signal: Signal): PortalEvent {
  const rawMessage = signal.payload?.message;
  const message =
    typeof rawMessage === 'string' && rawMessage.trim()
      ? rawMessage.trim().slice(0, MAX_MESSAGE_CHARS)
      : undefined;

  return {
    id: signal.id,
    type: 'portal.feed_item',
    timestamp: new Date(signal.timestamp).toISOString(),
    source: 'external',
    payload: {
      signalType: signal.type,
      urgency: signal.urgency,
      ...(message ? { message } : {}),
    },
    visibility: 'public',
    importance: signal.urgency > 0.7 ? 'high' : 'normal',
  };
}
