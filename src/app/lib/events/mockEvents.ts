import { PortalEvent, PortalEventType } from './eventTypes';

const mockTypes: PortalEventType[] = [
  'agent.message',
  'agent.eye_emotion',
  'portal.theme_change',
  'portal.spawn_card',
  'portal.demo_action',
  'system.log',
];

const payloads: Record<string, Record<string, unknown>> = {
  'agent.message': { text: 'Hello! I can generate charts, run simulations, and more.', agentId: 'nova' },
  'agent.eye_emotion': { emotion: 'happy', duration: 3000 },
  'portal.theme_change': { primaryColor: '#FF6B35', glowColor: '#FFB088' },
  'portal.spawn_card': { title: 'New Report Generated', type: 'report' },
  'portal.demo_action': { action: 'particle_burst', intensity: 0.7 },
  'system.log': { message: 'Autonomous cycle completed', status: 'ok' },
};

function genId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function generateMockEvents(count: number): PortalEvent[] {
  return Array.from({ length: count }, () => {
    const type = mockTypes[Math.floor(Math.random() * mockTypes.length)];
    return {
      id: genId(),
      type,
      timestamp: new Date().toISOString(),
      source: Math.random() > 0.5 ? 'agent' : 'system',
      agentId: 'nova',
      payload: payloads[type] || {},
      visibility: 'public',
      importance: Math.random() > 0.7 ? 'high' : 'normal',
    };
  });
}
