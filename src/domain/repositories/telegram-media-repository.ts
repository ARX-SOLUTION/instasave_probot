import type { TelegramMedia } from '../entities/telegram-media';

export interface TelegramMediaRepository {
  save(entity: TelegramMedia): Promise<TelegramMedia>;
  findByFileUniqueId(fileUniqueId: string): Promise<TelegramMedia | null>;
}
