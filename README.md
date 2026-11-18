# DCS CRM Portal (Next.js)

The team portal for the DCS 360 CRM. It reads directly from your Railway Postgres (`crm` schema), and actions such as sending email, changing a stage, adding a note or pausing the AI go through your n8n Portal API webhooks. That way every change is logged in the lead's timeline in one place.

**Stack:** Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 · `pg` · `jose` sessions · `bcryptjs`

## Pages

| Route | What it shows |
|---|---|
| `/dashboard` | 9 KPI tiles (new leads, speed to first reply, lead → qualified, calls booked, proposals/won, inquiries → enrolled, hot leads, open handoffs, emails waiting), hot leads to call today, leads by channel, follow-ups due |
| `/leads` | Search and filter by pipeline, temperature, source and owner; sort by score, newest or last message |
| `/leads/[id]` | Profile and AI-collected facts, then change pipeline, stage, owner or follow-up, pause/resume AI, add notes. Tabs: timeline (every message, AI or human), emails with composer (pre-filled with the AI draft), meetings, handoffs |
| `/pipelines/services`, `/pipelines/academy` | Kanban boards. Drag a card to change its stage |
| `/inbox` | Gmail emails the agents processed. Filter by needs a human, AI replied, all or archived. Edit the AI draft and send, or archive |
| `/handoffs` | Conversations the AI passed to people, urgent ones first. Mark done |
| `/settings` | Hot-lead score, alert email, scoring-rule points (founder or AI specialist only), team list |

**Roles:** `sales` users only see leads they own or that are unassigned. Everyone else sees all leads.

## Setup

1. **Database.** Run `01_database_setup.sql` from the n8n package first, then `sql/02_portal_auth.sql` from this folder.
2. **Create your login.**
   ```bash
   npm install
   npm run hash -- "your-strong-password"     # copy the $2b$... hash it prints
   ```
   Then in Railway Postgres → Query:
   ```sql
   insert into crm.users (name, role, email, password_hash)
   values ('Your Name', 'founder', 'you@yourdomain.com', '$2b$12$...');
   ```
   Roles: `founder`, `sales`, `ai_specialist`, `content`, `developer`.
3. **Environment.** Copy `.env.example` to `.env.local` and fill it in:
   - `DATABASE_URL_RO` / `DATABASE_URL_RW`: Railway Postgres → **Settings → Networking → TCP Proxy**, using the `portal_ro` and `portal_rw` logins and the passwords you set in the SQL.
   - `N8N_BASE_URL`: `https://<your-n8n-domain>/webhook`
   - `N8N_API_KEY`: the same value as the Header Auth credential (`X-DCS-Key`) on the portal webhooks in n8n.
   - `SESSION_SECRET`: `openssl rand -base64 48`
4. **Run it.** `npm run dev`, then open http://localhost:3000.
5. **Deploy on Vercel.** Import the repo, add the same 5 environment variables, and deploy.

## How it fits together

```
Browser ── Next.js on Vercel ──┬── reads ──► Railway Postgres (portal_ro)
                               ├── small direct writes ──► Postgres (portal_rw): close handoff, archive email, settings
                               └── actions ──► n8n webhooks (X-DCS-Key)
                                               dcs/send-email   → Gmail + crm.emails + timeline
                                               dcs/update-lead  → stage / owner / follow-up / AI pause / note
                                               dcs/lead-form    → website forms (call from your public site)
```

- The browser never sees the database URL or the n8n key. Both are only used in server code.
- **Website forms:** from your public site's server code, POST to `dcs/lead-form` with `{ name, email, phone, company, source, campaign, pipeline, interest, message, consent }`.

## Files

```
app/
  login/                 sign-in page + server action
  logout/route.ts        sign-out
  (app)/layout.tsx       sidebar with inbox/handoff badges
  (app)/dashboard        KPIs
  (app)/leads            list + [id] detail
  (app)/pipelines/[pipeline]   kanban
  (app)/inbox            email triage
  (app)/handoffs
  (app)/settings
components/              Sidebar, Kanban, EmailComposer, LeadControls, SettingsForm, Badges
lib/
  db.ts                  two pg pools (ro / rw)
  auth.ts, session.ts    JWT cookie sessions, role scoping
  n8n.ts                 webhook client
  actions.ts             all server actions
  constants.ts, types.ts, format.ts
proxy.ts                 redirects signed-out users to /login
sql/02_portal_auth.sql   adds password_hash + last_login_at
```

## Next steps

- **WhatsApp tab:** when you turn WhatsApp back on, its messages already appear in each lead's timeline. Add a reply box that calls `dcs/send-whatsapp`.
- **Cost per lead and revenue per channel:** add an `ad_spend` table (by week and channel) and a `deal_value` column on leads. Those are the last 2 of the 9 Monday numbers.
- **Weekly report:** add a page that reads `crm.weekly_reports` once the n8n reporting workflow is built.
