import { describe, it, expect } from 'bun:test';
import { generateMockEvents } from './mockEvents';

describe('generateMockEvents', () => {
  it('should generate the specified number of events', () => {
    const events = generateMockEvents(5);
    expect(events.length).toBe(5);
  });

  it('should generate events with correct properties', () => {
    const events = generateMockEvents(1);
    const event = events[0];

    expect(event).toHaveProperty('id');
    expect(typeof event.id).toBe('string');

    expect(event).toHaveProperty('type');
    expect(typeof event.type).toBe('string');

    expect(event).toHaveProperty('timestamp');
    expect(typeof event.timestamp).toBe('string');

    expect(event).toHaveProperty('source');
    expect(['agent', 'system']).toContain(event.source);

    expect(event).toHaveProperty('agentId');
    expect(event.agentId).toBe('nova');

    expect(event).toHaveProperty('payload');
    expect(typeof event.payload).toBe('object');

    expect(event).toHaveProperty('visibility');
    expect(event.visibility).toBe('public');

    expect(event).toHaveProperty('importance');
    expect(['high', 'normal']).toContain(event.importance);
  });

  it('should generate events with expected payload for their type', () => {
    // Generate enough events to likely cover multiple types
    const events = generateMockEvents(50);

    for (const event of events) {
      if (event.type === 'agent.message') {
        expect(event.payload).toEqual({ text: 'Hello! I can generate charts, run simulations, and more.', agentId: 'nova' });
      } else if (event.type === 'agent.eye_emotion') {
        expect(event.payload).toEqual({ emotion: 'happy', duration: 3000 });
      } else if (event.type === 'portal.theme_change') {
        expect(event.payload).toEqual({ primaryColor: '#FF6B35', glowColor: '#FFB088' });
      } else if (event.type === 'portal.spawn_card') {
        expect(event.payload).toEqual({ title: 'New Report Generated', type: 'report' });
      } else if (event.type === 'portal.demo_action') {
        expect(event.payload).toEqual({ action: 'particle_burst', intensity: 0.7 });
      } else if (event.type === 'system.log') {
        expect(event.payload).toEqual({ message: 'Autonomous cycle completed', status: 'ok' });
      } else {
        throw new Error(`Unexpected event type: ${event.type}`);
      }
    }
  });

  it('should return an empty array if count is 0', () => {
    const events = generateMockEvents(0);
    expect(events.length).toBe(0);
  });
});
