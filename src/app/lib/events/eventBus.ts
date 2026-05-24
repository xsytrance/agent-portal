import { Signal, AgentPersonality } from '../behavior/types';

type SignalHandler = (signal: Signal) => void;

export class AgentEventBus {
  private static instance: AgentEventBus;
  private listeners: Map<AgentPersonality, Set<SignalHandler>> = new Map();

  private constructor() {}

  public static getInstance(): AgentEventBus {
    if (!AgentEventBus.instance) {
      AgentEventBus.instance = new AgentEventBus();
    }
    return AgentEventBus.instance;
  }

  public subscribe(agentId: AgentPersonality, handler: SignalHandler): () => void {
    if (!this.listeners.has(agentId)) {
      this.listeners.set(agentId, new Set());
    }
    this.listeners.get(agentId)!.add(handler);

    return () => {
      const agentListeners = this.listeners.get(agentId);
      if (agentListeners) {
        agentListeners.delete(handler);
        if (agentListeners.size === 0) {
          this.listeners.delete(agentId);
        }
      }
    };
  }

  public dispatch(targetAgentId: AgentPersonality, signal: Signal): void {
    const handlers = this.listeners.get(targetAgentId);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(signal);
        } catch (error) {
          console.error(`Error in AgentEventBus handler for ${targetAgentId}:`, error);
        }
      });
    }
  }

  public broadcast(signal: Signal): void {
    this.listeners.forEach(handlers => {
      handlers.forEach(handler => {
        try {
          handler(signal);
        } catch (error) {
           console.error(`Error in AgentEventBus broadcast handler:`, error);
        }
      });
    });
  }
}

export const agentEventBus = AgentEventBus.getInstance();
