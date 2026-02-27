export interface ProcessingFailureRepository {
  record(params: {
    jobName: string;
    payload: Record<string, unknown>;
    errorReason: string;
    retryCount: number;
  }): Promise<void>;
}
