-- GLAY 2026: безопасная миграция существующей таблицы votes.
-- Старую таблицу и её данные не удаляем. В текущей таблице голосов данных нет.
-- Выполни весь скрипт в Supabase → SQL Editor → New query.

-- Добавляем поля, которые использует app.js.
alter table public.votes
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists updated_at timestamptz not null default now();

-- Старые поля Discord больше не обязательны: идентификатор берётся из Supabase Auth.
alter table public.votes
  alter column discord_id drop not null,
  alter column discord_username drop not null;

-- В таблице уже нет голосов, поэтому можно потребовать user_id для новых записей.
alter table public.votes
  alter column user_id set not null;

-- Один пользователь может иметь один голос в каждой номинации.
create unique index if not exists votes_user_id_nomination_uidx
  on public.votes (user_id, nomination);

-- Убираем старые политики, включая прежний открытый доступ.
drop policy if exists "Allow public read votes" on public.votes;
drop policy if exists "Allow users to insert votes" on public.votes;
drop policy if exists "Allow users to delete votes" on public.votes;
drop policy if exists "Votes are publicly readable" on public.votes;
drop policy if exists "Users can insert their own votes" on public.votes;
drop policy if exists "Users can update their own votes" on public.votes;
drop policy if exists "Users can delete their own votes" on public.votes;

alter table public.votes enable row level security;

create policy "Users can read their own votes"
  on public.votes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own votes"
  on public.votes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own votes"
  on public.votes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own votes"
  on public.votes for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.votes from anon;
revoke all on table public.votes from authenticated;
grant select, insert, update, delete on table public.votes to authenticated;

-- Если у старого bigint id есть sequence, новые INSERT без id продолжат работать
-- благодаря существующему DEFAULT; для старой PK id это не меняется.
