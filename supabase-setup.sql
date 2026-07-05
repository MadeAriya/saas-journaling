-- =============================================
-- Daily Journal — Supabase Database Setup
-- =============================================
-- Run this SQL in your Supabase project's SQL Editor:
-- https://app.supabase.com → Your Project → SQL Editor
-- =============================================

-- Create the entries table
CREATE TABLE IF NOT EXISTS entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast date lookups (ordered)
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date DESC);

-- Enable Row Level Security (required by Supabase)
-- For MVP without auth, we allow all operations.
-- When you add auth later, update these policies.
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users (MVP — no auth)
CREATE POLICY "Allow all operations" ON entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Optional: auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
