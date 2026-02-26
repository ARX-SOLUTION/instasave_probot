import { eq } from 'drizzle-orm';

import type { BotConfigRepository } from '../../../domain/repositories/bot-config-repository';
import { botConfigTable } from '../schema';
import type { DbClient } from './types';

export class DrizzleBotConfigRepository implements BotConfigRepository {
  constructor(private readonly db: DbClient) {}

  async setValue(key: string, value: unknown): Promise<void> {
    await this.db
      .insert(botConfigTable)
      .values({
        key,
        value,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: botConfigTable.key,
        set: {
          value,
          updatedAt: new Date(),
        },
      });
  }

  async getValue<T>(key: string): Promise<T | null> {
    const row = await this.db.query.botConfigTable.findFirst({
      where: eq(botConfigTable.key, key),
    });

    if (!row) {
      return null;
    }

    return row.value as T;
  }
}
