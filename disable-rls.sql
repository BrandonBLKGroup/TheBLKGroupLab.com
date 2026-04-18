-- Disable RLS on Spartan 1 tables (they're admin-only anyway via Lab auth)

ALTER TABLE spartan1_listings DISABLE ROW LEVEL SECURITY;
ALTER TABLE spartan1_listing_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE spartan1_narrative_log DISABLE ROW LEVEL SECURITY;

-- Drop the existing policies (no longer needed)
DROP POLICY IF EXISTS "Admin only access - listings" ON spartan1_listings;
DROP POLICY IF EXISTS "Admin only access - stats" ON spartan1_listing_stats;
DROP POLICY IF EXISTS "Admin only access - narrative" ON spartan1_narrative_log;
