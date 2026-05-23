-- SQL Migration for Org Board, Admin Scale, Stat Dashboard, Active Listings Enhancements
-- Run this in Supabase SQL Editor: https://fzlwkbhpsklsgkinwljt.supabase.co/

-- ============================================
-- ACTIVE LISTINGS ENHANCEMENTS (Component 4)
-- ============================================
ALTER TABLE lab_listings ADD COLUMN IF NOT EXISTS starting_date date;
ALTER TABLE lab_listings ADD COLUMN IF NOT EXISTS week1_update date;
ALTER TABLE lab_listings ADD COLUMN IF NOT EXISTS week2_update date;
ALTER TABLE lab_listings ADD COLUMN IF NOT EXISTS week3_update date;
ALTER TABLE lab_listings ADD COLUMN IF NOT EXISTS week4_update date;
ALTER TABLE lab_listings ADD COLUMN IF NOT EXISTS showings integer DEFAULT 0;

-- ============================================
-- ADMIN SCALE TAB (Component 2)
-- ============================================
CREATE TABLE IF NOT EXISTS lab_admin_scale (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL, -- 'GOALS', 'PURPOSES', 'POLICY', 'PLANS', 'PROGRAMS', 'PROJECTS', 'ORDERS'
  phase text, -- For PLANS: 'PHASE_1', 'PHASE_2', etc. NULL for others
  item_text text NOT NULL,
  checked boolean DEFAULT false,
  notes text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS: Brandon only
ALTER TABLE lab_admin_scale ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Brandon only can view admin scale" ON lab_admin_scale;
CREATE POLICY "Brandon only can view admin scale" ON lab_admin_scale
  FOR ALL USING (user_id = 'b5c2c7d8-cb11-4b00-a820-14f6c1e64b93'::uuid);

-- ============================================
-- STAT DASHBOARD (Component 3)
-- ============================================
CREATE TABLE IF NOT EXISTS lab_stat_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL, -- First day of month
  stat_name text NOT NULL, -- 'team_gci', 'brandon_income', 'volume', 'transactions', 'new_listings', 'opens'
  target_value numeric NOT NULL,
  actual_value numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(month, stat_name)
);

-- RLS: All agents can view, only Brandon can edit
ALTER TABLE lab_stat_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "All agents can view stat targets" ON lab_stat_targets;
CREATE POLICY "All agents can view stat targets" ON lab_stat_targets
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Brandon can manage stat targets" ON lab_stat_targets;
CREATE POLICY "Brandon can manage stat targets" ON lab_stat_targets
  FOR ALL USING (auth.uid() = 'b5c2c7d8-cb11-4b00-a820-14f6c1e64b93'::uuid);

-- Initialize default targets for current month (May 2026)
INSERT INTO lab_stat_targets (month, stat_name, target_value)
VALUES
  ('2026-05-01', 'team_gci', 100000),
  ('2026-05-01', 'brandon_income', 60000),
  ('2026-05-01', 'volume', 5000000),
  ('2026-05-01', 'transactions', 12.5),
  ('2026-05-01', 'new_listings', 25),
  ('2026-05-01', 'opens', 55)
ON CONFLICT (month, stat_name) DO NOTHING;

-- ============================================
-- ORG BOARD (Component 1)
-- No database table needed - hardcoded in frontend
-- ============================================

COMMENT ON TABLE lab_admin_scale IS 'Admin Scale tracking for Brandon only - roadmap to SHIFT';
COMMENT ON TABLE lab_stat_targets IS 'Monthly stat targets with auto-escalation (110% of max(target, actual))';
