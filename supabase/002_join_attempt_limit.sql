-- Limit wrong join codes: 5 misses per account in 15 minutes, then a wait.
-- Safe to run more than once. Run this in the Supabase SQL editor on the live project.
--
-- Why join_group returns null on a miss instead of raising: an exception rolls the
-- whole call back, which would also undo the row that records the miss.
-- The app already treats an empty result as "No group uses that code."
--
-- Limits: this counts per signed-in account. A person who keeps creating new
-- anonymous accounts can still guess, so also turn on Supabase CAPTCHA or
-- anonymous sign-in rate limits (Authentication settings) before a wide release.

create table if not exists public.join_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  attempted_at timestamptz not null default now()
);

create index if not exists join_attempts_user_time_idx
  on public.join_attempts (user_id, attempted_at desc);

alter table public.join_attempts enable row level security;
revoke all on table public.join_attempts from public, anon, authenticated;

create or replace function public.join_group(join_code_input text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group public.groups;
  recent_misses integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;
  select count(*) into recent_misses
  from public.join_attempts
  where user_id = auth.uid()
    and attempted_at > now() - interval '15 minutes';
  if recent_misses >= 5 then
    raise exception 'Too many wrong codes. Wait 15 minutes and try again.';
  end if;
  select * into target_group
  from public.groups
  where upper(join_code) = upper(trim(join_code_input));
  if not found then
    insert into public.join_attempts (user_id) values (auth.uid());
    delete from public.join_attempts where attempted_at < now() - interval '1 day';
    return null;
  end if;
  insert into public.memberships (group_id, user_id, role)
  values (target_group.id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;
  return target_group;
end;
$$;

revoke all on function public.join_group(text) from public, anon;
grant execute on function public.join_group(text) to authenticated;
