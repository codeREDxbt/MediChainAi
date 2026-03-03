-- Migration: Add new scan fields for original name, patient name, study date, and converted image
-- Run this against your Supabase database

-- Add new columns to scans table
ALTER TABLE public.scans 
ADD COLUMN IF NOT EXISTS original_name text,
ADD COLUMN IF NOT EXISTS patient_name text,
ADD COLUMN IF NOT EXISTS study_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS series_description text,
ADD COLUMN IF NOT EXISTS converted_image text;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_scans_user_id_upload_date ON public.scans(user_id, upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_scans_status ON public.scans(status);

-- Migration: Add new user profile fields
-- Run this against your Supabase database

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS date_of_birth timestamp with time zone,
ADD COLUMN IF NOT EXISTS emergency_contact text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
