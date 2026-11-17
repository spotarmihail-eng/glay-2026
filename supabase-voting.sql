-- GLAY 2026: безопасная таблица голосов для Supabase.
-- Выполни весь скрипт один раз в Supabase → SQL Editor → New query.

-- Закрываем ранее созданные публичные политики на voters: сайт не использует эту
-- таблицу для голосования. Не даём анонимным посетителям менять список избирателей.
drop policy if exists "Allow public read voters" on public.voters;
drop policy if exists "Allow public insert voters" on public.voters;
drop policy if exists "Allow public update voters" on public.voters;

create table if not exists public.votes (
  user_id uuid not null references auth.users(id) on delete cascade,
  nomination text not null check (nomination in (
    'Прикол года','Тупость года','Клип года','Спидранер года',
    'Маинкрафтер года','Кээсер года','Дотер года','Харизма года',
    'Мододел Года','Контент года','Монстор года','Хойщик года',
    'Витубер года','Активист года','Фоновик года','Строитель года',
    'Архитектор автоматизации'
  )),
  participant text not null check (participant in (
    'MrSkrenh','Permintion','Fendi','Stintik','byakakk','kesya127',
    'nechistv','sagitt_a','fantik_42r','Danfnaf12','EDISON','TakSebeYarik',
    'kW1sst','sanhez','5opka','Zakviel','Buster','Bratishkinoff',
    'Deepins02','zubarefff','N3koglai','Evelone2004','paradeev1ch',
    'koreshzy','T2x2','HoneyMad','StRoGo','mazellovvv','Recrent',
    'Gensyxa','Dmitry_Lixxx','Sasavot'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, nomination)
);

alter table public.votes enable row level security;

drop policy if exists "Votes are publicly readable" on public.votes;
create policy "Votes are publicly readable"
on public.votes for select
to anon, authenticated
using (true);

drop policy if exists "Users can insert their own votes" on public.votes;
create policy "Users can insert their own votes"
on public.votes for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own votes" on public.votes;
create policy "Users can update their own votes"
on public.votes for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own votes" on public.votes;
create policy "Users can delete their own votes"
on public.votes for delete
to authenticated
using (auth.uid() = user_id);

grant select on public.votes to anon, authenticated;
grant insert, update, delete on public.votes to authenticated;
