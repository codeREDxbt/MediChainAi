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

-- 5. Create Policies (We handle auth in API routes, so allow service_role access)
-- Note: Supabase Service Role Key bypasses RLS, but for client access we need policies.
-- For simplicity in development, allow public access via API key (Authenticated/Anon).
create policy "Enable all access for all users" on public.users for all using (true) with check (true);
create policy "Enable all access for all users" on public.scans for all using (true) with check (true);
create policy "Enable all access for all users" on public.analysis_results for all using (true) with check (true);
