-- =====================================================================
-- DCS 360 CRM - Postgres setup (run once on the Railway Postgres)
-- Creates: crm schema, tables, AI-safe functions, scoring, portal roles
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible
-- =====================================================================

create extension if not exists pgcrypto;
create schema if not exists crm;

-- ---------- settings (editable from the portal) ----------
create table if not exists crm.settings (
  key   text primary key,
  value text not null
);
insert into crm.settings (key, value) values
  ('hot_score', '50'),
  ('alert_email', 'dcsltd.pk@gmail.com')
on conflict (key) do nothing;

-- ---------- team ----------
create table if not exists crm.users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null check (role in ('founder','sales','ai_specialist','content','developer')),
  email      text unique,
  whatsapp   text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- leads ----------
create table if not exists crm.leads (
  id                  uuid primary key default gen_random_uuid(),
  wa_id               text unique,                 -- WhatsApp number (digits)
  phone               text,
  email               text,
  name                text,
  company             text,
  role                text,
  city_country        text,
  source              text,                        -- whatsapp, email, website, meta_ads, linkedin, referral...
  campaign            text,
  pipeline            text check (pipeline in ('services','academy','client')),
  stage               text,
  enquiry_type        text,                        -- Service, Academy, Digital Product, Partnership, Other
  service_interest    text,
  requirement_summary text,
  budget              text,
  timeline            text,
  temperature         text check (temperature in ('Hot','Warm','Cold')),
  language            text,
  decision_maker      boolean,
  asked_price_or_call boolean not null default false,
  regulated_sector    boolean,
  is_student          boolean,
  extra               jsonb not null default '{}'::jsonb,   -- academy: learner_age_group, course, mode, experience
  ai_notes            text,
  ai_paused           boolean not null default false,       -- true = humans handle, AI stays silent
  score               int not null default 0,
  owner_id            uuid references crm.users(id),
  next_follow_up      timestamptz,
  consent             boolean not null default false,
  hot_alerted_at      timestamptz,
  last_inbound_at     timestamptz,
  last_outbound_at    timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists leads_email_idx    on crm.leads (lower(email));
create index if not exists leads_pipeline_idx on crm.leads (pipeline, stage);
create index if not exists leads_score_idx    on crm.leads (score desc);
create index if not exists leads_owner_idx    on crm.leads (owner_id);

-- ---------- activity timeline (every message, note, stage change) ----------
create table if not exists crm.activities (
  id         bigserial primary key,
  lead_id    uuid not null references crm.leads(id) on delete cascade,
  type       text not null,     -- message, note, stage_change, meeting, handoff, email, system
  channel    text,              -- whatsapp, email, portal, system
  direction  text check (direction in ('in','out')),
  actor      text,              -- customer, ai:services, ai:academy, ai:client_care, user:<uuid>, system
  content    text,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activities_lead_idx on crm.activities (lead_id, created_at desc);

-- ---------- emails ----------
create table if not exists crm.emails (
  id                 bigserial primary key,
  lead_id            uuid references crm.leads(id) on delete set null,
  direction          text not null check (direction in ('in','out')),
  gmail_message_id   text unique,
  gmail_thread_id    text,
  from_addr          text,
  to_addr            text,
  cc                 text,
  subject            text,
  body_text          text,
  body_html          text,
  has_attachments    boolean not null default false,
  ai_category        text,
  ai_suggested_reply text,
  status             text not null default 'new',   -- new, auto_replied, needs_human, replied, archived
  sent_by            text,                          -- ai:<agent>, user:<uuid>
  created_at         timestamptz not null default now()
);
create index if not exists emails_lead_idx   on crm.emails (lead_id, created_at desc);
create index if not exists emails_thread_idx on crm.emails (gmail_thread_id);
create index if not exists emails_status_idx on crm.emails (status);

-- ---------- meetings ----------
create table if not exists crm.meetings (
  id           bigserial primary key,
  lead_id      uuid not null references crm.leads(id) on delete cascade,
  pipeline     text,
  topic        text,
  meeting_type text,               -- Phone Call, WhatsApp Call, Google Meet, Demo Class, Counselling
  starts_at    timestamptz,
  status       text not null default 'Booked',
  notes        text,
  booked_by    text,
  created_at   timestamptz not null default now()
);

-- ---------- handoffs to humans ----------
create table if not exists crm.handoffs (
  id          bigserial primary key,
  lead_id     uuid not null references crm.leads(id) on delete cascade,
  channel     text,
  reason      text,
  last_message text,
  priority    text not null default 'Normal' check (priority in ('Normal','Urgent')),
  status      text not null default 'Open',   -- Open, In progress, Closed
  raised_by   text,
  notified_at timestamptz,
  closed_at   timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists handoffs_open_idx on crm.handoffs (status, priority);

-- ---------- scoring rules (editable from the portal) ----------
create table if not exists crm.scoring_rules (
  signal      text primary key,
  points      int not null,
  description text
);
insert into crm.scoring_rules (signal, points, description) values
  ('asked_price_or_call', 25, 'Asked for pricing, a quotation or a call'),
  ('decision_maker',      20, 'Owner, CEO, CTO, IT head'),
  ('regulated_sector',    15, 'Bank, fintech, health, government, e-commerce'),
  ('engaged_3plus',       10, '3+ inbound messages or emails in 7 days'),
  ('meeting_booked',      25, 'A call, demo or counselling session is booked'),
  ('student_on_services',-20, 'Student or job seeker in the services pipeline')
on conflict (signal) do nothing;

-- ---------- weekly reports ----------
create table if not exists crm.weekly_reports (
  week       date primary key,
  metrics    jsonb not null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- FUNCTIONS USED BY n8n
-- =====================================================================

-- Stage order per pipeline. AI may only move a lead FORWARD and only into
-- the stages listed in ai_allowed. Humans (portal) can set any stage.
create or replace function crm.stage_rank(p_pipeline text, p_stage text)
returns int language sql immutable as $$
  select case p_pipeline
    when 'services' then array_position(array['new','contacted','qualified','call_booked','proposal_sent','negotiation','won','lost'], p_stage)
    when 'academy'  then array_position(array['inquiry','details_sent','demo_counselling','fee_pending','enrolled','lost'], p_stage)
    when 'client'   then array_position(array['active','support','upsell','referral'], p_stage)
  end
$$;

create or replace function crm.first_stage(p_pipeline text)
returns text language sql immutable as $$
  select case p_pipeline when 'services' then 'new' when 'academy' then 'inquiry' when 'client' then 'active' end
$$;

create or replace function crm.ai_advance_stage(p_pipeline text, p_current text, p_target text)
returns text language plpgsql immutable as $$
declare
  ai_allowed text[] := case p_pipeline
    when 'services' then array['contacted','qualified','call_booked']
    when 'academy'  then array['details_sent','demo_counselling']
    when 'client'   then array['support']
    else array[]::text[] end;
begin
  if p_target is null or p_target = '' or not (p_target = any(ai_allowed)) then
    return p_current;
  end if;
  if p_current is null then return p_target; end if;
  if coalesce(crm.stage_rank(p_pipeline, p_target), 0) > coalesce(crm.stage_rank(p_pipeline, p_current), 0) then
    return p_target;
  end if;
  return p_current;
end $$;

-- WhatsApp: find or create the lead by WhatsApp number
create or replace function crm.upsert_lead_by_wa(p_wa_id text, p_profile_name text)
returns setof crm.leads language plpgsql as $$
begin
  return query
  insert into crm.leads (wa_id, phone, name, source, last_inbound_at)
  values (p_wa_id, p_wa_id, nullif(p_profile_name, ''), 'whatsapp', now())
  on conflict (wa_id) do update
     set last_inbound_at = now(), updated_at = now()
  returning *;
end $$;

-- Email: find the newest lead with this email, or create one
create or replace function crm.upsert_lead_by_email(p_email text, p_name text)
returns setof crm.leads language plpgsql as $$
declare v_id uuid;
begin
  select id into v_id from crm.leads where lower(email) = lower(p_email)
   order by updated_at desc limit 1;
  if v_id is null then
    insert into crm.leads (email, name, source, last_inbound_at)
    values (lower(p_email), nullif(p_name, ''), 'email', now())
    returning id into v_id;
  else
    update crm.leads set last_inbound_at = now(), updated_at = now() where id = v_id;
  end if;
  return query select * from crm.leads where id = v_id;
end $$;

-- Put a lead into a pipeline (called by the router after classification)
create or replace function crm.assign_pipeline(p_lead uuid, p_pipeline text, p_actor text)
returns setof crm.leads language plpgsql as $$
begin
  update crm.leads
     set pipeline = p_pipeline,
         stage    = coalesce(case when pipeline = p_pipeline then stage end, crm.first_stage(p_pipeline)),
         is_student = case when p_pipeline = 'academy' then true else is_student end,
         updated_at = now()
   where id = p_lead and (pipeline is distinct from p_pipeline);
  if found then
    insert into crm.activities (lead_id, type, channel, actor, content)
    values (p_lead, 'stage_change', 'system', p_actor, 'Assigned to ' || p_pipeline || ' pipeline');
  end if;
  return query select * from crm.leads where id = p_lead;
end $$;

-- AI agents update a lead. Empty strings never overwrite known data.
create or replace function crm.ai_update_lead(p_lead uuid, p_data jsonb, p_actor text)
returns text language plpgsql as $$
declare
  v_old crm.leads;
  v_new_stage text;
begin
  select * into v_old from crm.leads where id = p_lead;
  if not found then return 'lead not found'; end if;

  v_new_stage := crm.ai_advance_stage(v_old.pipeline, v_old.stage, p_data->>'stage');

  update crm.leads set
    name                = coalesce(nullif(trim(p_data->>'name'), ''), name),
    email               = coalesce(lower(nullif(trim(p_data->>'email'), '')), email),
    phone               = coalesce(nullif(regexp_replace(coalesce(p_data->>'phone',''), '\D', '', 'g'), ''), phone),
    company             = coalesce(nullif(trim(p_data->>'company'), ''), company),
    role                = coalesce(nullif(trim(p_data->>'role'), ''), role),
    city_country        = coalesce(nullif(trim(p_data->>'city_country'), ''), city_country),
    enquiry_type        = coalesce(nullif(trim(p_data->>'enquiry_type'), ''), enquiry_type),
    service_interest    = coalesce(nullif(trim(p_data->>'service_interest'), ''), service_interest),
    requirement_summary = coalesce(nullif(trim(p_data->>'requirement_summary'), ''), requirement_summary),
    budget              = coalesce(nullif(trim(p_data->>'budget'), ''), budget),
    timeline            = coalesce(nullif(trim(p_data->>'timeline'), ''), timeline),
    temperature         = coalesce(case when p_data->>'temperature' in ('Hot','Warm','Cold') then p_data->>'temperature' end, temperature),
    language            = coalesce(nullif(trim(p_data->>'language'), ''), language),
    decision_maker      = case lower(coalesce(p_data->>'decision_maker','')) when 'yes' then true when 'no' then false else decision_maker end,
    asked_price_or_call = asked_price_or_call or lower(coalesce(p_data->>'asked_price_or_call','')) = 'yes',
    regulated_sector    = case lower(coalesce(p_data->>'regulated_sector','')) when 'yes' then true when 'no' then false else regulated_sector end,
    is_student          = case lower(coalesce(p_data->>'is_student','')) when 'yes' then true when 'no' then false else is_student end,
    extra               = extra || coalesce(jsonb_strip_nulls(p_data->'extra'), '{}'::jsonb),
    ai_notes            = case when nullif(trim(p_data->>'ai_notes'), '') is null then ai_notes
                               else concat_ws(E'\n', ai_notes, to_char(now() at time zone 'Asia/Karachi', 'YYYY-MM-DD HH24:MI') || ' ' || trim(p_data->>'ai_notes')) end,
    stage               = v_new_stage,
    updated_at          = now()
  where id = p_lead;

  if v_new_stage is distinct from v_old.stage then
    insert into crm.activities (lead_id, type, channel, actor, content)
    values (p_lead, 'stage_change', 'system', p_actor, coalesce(v_old.stage,'(none)') || ' -> ' || v_new_stage);
  end if;
  return 'saved';
end $$;

-- Log a booked meeting and move the stage
create or replace function crm.log_meeting(p_lead uuid, p_topic text, p_type text, p_starts_at text, p_notes text, p_actor text)
returns text language plpgsql as $$
declare v_pipeline text;
begin
  select pipeline into v_pipeline from crm.leads where id = p_lead;
  insert into crm.meetings (lead_id, pipeline, topic, meeting_type, starts_at, notes, booked_by)
  values (p_lead, v_pipeline, p_topic, p_type, nullif(p_starts_at,'')::timestamptz, p_notes, p_actor);
  insert into crm.activities (lead_id, type, channel, actor, content)
  values (p_lead, 'meeting', 'system', p_actor, p_type || ' booked for ' || p_starts_at || ' - ' || coalesce(p_topic,''));
  perform crm.ai_update_lead(p_lead,
    jsonb_build_object('stage', case v_pipeline when 'academy' then 'demo_counselling' else 'call_booked' end,
                       'asked_price_or_call', 'yes'),
    p_actor);
  return 'meeting logged';
end $$;

-- Hand a conversation to the human team
create or replace function crm.raise_handoff(p_lead uuid, p_channel text, p_reason text, p_last text, p_priority text, p_actor text)
returns text language plpgsql as $$
begin
  -- one open handoff per lead per reason is enough
  if exists (select 1 from crm.handoffs where lead_id = p_lead and status = 'Open' and reason = p_reason) then
    return 'already escalated';
  end if;
  insert into crm.handoffs (lead_id, channel, reason, last_message, priority, raised_by)
  values (p_lead, p_channel, p_reason, p_last,
          case when p_priority = 'Urgent' then 'Urgent' else 'Normal' end, p_actor);
  insert into crm.activities (lead_id, type, channel, actor, content)
  values (p_lead, 'handoff', p_channel, p_actor, '[' || coalesce(p_priority,'Normal') || '] ' || p_reason);
  return 'escalated';
end $$;

-- Score = sum of matching scoring_rules
create or replace function crm.recalc_score(p_lead uuid)
returns int language plpgsql as $$
declare
  l crm.leads;
  s int := 0;
  r record;
  inbound7 int;
begin
  select * into l from crm.leads where id = p_lead;
  select count(*) into inbound7 from crm.activities
   where lead_id = p_lead and direction = 'in' and created_at > now() - interval '7 days';
  for r in select signal, points from crm.scoring_rules loop
    if (r.signal = 'asked_price_or_call' and l.asked_price_or_call)
    or (r.signal = 'decision_maker'      and coalesce(l.decision_maker, false))
    or (r.signal = 'regulated_sector'    and coalesce(l.regulated_sector, false))
    or (r.signal = 'engaged_3plus'       and inbound7 >= 3)
    or (r.signal = 'meeting_booked'      and exists (select 1 from crm.meetings m where m.lead_id = p_lead))
    or (r.signal = 'student_on_services' and l.pipeline = 'services' and coalesce(l.is_student, false))
    then s := s + r.points; end if;
  end loop;
  update crm.leads set score = greatest(s, 0) where id = p_lead;
  return greatest(s, 0);
end $$;

-- Run after every conversation turn: rescore, detect newly-hot leads,
-- collect handoffs that the team has not been told about yet.
create or replace function crm.after_turn(p_lead uuid)
returns table (became_hot boolean, score int, handoff_count int, handoffs jsonb, lead jsonb)
language plpgsql as $$
declare
  v_score int;
  v_hot int := (select value::int from crm.settings where key = 'hot_score');
  v_became_hot boolean := false;
  v_handoffs jsonb;
begin
  -- first outbound reply moves services 'new' -> 'contacted'
  update crm.leads set stage = 'contacted'
   where id = p_lead and pipeline = 'services' and stage = 'new' and last_outbound_at is not null;

  v_score := crm.recalc_score(p_lead);

  update crm.leads set hot_alerted_at = now()
   where id = p_lead and hot_alerted_at is null and v_score >= v_hot
     and coalesce(pipeline, '') <> 'client';
  v_became_hot := found;

  with upd as (
    update crm.handoffs set notified_at = now()
     where lead_id = p_lead and notified_at is null
     returning id, reason, priority, last_message, channel
  )
  select coalesce(jsonb_agg(to_jsonb(upd)), '[]'::jsonb) into v_handoffs from upd;

  return query
  select v_became_hot, v_score, jsonb_array_length(v_handoffs), v_handoffs,
         (select to_jsonb(x) - 'extra' || jsonb_build_object('extra', x.extra) from crm.leads x where x.id = p_lead);
end $$;

-- Log a message in the timeline and stamp inbound/outbound time
create or replace function crm.log_message(p_lead uuid, p_channel text, p_direction text, p_actor text, p_content text, p_meta jsonb)
returns bigint language plpgsql as $$
declare v_id bigint;
begin
  insert into crm.activities (lead_id, type, channel, direction, actor, content, meta)
  values (p_lead, 'message', p_channel, p_direction, p_actor, p_content, coalesce(p_meta, '{}'::jsonb))
  returning id into v_id;
  if p_direction = 'out' then
    update crm.leads set last_outbound_at = now() where id = p_lead;
  end if;
  return v_id;
end $$;

-- =====================================================================
-- VIEWS FOR THE PORTAL
-- =====================================================================
create or replace view crm.v_dashboard_today as
select
  (select count(*) from crm.leads where created_at::date = (now() at time zone 'Asia/Karachi')::date) as new_leads_today,
  (select count(*) from crm.leads where score >= (select value::int from crm.settings where key='hot_score')
                                   and coalesce(stage,'') not in ('won','lost','enrolled')) as hot_open,
  (select count(*) from crm.handoffs where status = 'Open') as open_handoffs,
  (select count(*) from crm.emails where direction = 'in' and status in ('new','needs_human')) as emails_waiting,
  (select count(*) from crm.meetings where starts_at::date = (now() at time zone 'Asia/Karachi')::date) as meetings_today;

create or replace view crm.v_leads_by_channel_7d as
select coalesce(source,'unknown') as source, pipeline, count(*) as leads
from crm.leads where created_at > now() - interval '7 days'
group by 1, 2;

-- Median minutes from a lead's first inbound message to the first reply
create or replace view crm.v_speed_to_first_reply as
with firsts as (
  select lead_id,
         min(created_at) filter (where direction = 'in')  as first_in,
         min(created_at) filter (where direction = 'out') as first_out
  from crm.activities where type = 'message' group by lead_id
)
select percentile_cont(0.5) within group (order by extract(epoch from (first_out - first_in)) / 60) as median_minutes
from firsts where first_out > first_in and first_in > now() - interval '30 days';

-- =====================================================================
-- PORTAL ROLES  (change the passwords before running!)
-- =====================================================================
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'portal_ro') then
    create role portal_ro login password 'CHANGE_ME_RO';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'portal_rw') then
    create role portal_rw login password 'CHANGE_ME_RW';
  end if;
end $$;

grant usage on schema crm to portal_ro, portal_rw;
grant select on all tables in schema crm to portal_ro, portal_rw;
alter default privileges in schema crm grant select on tables to portal_ro, portal_rw;
-- portal_rw may change ownership/stage/follow-ups, pause AI, add notes and close handoffs
grant update (stage, owner_id, next_follow_up, ai_paused, pipeline, updated_at) on crm.leads to portal_rw;
grant insert on crm.activities to portal_rw;
grant usage on sequence crm.activities_id_seq to portal_rw;
grant update (status, closed_at) on crm.handoffs to portal_rw;
grant update (value) on crm.settings to portal_rw;
grant update (points) on crm.scoring_rules to portal_rw;
-- AI chat memory table is created by n8n on first run; run this line again after that:
-- grant select on public.n8n_chat_histories to portal_ro, portal_rw;
