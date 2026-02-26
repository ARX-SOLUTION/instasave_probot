import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

import { loadEnv } from '../config/env';
import * as schema from './schema';

export function createDbClient() {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  return drizzle(pool, { schema });
}
