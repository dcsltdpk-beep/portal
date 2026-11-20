import "server-only";
import { Pool, type QueryResultRow } from "pg";

// Two pools: read-only for pages, read-write for the few direct writes.
// Small pools because Vercel/Railway proxies drop idle TCP connections.
const g = globalThis as unknown as { _ro?: Pool; _rw?: Pool };

function make(url: string | undefined) {
  if (!url) throw new Error("Database URL missing. Check .env");
  const pool = new Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 10000, // Close idle connections before proxy drops them
    connectionTimeoutMillis: 10000,
    ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
    keepAlive: true,
  });

  // Handle unexpected errors on idle clients so they don't crash or hang the process
  pool.on("error", (err) => {
    console.error("Unexpected error on idle database client:", err.message);
  });

  return pool;
}

export const ro = () => (g._ro ??= make(process.env.DATABASE_URL_RO));
export const rw = () => (g._rw ??= make(process.env.DATABASE_URL_RW));

function isTransientConnError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const msg = (err as Error).message || "";
  return (
    msg.includes("Connection terminated") ||
    msg.includes("timeout") ||
    msg.includes("closed") ||
    msg.includes("ECONNRESET") ||
    msg.includes("Connection ended") ||
    msg.includes("socket")
  );
}

export async function q<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await ro().query<T>(sql, params);
      return res.rows;
    } catch (err: unknown) {
      if (attempt < 2 && isTransientConnError(err)) {
        console.warn(`[DB] Transient connection error on read (attempt ${attempt + 1}), recycling pool and retrying...`);
        try {
          g._ro?.end().catch(() => {});
        } catch {}
        g._ro = undefined; // Force recreation of fresh pool
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  return [];
}

export async function q1<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(sql, params))[0] ?? null;
}

export async function write<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await rw().query<T>(sql, params);
      return res.rows;
    } catch (err: unknown) {
      if (attempt < 2 && isTransientConnError(err)) {
        console.warn(`[DB] Transient connection error on write (attempt ${attempt + 1}), recycling pool and retrying...`);
        try {
          g._rw?.end().catch(() => {});
        } catch {}
        g._rw = undefined; // Force recreation of fresh pool
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  return [];
}
