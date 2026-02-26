import { eq } from 'drizzle-orm';

import type { BannedUserRepository } from '../../../domain/repositories/banned-user-repository';
import type { BannedUser } from '../../../domain/entities/banned-user';
import { bannedUsersTable } from '../schema';
import type { DbClient } from './types';

export class DrizzleBannedUserRepository implements BannedUserRepository {
  constructor(private readonly db: DbClient) {}

  async ban(entity: BannedUser): Promise<void> {
    await this.db
      .insert(bannedUsersTable)
      .values({
        telegramUserId: BigInt(entity.telegramUserId),
        reason: entity.reason,
        bannedBy: entity.bannedBy ? BigInt(entity.bannedBy) : null,
        createdAt: entity.createdAt,
      })
      .onConflictDoUpdate({
        target: bannedUsersTable.telegramUserId,
        set: {
          reason: entity.reason,
          bannedBy: entity.bannedBy ? BigInt(entity.bannedBy) : null,
        },
      });
  }

  async unban(telegramUserId: string): Promise<void> {
    await this.db.delete(bannedUsersTable).where(eq(bannedUsersTable.telegramUserId, BigInt(telegramUserId)));
  }

  async isBanned(telegramUserId: string): Promise<boolean> {
    const row = await this.db.query.bannedUsersTable.findFirst({
      where: eq(bannedUsersTable.telegramUserId, BigInt(telegramUserId)),
    });

    return Boolean(row);
  }
}
