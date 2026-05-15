import { InputSignal, InputSignalHandler } from './signalTypes';

export class SignalRouter {
  private handlers: Map<string, InputSignalHandler[]> = new Map();

  constructor() {
    // Phase 2a: Setup default routes
    this.handlers.set('all', []);
  }

  public routeSignal(signal: InputSignal): void {
    const specificHandlers = this.handlers.get(signal.type) || [];
    const globalHandlers = this.handlers.get('all') || [];

    const allHandlers = [...specificHandlers, ...globalHandlers];

    allHandlers.forEach(handler => {
      try {
        handler(signal);
      } catch (error) {
        console.error(`Error in signal handler for ${signal.type}:`, error);
      }
    });
  }

  public subscribe(signalType: string, handler: InputSignalHandler): () => void {
    if (!this.handlers.has(signalType)) {
      this.handlers.set(signalType, []);
    }

    this.handlers.get(signalType)!.push(handler);

    return () => {
      const currentHandlers = this.handlers.get(signalType) || [];
      this.handlers.set(signalType, currentHandlers.filter(h => h !== handler));
    };
  }
}
