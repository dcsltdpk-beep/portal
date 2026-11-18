-- Run once after 01_database_setup.sql (as the postgres user)
alter table crm.users add column if not exists password_hash text;
alter table crm.users add column if not exists last_login_at timestamptz;

-- Portal logins need to read password hashes and stamp last login
grant update (last_login_at) on crm.users to portal_rw;

-- Create the founder account. Generate the hash with: npm run hash -- "your-password"
-- insert into crm.users (name, role, email, password_hash)
-- values ('Founder', 'founder', 'you@dreamcybersecurity.com', '$2b$12$...');

-- Close handoffs from the portal (already granted in 01, repeated for safety)
grant update (status, closed_at) on crm.handoffs to portal_rw;
grant update (status) on crm.emails to portal_rw;
