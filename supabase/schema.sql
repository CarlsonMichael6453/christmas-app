-- Christmas Family
-- Paste this whole file into the Supabase SQL editor and run it once.
-- It creates the tables, the Secret Santa draw, and the row level security
-- that keeps gift claims and name-draw slips private.
--
-- The tested TypeScript draw lives in src/logic/derangement.ts.
-- public.draw_secret_santa mirrors that algorithm inside Postgres so a
-- modified app cannot ask the database for someone else's match.
--
-- After this script:
--   Authentication → Sign In / Providers → enable Anonymous (name-only sign-in)
--   Authentication → Providers → Email → turn off "Confirm email" for family testing
--
-- Never put the service role key in the app. The publishable (anon) key is public.
-- These policies are what keep the data private.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'guest'), '@', 1), 'Guest')
  )
  on conflict (id) do update
    set display_name = excluded.display_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Groups and membership
-- ---------------------------------------------------------------------------

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  join_code text not null unique,
  owner_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.groups enable row level security;
alter table public.memberships enable row level security;

create or replace function public.is_member(gid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where group_id = gid and user_id = auth.uid()
  );
$$;

create or replace function public.create_group(group_name text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  created public.groups;
  code text;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  if length(trim(group_name)) < 2 then
    raise exception 'Give the group a name.';
  end if;
  code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6));
  insert into public.groups (name, join_code, owner_id)
  values (trim(group_name), code, auth.uid())
  returning * into created;
  insert into public.memberships (group_id, user_id, role)
  values (created.id, auth.uid(), 'owner');
  return created;
end;
$$;

create or replace function public.join_group(join_code_input text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  found public.groups;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  select * into found
  from public.groups
  where upper(join_code) = upper(trim(join_code_input));
  if not found then
    raise exception 'No group uses that code.';
  end if;
  insert into public.memberships (group_id, user_id, role)
  values (found.id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;
  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- Wishlists and hidden claims
-- ---------------------------------------------------------------------------

create table if not exists public.wish_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  owner_id uuid not null references public.profiles (id),
  title text not null,
  link text,
  price numeric,
  notes text,
  priority int not null default 2 check (priority between 1 and 3),
  created_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null unique references public.wish_items (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  claimer_id uuid not null references public.profiles (id),
  status text not null check (status in ('claimed', 'bought')),
  price_paid numeric,
  updated_at timestamptz not null default now()
);

alter table public.wish_items enable row level security;
alter table public.claims enable row level security;

-- ---------------------------------------------------------------------------
-- Secret Santa. Assignments are readable only by the giver.
-- ---------------------------------------------------------------------------

create table if not exists public.santa_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  name text not null,
  budget numeric not null default 25,
  exchange_date date,
  organizer_id uuid not null references public.profiles (id),
  participant_ids uuid[] not null,
  exclusions jsonb not null default '[]'::jsonb,
  drawn boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.santa_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.santa_events (id) on delete cascade,
  giver_id uuid not null references public.profiles (id),
  receiver_id uuid not null references public.profiles (id),
  unique (event_id, giver_id),
  unique (event_id, receiver_id)
);

alter table public.santa_events enable row level security;
alter table public.santa_assignments enable row level security;

create or replace function public._pair_excluded(exclusions jsonb, x uuid, y uuid)
returns boolean
language sql
immutable
as $$
  select exists (
    select 1
    from jsonb_array_elements(coalesce(exclusions, '[]'::jsonb)) element
    where (element ->> 'a' = x::text and element ->> 'b' = y::text)
       or (element ->> 'a' = y::text and element ->> 'b' = x::text)
  );
$$;

create or replace function public._shuffle_uuids(arr uuid[])
returns uuid[]
language plpgsql
as $$
declare
  i int;
  j int;
  tmp uuid;
  n int;
begin
  n := coalesce(array_length(arr, 1), 0);
  if n < 2 then
    return arr;
  end if;
  for i in reverse n..2 loop
    j := 1 + floor(random() * i)::int;
    tmp := arr[i];
    arr[i] := arr[j];
    arr[j] := tmp;
  end loop;
  return arr;
end;
$$;

create or replace function public._santa_search(
  givers uuid[],
  idx int,
  people uuid[],
  exclusions jsonb,
  assigned uuid[],
  used uuid[]
)
returns uuid[]
language plpgsql
as $$
declare
  giver uuid;
  receiver uuid;
  opts uuid[] := '{}';
  k int;
  result uuid[];
begin
  if idx > coalesce(array_length(givers, 1), 0) then
    return assigned;
  end if;
  giver := givers[idx];
  if people is not null then
    foreach receiver in array people loop
      if used is not null and receiver = any (used) then
        continue;
      end if;
      if receiver = giver then
        continue;
      end if;
      if public._pair_excluded(exclusions, giver, receiver) then
        continue;
      end if;
      opts := array_append(opts, receiver);
    end loop;
  end if;
  opts := public._shuffle_uuids(opts);
  if coalesce(array_length(opts, 1), 0) = 0 then
    return null;
  end if;
  for k in 1..array_length(opts, 1) loop
    result := public._santa_search(
      givers,
      idx + 1,
      people,
      exclusions,
      assigned || opts[k],
      used || opts[k]
    );
    if result is not null then
      return result;
    end if;
  end loop;
  return null;
end;
$$;

create or replace function public.draw_secret_santa(p_event uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ev public.santa_events;
  people uuid[];
  givers uuid[];
  n int;
  i int;
  j int;
  best int;
  best_count int;
  cnt int;
  receiver uuid;
  tmp uuid;
  result uuid[];
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'Sign in first.');
  end if;

  select * into ev from public.santa_events where id = p_event;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'That drawing is gone.');
  end if;
  if ev.organizer_id <> auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'Only the organizer can run the draw.');
  end if;
  if not public.is_member(ev.group_id) then
    return jsonb_build_object('ok', false, 'reason', 'You are not in this group.');
  end if;

  people := ev.participant_ids;
  n := coalesce(array_length(people, 1), 0);
  if n < 2 then
    return jsonb_build_object('ok', false, 'reason', 'Add at least 2 people before drawing names.');
  end if;
  if (select count(distinct person) from unnest(people) person) <> n then
    return jsonb_build_object('ok', false, 'reason', 'The same person is listed twice.');
  end if;
  if exists (
    select 1
    from unnest(people) person
    where not exists (
      select 1 from public.memberships member
      where member.group_id = ev.group_id and member.user_id = person
    )
  ) then
    return jsonb_build_object('ok', false, 'reason', 'Every person in the draw has to be in the group.');
  end if;

  givers := people;
  for i in 1..n loop
    best := i;
    best_count := 1000;
    for j in i..n loop
      cnt := 0;
      foreach receiver in array people loop
        if receiver <> givers[j] and not public._pair_excluded(ev.exclusions, givers[j], receiver) then
          cnt := cnt + 1;
        end if;
      end loop;
      if cnt < best_count or (cnt = best_count and random() < 0.5) then
        best_count := cnt;
        best := j;
      end if;
    end loop;
    if best_count = 0 then
      return jsonb_build_object('ok', false, 'reason', 'Someone has nobody they are allowed to draw. Loosen the exclusions.');
    end if;
    tmp := givers[i];
    givers[i] := givers[best];
    givers[best] := tmp;
  end loop;

  result := public._santa_search(givers, 1, people, ev.exclusions, '{}'::uuid[], '{}'::uuid[]);
  if result is null then
    return jsonb_build_object(
      'ok', false,
      'reason', 'No valid draw with these exclusions. A derangement is impossible — someone would be stuck with themselves or a blocked person.'
    );
  end if;

  delete from public.santa_assignments where event_id = ev.id;
  for i in 1..n loop
    insert into public.santa_assignments (event_id, giver_id, receiver_id)
    values (ev.id, givers[i], result[i]);
  end loop;
  update public.santa_events set drawn = true where id = ev.id;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.reset_secret_santa(p_event uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ev public.santa_events;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  select * into ev from public.santa_events where id = p_event;
  if not found then
    raise exception 'That drawing is gone.';
  end if;
  if ev.organizer_id <> auth.uid() then
    raise exception 'Only the organizer can reset the draw.';
  end if;
  delete from public.santa_assignments where event_id = ev.id;
  update public.santa_events set drawn = false where id = ev.id;
end;
$$;

-- The helper functions return full matchings. Only the draw function may call them.
revoke all on function public._pair_excluded(jsonb, uuid, uuid) from public, anon, authenticated;
revoke all on function public._shuffle_uuids(uuid[]) from public, anon, authenticated;
revoke all on function public._santa_search(uuid[], integer, uuid[], jsonb, uuid[], uuid[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Shared extras (letters, sweaters, lights, cookies, party) and private rows
-- (cards, bingo, budget, advent opens). Claims do not live here.
-- ---------------------------------------------------------------------------

create table if not exists public.group_records (
  id uuid primary key,
  group_id uuid not null references public.groups (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  kind text not null check (kind in (
    'letter', 'sweater', 'vote', 'light', 'cookie', 'resolution', 'party', 'card', 'bingo', 'budget', 'advent'
  )),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.group_records enable row level security;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.memberships mine
      join public.memberships theirs on mine.group_id = theirs.group_id
      where mine.user_id = auth.uid() and theirs.user_id = profiles.id
    )
  );

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups
  for select to authenticated
  using (public.is_member(id));

drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships
  for select to authenticated
  using (public.is_member(group_id));

drop policy if exists items_select on public.wish_items;
create policy items_select on public.wish_items
  for select to authenticated
  using (public.is_member(group_id));

drop policy if exists items_insert on public.wish_items;
create policy items_insert on public.wish_items
  for insert to authenticated
  with check (public.is_member(group_id) and owner_id = auth.uid());

drop policy if exists items_update on public.wish_items;
create policy items_update on public.wish_items
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and public.is_member(group_id));

drop policy if exists items_delete on public.wish_items;
create policy items_delete on public.wish_items
  for delete to authenticated
  using (owner_id = auth.uid());

-- The gift owner cannot read claim rows for their own items.
drop policy if exists claims_select on public.claims;
create policy claims_select on public.claims
  for select to authenticated
  using (
    public.is_member(group_id)
    and not exists (
      select 1 from public.wish_items item
      where item.id = claims.item_id and item.owner_id = auth.uid()
    )
  );

drop policy if exists claims_insert on public.claims;
create policy claims_insert on public.claims
  for insert to authenticated
  with check (
    public.is_member(group_id)
    and claimer_id = auth.uid()
    and exists (
      select 1 from public.wish_items i
      where i.id = item_id
        and i.group_id = claims.group_id
        and i.owner_id <> auth.uid()
    )
  );

drop policy if exists claims_update on public.claims;
create policy claims_update on public.claims
  for update to authenticated
  using (claimer_id = auth.uid() and public.is_member(group_id))
  with check (claimer_id = auth.uid());

drop policy if exists claims_delete on public.claims;
create policy claims_delete on public.claims
  for delete to authenticated
  using (claimer_id = auth.uid());

drop policy if exists events_select on public.santa_events;
create policy events_select on public.santa_events
  for select to authenticated
  using (public.is_member(group_id));

drop policy if exists events_insert on public.santa_events;
create policy events_insert on public.santa_events
  for insert to authenticated
  with check (public.is_member(group_id) and organizer_id = auth.uid());

drop policy if exists events_update on public.santa_events;
create policy events_update on public.santa_events
  for update to authenticated
  using (organizer_id = auth.uid() and public.is_member(group_id))
  with check (organizer_id = auth.uid());

drop policy if exists events_delete on public.santa_events;
create policy events_delete on public.santa_events
  for delete to authenticated
  using (organizer_id = auth.uid());

drop policy if exists assignments_select on public.santa_assignments;
create policy assignments_select on public.santa_assignments
  for select to authenticated
  using (giver_id = auth.uid());

drop policy if exists records_select on public.group_records;
create policy records_select on public.group_records
  for select to authenticated
  using (
    public.is_member(group_id)
    and (
      author_id = auth.uid()
      or kind in ('letter', 'sweater', 'vote', 'light', 'cookie', 'party')
      or (kind = 'resolution' and coalesce((payload ->> 'shared')::boolean, false))
    )
  );

drop policy if exists records_insert on public.group_records;
create policy records_insert on public.group_records
  for insert to authenticated
  with check (public.is_member(group_id) and author_id = auth.uid());

drop policy if exists records_update on public.group_records;
create policy records_update on public.group_records
  for update to authenticated
  using (
    public.is_member(group_id)
    and (
      author_id = auth.uid()
      or kind = 'party'
      or kind = 'vote'
      or (kind = 'resolution' and coalesce((payload ->> 'shared')::boolean, false))
    )
  )
  with check (public.is_member(group_id));

drop policy if exists records_delete on public.group_records;
create policy records_delete on public.group_records
  for delete to authenticated
  using (
    author_id = auth.uid()
    or (kind = 'party' and public.is_member(group_id))
    or (kind = 'vote' and public.is_member(group_id))
  );

-- Clients may read their own slip. They may not write the matching.
revoke all on table public.santa_assignments from public, anon, authenticated;
grant select on table public.santa_assignments to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.groups to authenticated;
grant select on public.memberships to authenticated;
grant select, insert, update, delete on public.wish_items to authenticated;
grant select, insert, update, delete on public.claims to authenticated;
grant select, insert, update, delete on public.santa_events to authenticated;
grant select, insert, update, delete on public.group_records to authenticated;

grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
grant execute on function public.draw_secret_santa(uuid) to authenticated;
grant execute on function public.reset_secret_santa(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter table public.wish_items replica identity full;
alter table public.claims replica identity full;
alter table public.santa_events replica identity full;
alter table public.santa_assignments replica identity full;
alter table public.group_records replica identity full;
alter table public.memberships replica identity full;

do $$
declare
  target text;
begin
  foreach target in array array[
    'wish_items', 'claims', 'santa_events', 'santa_assignments', 'group_records', 'memberships'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', target);
    exception
      when duplicate_object then null;
      when others then null;
    end;
  end loop;
end $$;
