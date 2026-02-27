export interface QueuePublishOptions {
  singletonKey?: string;
}

export interface QueuePort {
  publish(
    queue: string,
    payload: Record<string, unknown>,
    options?: QueuePublishOptions,
  ): Promise<void>;
}
