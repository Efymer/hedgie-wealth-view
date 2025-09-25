-- Hasura/Postgres schema for Hedgie follow + notifications
-- Run in your Postgres connected to Hasura (apply via migrations or console)

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  wallet_account_id text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id text primary key,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id text not null references public.accounts(id) on delete cascade,
  followed_at timestamptz not null default now(),
  unique (user_id, account_id)
);

create index if not exists idx_follows_user on public.follows(user_id);
create index if not exists idx_follows_account on public.follows(account_id);

create table if not exists public.account_cursors (
  account_id text primary key references public.accounts(id) on delete cascade,
  last_consensus_ts text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id text not null references public.accounts(id) on delete cascade,
  tx_id text not null,
  consensus_ts text not null,
  direction text not null check (direction in ('sent','received')),
  token text,
  amount numeric,
  payload jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, tx_id)
);

create index if not exists idx_notifications_user_created_at on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_user_consensus_ts on public.notifications(user_id, consensus_ts desc);

create table if not exists public.notification_last_seen (
  user_id uuid primary key references public.users(id) on delete cascade,
  last_seen_consensus_ts text not null
);

-- Optional helper: latest notification per user (materialized view could be added later)
-- create view public.v_user_latest_notification as
-- select n.user_id, max(n.consensus_ts) as latest_consensus_ts
-- from public.notifications n
-- group by n.user_id;
