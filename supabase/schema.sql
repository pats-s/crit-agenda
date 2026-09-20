-- Crit Agenda: database setup.
-- Paste this whole file into Supabase > SQL Editor > New query, then press Run.
-- Safe to run more than once.

-- One row per item (course, task, habit, month page, notification...).
-- Every row belongs to one user. The rules at the bottom make sure nobody
-- can read or change anyone else's rows.
create table if not exists public.records (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text        not null check (kind in ('course', 'task', 'habit', 'marks', 'month', 'notif')),
  id         text        not null check (length(id) between 1 and 200),
  data       jsonb       not null default '{}'::jsonb check (pg_column_size(data) < 100000),
  deleted    boolean     not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);

create index if not exists records_user_updated_idx on public.records (user_id, updated_at);

-- The server, not the phone, decides when a row was last changed.
create or replace function public.touch_records()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists records_touch on public.records;
create trigger records_touch
  before insert or update on public.records
  for each row execute function public.touch_records();

-- One account can hold at most 20,000 rows. Far more than a planner needs; it stops one
-- account from filling the free database if sign-ups are ever open to everyone.
create or replace function public.limit_records()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.records where user_id = new.user_id) >= 20000 then
    raise exception 'Record limit reached for this account';
  end if;
  return new;
end;
$$;

drop trigger if exists records_limit on public.records;
create trigger records_limit
  before insert on public.records
  for each row execute function public.limit_records();

-- Row-level security: you can only see and change your own rows.
alter table public.records enable row level security;

drop policy if exists "own records" on public.records;
create policy "own records" on public.records
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Logged-out visitors get nothing at all.
revoke all on public.records from anon;
grant select, insert, update, delete on public.records to authenticated;
