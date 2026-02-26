function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class MinIntervalLimiter {
  private queue: Promise<unknown> = Promise.resolve();

  private lastRunMs = 0;

  constructor(private readonly minIntervalMs: number) {}

  schedule<T>(task: () => Promise<T>): Promise<T> {
    const run = async (): Promise<T> => {
      if (this.minIntervalMs > 0) {
        const now = Date.now();
        const delta = now - this.lastRunMs;
        const wait = this.minIntervalMs - delta;
        if (wait > 0) {
          await sleep(wait);
        }
      }

      this.lastRunMs = Date.now();
      return task();
    };

    const result = this.queue.then(run, run);
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }
}
