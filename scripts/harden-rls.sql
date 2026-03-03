-- Harden RLS policies for users/scans/analysis_results.
-- Run this in Supabase SQL editor after confirming JWT claims mapping for auth.uid().
-- This script is intentionally additive and migration-friendly.

begin;

alter table if exists public.users enable row level security;
alter table if exists public.scans enable row level security;
alter table if exists public.analysis_results enable row level security;

-- Remove permissive legacy policies if present

drop policy if exists "Enable all access for all users" on public.users;
drop policy if exists "Enable all access for all users" on public.scans;
drop policy if exists "Enable all access for all users" on public.analysis_results;

-- USERS: each authenticated user can only access their own row
create policy if not exists "users_select_own"
on public.users
for select
using (id = auth.uid());

create policy if not exists "users_update_own"
on public.users
for update
using (id = auth.uid())
with check (id = auth.uid());

-- SCANS: only owner can view/insert/update/delete own scans
create policy if not exists "scans_select_own"
on public.scans
for select
using (user_id = auth.uid());

create policy if not exists "scans_insert_own"
on public.scans
for insert
with check (user_id = auth.uid());

create policy if not exists "scans_update_own"
on public.scans
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy if not exists "scans_delete_own"
on public.scans
for delete
using (user_id = auth.uid());

-- ANALYSIS RESULTS: access is constrained through parent scan ownership
create policy if not exists "analysis_select_own"
on public.analysis_results
for select
using (
  exists (
    select 1
    from public.scans s
    where s.id = analysis_results.scan_id
      and s.user_id = auth.uid()
  )
);

create policy if not exists "analysis_insert_own"
on public.analysis_results
for insert
with check (
  exists (
    select 1
    from public.scans s
    where s.id = analysis_results.scan_id
      and s.user_id = auth.uid()
  )
);

create policy if not exists "analysis_update_own"
on public.analysis_results
for update
using (
  exists (
    select 1
    from public.scans s
    where s.id = analysis_results.scan_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.scans s
    where s.id = analysis_results.scan_id
      and s.user_id = auth.uid()
  )
);

create policy if not exists "analysis_delete_own"
on public.analysis_results
for delete
using (
  exists (
    select 1
    from public.scans s
    where s.id = analysis_results.scan_id
      and s.user_id = auth.uid()
  )
);

commit;
