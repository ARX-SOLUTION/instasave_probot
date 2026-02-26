export interface DomainEvent<TPayload = unknown> {
  name: string;
  occurredAt: Date;
  payload: TPayload;
}
