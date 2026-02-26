import type {
  DomainEventBusPort,
  DomainEventHandler,
} from '../../../application/ports/domain-event-bus.port';
import type { DomainEvent } from '../../../domain/events/domain-event';

export class InMemoryDomainEventBusAdapter implements DomainEventBusPort {
  private readonly handlers = new Map<string, DomainEventHandler[]>();

  subscribe<TEvent extends DomainEvent>(eventName: string, handler: DomainEventHandler<TEvent>): void {
    const registered = this.handlers.get(eventName) ?? [];
    registered.push(handler as DomainEventHandler);
    this.handlers.set(eventName, registered);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.name) ?? [];
    for (const handler of handlers) {
      await handler(event);
    }
  }
}
