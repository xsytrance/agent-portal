type EventCallback<T = unknown> = (payload: T) => void;

class AgentEventBus {
  private static instance: AgentEventBus;
  private listeners: Map<string, Set<EventCallback<unknown>>>;

  private constructor() {
    this.listeners = new Map();
  }

  public static getInstance(): AgentEventBus {
    if (!AgentEventBus.instance) {
      AgentEventBus.instance = new AgentEventBus();
    }
    return AgentEventBus.instance;
  }

  public subscribe<T = unknown>(eventType: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback as EventCallback<unknown>);

    return () => this.unsubscribe(eventType, callback);
  }

  public unsubscribe<T = unknown>(eventType: string, callback: EventCallback<T>): void {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.delete(callback as EventCallback<unknown>);
      if (this.listeners.get(eventType)!.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  public publish<T = unknown>(eventType: string, payload: T): void {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  // Clear all listeners (mostly useful for testing)
  public clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = AgentEventBus.getInstance();
