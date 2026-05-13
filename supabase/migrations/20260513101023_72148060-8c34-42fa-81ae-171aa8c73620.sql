-- Add bank_name column to vendors table
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS bank_name text;