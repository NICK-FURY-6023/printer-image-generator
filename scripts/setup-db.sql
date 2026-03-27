-- ============================================
-- Shree Ganpati Agency — Label Print System
-- Database Setup Script
-- ============================================
-- Run this SQL in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/sxgrmjpkhyiacxnxijzm/sql/new
-- ============================================

-- 1. Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  label_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates (created_at DESC);

-- 3. Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Grant access to Supabase roles (required for REST API)
GRANT ALL ON templates TO anon;
GRANT ALL ON templates TO authenticated;
GRANT ALL ON templates TO service_role;

-- 5. Disable RLS (auth is handled at API layer via JWT)
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Verification: Run this to confirm setup
-- SELECT count(*) FROM templates;
-- Expected: 0 (empty table, ready to use)
-- ============================================
