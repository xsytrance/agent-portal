'use server';

import { PortalEvent, PortalEventVisibility } from './eventTypes';
import { debug } from '../logger';

const MAX_SIZE = 500;
const PRUNE_TARGET = 250;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface StoreStats {
  totalStored: number;
  sequence: number;
  lastPruned: string;
}

let events: PortalEvent[] = [];
let sequence = 0;
let lastPrunedAt = new Date().toISOString();

function prune(): void {
  const now = Date.now();
  const beforeCount = events.length;
  events = events.filter(e => {
    const eventTime = new Date(e.timestamp).getTime();
    return now - eventTime < MAX_AGE_MS;
  });
  if (events.length > MAX_SIZE) events = events.slice(-PRUNE_TARGET);
  if (events.length < beforeCount) {
    lastPrunedAt = new Date().toISOString();
    debug('event-store', `Pruned ${beforeCount - events.length} events`, { details: { total: events.length, sequence } });
  }
}

export async function addEvent(event: PortalEvent): Promise<number> {
  prune();
  events.push(event);
  sequence++;
  if (events.length > MAX_SIZE) {
    events = events.slice(-PRUNE_TARGET);
    lastPrunedAt = new Date().toISOString();
  }
  return sequence;
}

export async function getRecentEvents(count: number): Promise<PortalEvent[]> {
  prune();
  return events.slice(-Math.min(count, MAX_SIZE));
}

export async function getRecentByVisibility(count: number, visibility: PortalEventVisibility): Promise<PortalEvent[]> {
  prune();
  return events.filter(e => e.visibility === visibility).slice(-Math.min(count, MAX_SIZE));
}

export async function getSequence(): Promise<number> { return sequence; }

export async function getStats(): Promise<StoreStats> {
  return { totalStored: events.length, sequence, lastPruned: lastPrunedAt };
}

export async function clearAll(): Promise<void> {
  events = []; sequence = 0; lastPrunedAt = new Date().toISOString();
  await debug('event-store', 'All events cleared');
}
