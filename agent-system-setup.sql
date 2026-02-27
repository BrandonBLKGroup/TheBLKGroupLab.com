-- ============================================
-- BLK GROUP LAB - Agent Role System Setup
-- Run this ENTIRE block in Supabase SQL Editor
-- ============================================

-- 1. Create agent_profiles table
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  opens_goal integer DEFAULT 10,
  monthly_income_goal numeric DEFAULT 0,
  annual_income_goal numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Add agent_id column to existing tables
ALTER TABLE lab_opens ADD COLUMN IF NOT EXISTS agent_id uuid;
ALTER TABLE lab_leads ADD COLUMN IF NOT EXISTS agent_id uuid;
ALTER TABLE lab_listings ADD COLUMN IF NOT EXISTS agent_id uuid;
ALTER TABLE lab_contracts ADD COLUMN IF NOT EXISTS agent_id uuid;

-- 3. Insert Brandon as admin
INSERT INTO agent_profiles (user_id, email, full_name, role, opens_goal, monthly_income_goal, annual_income_goal)
VALUES ('b5c2c7d8-cb11-4b00-a820-14f6c1e64b93', 'BrandonBLKGroup@Gmail.com', 'Brandon Bruning', 'admin', 50, 66000, 800000)
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', full_name = 'Brandon Bruning';

-- 4. RLS on agent_profiles
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own profile
CREATE POLICY "agent_profiles_read_own" ON agent_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin can read all profiles
CREATE POLICY "agent_profiles_admin_read" ON agent_profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM agent_profiles ap WHERE ap.user_id = auth.uid() AND ap.role = 'admin'));

-- Users can update their own profile (for onboarding goals)
CREATE POLICY "agent_profiles_update_own" ON agent_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Service role full access
CREATE POLICY "agent_profiles_service" ON agent_profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 5. Drop old lab_opens policies and recreate with agent filtering
DROP POLICY IF EXISTS "lab_opens_auth" ON lab_opens;
CREATE POLICY "lab_opens_admin" ON lab_opens FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM agent_profiles ap WHERE ap.user_id = auth.uid() AND ap.role = 'admin'))
  WITH CHECK (true);
CREATE POLICY "lab_opens_agent" ON lab_opens FOR SELECT TO authenticated
  USING (agent_id = auth.uid());
CREATE POLICY "lab_opens_agent_insert" ON lab_opens FOR INSERT TO authenticated
  WITH CHECK (agent_id = auth.uid());
CREATE POLICY "lab_opens_agent_update" ON lab_opens FOR UPDATE TO authenticated
  USING (agent_id = auth.uid()) WITH CHECK (agent_id = auth.uid());

-- 6. Drop old lab_leads policies and recreate (admin only for reads)
DROP POLICY IF EXISTS "lab_leads_auth" ON lab_leads;
CREATE POLICY "lab_leads_admin" ON lab_leads FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM agent_profiles ap WHERE ap.user_id = auth.uid() AND ap.role = 'admin'))
  WITH CHECK (true);

-- 7. Drop old lab_scorecard policies and recreate (admin only)
DROP POLICY IF EXISTS "lab_scorecard_auth" ON lab_scorecard;
CREATE POLICY "lab_scorecard_admin" ON lab_scorecard FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM agent_profiles ap WHERE ap.user_id = auth.uid() AND ap.role = 'admin'))
  WITH CHECK (true);

-- 8. Drop old lab_listings policies and recreate with agent filtering
DROP POLICY IF EXISTS "lab_listings_auth" ON lab_listings;
CREATE POLICY "lab_listings_admin" ON lab_listings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM agent_profiles ap WHERE ap.user_id = auth.uid() AND ap.role = 'admin'))
  WITH CHECK (true);
CREATE POLICY "lab_listings_agent" ON lab_listings FOR SELECT TO authenticated
  USING (agent_id = auth.uid());

-- 9. Drop old lab_contracts policies and recreate with agent filtering
DROP POLICY IF EXISTS "lab_contracts_auth" ON lab_contracts;
CREATE POLICY "lab_contracts_admin" ON lab_contracts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM agent_profiles ap WHERE ap.user_id = auth.uid() AND ap.role = 'admin'))
  WITH CHECK (true);
CREATE POLICY "lab_contracts_agent" ON lab_contracts FOR SELECT TO authenticated
  USING (agent_id = auth.uid());
CREATE POLICY "lab_contracts_agent_insert" ON lab_contracts FOR INSERT TO authenticated
  WITH CHECK (agent_id = auth.uid());
CREATE POLICY "lab_contracts_agent_update" ON lab_contracts FOR UPDATE TO authenticated
  USING (agent_id = auth.uid()) WITH CHECK (agent_id = auth.uid());

-- 10. Reload schema cache
NOTIFY pgrst, 'reload schema';
