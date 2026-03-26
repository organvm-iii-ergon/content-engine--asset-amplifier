import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

let db: ReturnType<typeof drizzle> | null = null;

export function getDb(connectionString?: string) {
  if (db) return db;
  const sql = postgres(connectionString ?? process.env.DATABASE_URL!);
  db = drizzle(sql, { schema });
  return db;
}

export type Db = ReturnType<typeof getDb>;
export { schema };
