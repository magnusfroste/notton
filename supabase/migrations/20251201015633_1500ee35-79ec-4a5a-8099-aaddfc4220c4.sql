-- Add preferences JSONB column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{"editor_mode": "rich"}'::jsonb;