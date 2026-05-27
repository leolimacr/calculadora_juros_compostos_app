export interface DomainEvent<T = any> {
  timestamp: number;
  domain: string;
  type: string;
  payload: T;
  correlationId: string;
  source: string;
}

type EventHandler<T = any> = (event: DomainEvent<T>) => void | Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe<T>(eventType: string, handler: EventHandler<T>) {
    const eventHandlers = this.handlers.get(eventType) || [];
    eventHandlers.push(handler);
    this.handlers.set(eventType, eventHandlers);
    return () => this.unsubscribe(eventType, handler);
  }

  private unsubscribe(eventType: string, handler: EventHandler) {
    const eventHandlers = this.handlers.get(eventType);
    if (eventHandlers) {
      this.handlers.set(eventType, eventHandlers.filter(h => h !== handler));
    }
  }

  async publish<T>(event: DomainEvent<T>) {
    const eventHandlers = this.handlers.get(event.type) || [];
    await Promise.all(eventHandlers.map(handler => handler(event)));
  }
}

export const eventBus = new EventBus();
