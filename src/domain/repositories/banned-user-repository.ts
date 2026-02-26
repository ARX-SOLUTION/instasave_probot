import type { BannedUser } from '../entities/banned-user';

export interface BannedUserRepository {
  ban(entity: BannedUser): Promise<void>;
  unban(telegramUserId: string): Promise<void>;
  isBanned(telegramUserId: string): Promise<boolean>;
}
