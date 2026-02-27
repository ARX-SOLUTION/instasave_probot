import { defineConfig } from 'drizzle-kit';

const defaultUrl = 'postgres://postgres:postgres@localhost:5432/instasave_probot';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/db/schema/*.ts',
  out: './src/infrastructure/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? defaultUrl,
  },
  verbose: true,
  strict: true,
});
