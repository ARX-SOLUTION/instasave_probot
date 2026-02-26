export interface BotConfigRepository {
  setValue(key: string, value: unknown): Promise<void>;
  getValue<T>(key: string): Promise<T | null>;
}
