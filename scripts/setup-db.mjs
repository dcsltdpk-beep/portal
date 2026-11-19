// One-time database setup for the DCS CRM.
// Runs sql/01_database_setup.sql + sql/02_portal_auth.sql, sets the portal passwords,
// and creates (or resets) your founder login.
//
// Usage (PowerShell or any terminal, from the portal folder):
//   node scripts/setup-db.mjs "<DATABASE_PUBLIC_URL>" <portal_ro_password> <portal_rw_password> "<Your Name>" <login_email> <login_password>
//
// DATABASE_PUBLIC_URL = Railway -> Postgres -> Variables -> DATABASE_PUBLIC_URL (the postgres admin URL)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import bcrypt from "bcryptjs";

const [url, roPw, rwPw, name, email, loginPw] = process.argv.slice(2);
if (!url || !roPw || !rwPw || !name || !email || !loginPw) {
  console.error('Usage: node scripts/setup-db.mjs "<DATABASE_PUBLIC_URL>" <ro_password> <rw_password> "<Your Name>" <email> <login_password>');
  process.exit(1);
}
for (const [label, pw] of [["portal_ro", roPw], ["portal_rw", rwPw]]) {
  if (!/^[A-Za-z0-9_]{8,}$/.test(pw)) {
    console.error(`${label} password: use 8+ letters/numbers/underscore only (no @ : / # ? quotes).`);
    process.exit(1);
  }
}

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "sql");
const read = (f) => {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) { console.error(`Missing ${p}. Copy it into the portal/sql folder.`); process.exit(1); }
  return fs.readFileSync(p, "utf8");
};

const setup = read("01_database_setup.sql")
  .replace("'CHANGE_ME_RO'", `'${roPw}'`)
  .replace("'CHANGE_ME_RW'", `'${rwPw}'`);
const auth = read("02_portal_auth.sql");

const client = new pg.Client({ connectionString: url, ssl: url.includes("localhost") ? false : { rejectUnauthorized: false } });
await client.connect();
try {
  console.log("1/4 Creating crm schema, tables and functions...");
  await client.query(setup);
  console.log("2/4 Setting portal passwords...");
  await client.query(`alter role portal_ro with password '${roPw}'`);
  await client.query(`alter role portal_rw with password '${rwPw}'`);
  console.log("3/4 Adding login columns...");
  await client.query(auth);
  console.log("4/4 Creating your founder login...");
  await client.query(
    `insert into crm.users (name, role, email, password_hash) values ($1, 'founder', lower($2), $3)
     on conflict (email) do update set password_hash = excluded.password_hash, active = true, role = 'founder'`,
    [name, email, bcrypt.hashSync(loginPw, 12)]);
  // AI chat memory table exists only after n8n's first run; grant if it is already there
  await client.query(`do $$ begin
    if to_regclass('public.n8n_chat_histories') is not null then
      grant select on public.n8n_chat_histories to portal_ro, portal_rw; end if; end $$;`);

  const host = new URL(url);
  const base = `${host.hostname}:${host.port}${host.pathname}`;
  console.log("\nDone. Put these in Vercel -> Settings -> Environment Variables, then Redeploy:\n");
  console.log(`DATABASE_URL_RO=postgresql://portal_ro:${roPw}@${base}`);
  console.log(`DATABASE_URL_RW=postgresql://portal_rw:${rwPw}@${base}`);
  console.log(`\nLogin: ${email.toLowerCase()} / (the password you just typed)`);
} catch (e) {
  console.error("\nSetup failed:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
