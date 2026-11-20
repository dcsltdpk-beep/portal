import "server-only";
import { Pool, type QueryResultRow } from "pg";

// Two pools: read-only for pages, read-write for the few direct writes.
// Small pools because Vercel runs many short-lived functions.
const g = globalThis as unknown as { _ro?: Pool; _rw?: Pool };

function make(url: string | undefined) {
  if (!url) throw new Error("Database URL missing. Check .env");
  return new Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000,
    ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
    keepAlive: true,
  });
}

export const ro = () => (g._ro ??= make(process.env.DATABASE_URL_RO));
export const rw = () => (g._rw ??= make(process.env.DATABASE_URL_RW));

export async function q<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await ro().query<T>(sql, params);
  return res.rows;
}

export async function q1<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(sql, params))[0] ?? null;
}

export async function write<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await rw().query<T>(sql, params);
  return res.rows;
}
