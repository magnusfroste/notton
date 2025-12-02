-- Add encryption columns to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS encrypted_title TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS encrypted_content TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS encryption_iv TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

-- Add encryption settings to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS encryption_salt TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS encryption_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT 1;