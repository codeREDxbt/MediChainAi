-- 1. Create Users Table
create table public.users (
  id uuid default gen_random_uuid() primary key,
  wallet_address text unique not null,
  username text,
  email text,
  phone text,
  date_of_birth timestamp with time zone,
  emergency_contact text,
  avatar_url text,
  role text default 'patient',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Scans Table
create table public.scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id),
  file_hash text not null,
  original_name text,
  modality text, 
  patient_name text,
  study_date timestamp with time zone,
  series_description text,
  converted_image text,
  status text default 'uploading',
  upload_date timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Analysis Results Table
create table public.analysis_results (
  id uuid default gen_random_uuid() primary key,
  scan_id uuid not null unique references public.scans(id),
  confidence_score double precision,
  findings jsonb,
  processed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.scans enable row level security;
alter table public.analysis_results enable row level security;

-- 5. Secure policies (owner-scoped)
-- Service role bypasses RLS, so backend API routes can still operate as designed.

drop policy if exists "Enable all access for all users" on public.users;
drop policy if exists "Enable all access for all users" on public.scans;
drop policy if exists "Enable all access for all users" on public.analysis_results;

drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Users can insert own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can view own scans" on public.scans;
drop policy if exists "Users can insert own scans" on public.scans;
drop policy if exists "Users can update own scans" on public.scans;
drop policy if exists "Users can delete own scans" on public.scans;

create policy "Users can view own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Users can insert own scans"
  on public.scans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scans"
  on public.scans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own scans"
  on public.scans for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view own analysis" on public.analysis_results;
drop policy if exists "Users can insert own analysis" on public.analysis_results;
drop policy if exists "Users can update own analysis" on public.analysis_results;
drop policy if exists "Users can delete own analysis" on public.analysis_results;

create policy "Users can view own analysis"
  on public.analysis_results for select
  using (
    exists (
      select 1 from public.scans s
      where s.id = analysis_results.scan_id
        and s.user_id = auth.uid()
    )
  );

create policy "Users can insert own analysis"
  on public.analysis_results for insert
  with check (
    exists (
      select 1 from public.scans s
      where s.id = analysis_results.scan_id
        and s.user_id = auth.uid()
    )
  );

create policy "Users can update own analysis"
  on public.analysis_results for update
  using (
    exists (
      select 1 from public.scans s
      where s.id = analysis_results.scan_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.scans s
      where s.id = analysis_results.scan_id
        and s.user_id = auth.uid()
    )
  );

create policy "Users can delete own analysis"
  on public.analysis_results for delete
  using (
    exists (
      select 1 from public.scans s
      where s.id = analysis_results.scan_id
        and s.user_id = auth.uid()
    )
  );
