-- ============================================
-- Monthly Scorecard Enhancements
-- 1. Add payment_status field
-- 2. Add entry_date field (for contract date sync)
-- Run this in Supabase SQL Editor
-- ============================================

-- Add payment_status column
ALTER TABLE lab_scorecard 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'NOT PAID' CHECK (payment_status IN ('PAID', 'NOT PAID'));

-- Add entry_date column (used to set contract_date in Under Contract)
ALTER TABLE lab_scorecard 
ADD COLUMN IF NOT EXISTS entry_date date;

-- Add agent column if not exists
ALTER TABLE lab_scorecard 
ADD COLUMN IF NOT EXISTS agent text;

-- Add agent_id column if not exists
ALTER TABLE lab_scorecard 
ADD COLUMN IF NOT EXISTS agent_id uuid;

-- Add volume column to lab_contracts if not exists (for sync)
ALTER TABLE lab_contracts 
ADD COLUMN IF NOT EXISTS volume numeric DEFAULT 0;

-- Add agent column to lab_contracts if not exists
ALTER TABLE lab_contracts 
ADD COLUMN IF NOT EXISTS agent text;

-- Reload schema
NOTIFY pgrst, 'reload schema';
