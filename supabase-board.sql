-- Inkbit News board · run once in Supabase → SQL Editor → New query → Run
-- Tables are locked (RLS on, no policies): only the Vercel API with the service-role/secret key can read or write.

create table if not exists public.board_messages (
  id          text primary key,
  created_at  timestamptz not null default now(),
  day         date not null,
  name        text not null check (char_length(name) between 2 and 24),
  text        text not null check (char_length(text) between 1 and 400),
  who         text not null,
  removed     boolean not null default false
);
create index if not exists board_messages_recent on public.board_messages (removed, created_at desc);

create table if not exists public.board_log (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  day         date not null,
  line        text not null
);
create index if not exists board_log_day on public.board_log (day, id);

create table if not exists public.board_ratelimit (
  who         text primary key,
  until       timestamptz not null
);

create or replace view public.board_log_days with (security_invoker = true) as
  select day, count(*)::int as lines from public.board_log group by day;

alter table public.board_messages  enable row level security;
alter table public.board_log       enable row level security;
alter table public.board_ratelimit enable row level security;
revoke all on public.board_messages, public.board_log, public.board_ratelimit, public.board_log_days from anon, authenticated;
