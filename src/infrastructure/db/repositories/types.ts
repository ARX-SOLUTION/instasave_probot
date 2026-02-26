import type { createDbClient } from '../client';

export type DbClient = ReturnType<typeof createDbClient>;
