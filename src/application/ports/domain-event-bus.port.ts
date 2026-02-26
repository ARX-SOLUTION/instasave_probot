import type { DomainEvent } from '../../domain/events/domain-event';

export type DomainEventHandler<TEvent extends DomainEvent = DomainEvent> = (
  event: TEvent,
) => Promise<void> | void;

export interface DomainEventBusPort {
  publish(event: DomainEvent): Promise<void>;
  subscribe<TEvent extends DomainEvent>(
    eventName: string,
    handler: DomainEventHandler<TEvent>,
  ): void;
}
