-- THE BLK GROUP LAB - Run this in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard > Your Project > SQL Editor > New Query > Paste & Run

-- 1. Opens (monthly lead tracking dashboard)
CREATE TABLE lab_opens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  number integer,
  month_year text NOT NULL,
  agent text,
  lead_source text,
  name text,
  phone text,
  email text,
  address text,
  last_contact date,
  next_contact date,
  notes text,
  status text DEFAULT 'active',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Active Leads (Jarvis-populated inbox)
CREATE TABLE lab_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_source text NOT NULL,
  name text,
  phone text,
  email text,
  address text,
  notes text,
  date_added date DEFAULT CURRENT_DATE,
  claimed boolean DEFAULT false,
  claimed_at timestamptz,
  claimed_by text,
  raw_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- 3. Monthly Scorecard
CREATE TABLE lab_scorecard (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  month_year text NOT NULL,
  transaction_name text,
  volume numeric DEFAULT 0,
  gross_commission numeric DEFAULT 0,
  my_commission numeric DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Active Listings
CREATE TABLE lab_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent text,
  listing_type text,
  address text NOT NULL,
  price numeric DEFAULT 0,
  status text DEFAULT 'active',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Under Contract pipeline
CREATE TABLE lab_contracts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_name text NOT NULL,
  contract_date date,
  offer_accepted boolean DEFAULT false,
  tc_added boolean DEFAULT false,
  spd_due date,
  spd_completed boolean DEFAULT false,
  inspection_scheduled boolean DEFAULT false,
  irsa_due date,
  irsa_done boolean DEFAULT false,
  irsa_responded boolean DEFAULT false,
  title_setup boolean DEFAULT false,
  appraisal_done boolean DEFAULT false,
  termite_done boolean DEFAULT false,
  closing_scheduled boolean DEFAULT false,
  closed boolean DEFAULT false,
  loop_submitted boolean DEFAULT false,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Enable RLS on all tables
ALTER TABLE lab_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_scorecard ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_contracts ENABLE ROW LEVEL SECURITY;

-- 7. Policies for authenticated users (Brandon in the Lab)
CREATE POLICY "lab_opens_auth" ON lab_opens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "lab_leads_auth" ON lab_leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "lab_scorecard_auth" ON lab_scorecard FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "lab_listings_auth" ON lab_listings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "lab_contracts_auth" ON lab_contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Policies for service_role (Jarvis adding leads)
CREATE POLICY "lab_opens_service" ON lab_opens FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "lab_leads_service" ON lab_leads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "lab_scorecard_service" ON lab_scorecard FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "lab_listings_service" ON lab_listings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "lab_contracts_service" ON lab_contracts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 9. Reload schema cache
NOTIFY pgrst, 'reload schema';
