-- Spartan 1 Dashboard Schema
-- Run this in Supabase SQL Editor to create all tables

-- Table 1: listings (Active Listings Tracker)
CREATE TABLE IF NOT EXISTS spartan1_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address TEXT NOT NULL UNIQUE,
    list_date DATE NOT NULL,
    days_on_market INTEGER GENERATED ALWAYS AS (EXTRACT(DAY FROM (CURRENT_DATE - list_date))::INTEGER) STORED,
    week_1_sent DATE,
    week_2_sent DATE,
    week_3_sent DATE,
    week_4_sent DATE,
    days_since_update INTEGER,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'withdrawn')),
    client_name TEXT,
    client_address_style TEXT,
    current_price DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: listing_stats (Performance Stats Over Time)
CREATE TABLE IF NOT EXISTS spartan1_listing_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES spartan1_listings(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    date DATE NOT NULL,
    zillow_views INTEGER,
    zillow_saves INTEGER,
    projected_monthly_saves INTEGER,
    internal_grade TEXT,
    homes_views INTEGER,
    mls_matches INTEGER,
    mls_emailed INTEGER,
    showings TEXT,
    step_diagnosis TEXT,
    days_on_market INTEGER,
    copy_for_claude TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 3: narrative_log (Email Continuity System)
CREATE TABLE IF NOT EXISTS spartan1_narrative_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES spartan1_listings(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    date DATE NOT NULL,
    week TEXT,
    stats_snapshot TEXT,
    diagnosis TEXT,
    recommendation TEXT,
    tone TEXT,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_address ON spartan1_listings(address);
CREATE INDEX IF NOT EXISTS idx_listings_status ON spartan1_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_days_since_update ON spartan1_listings(days_since_update);
CREATE INDEX IF NOT EXISTS idx_stats_listing_id ON spartan1_listing_stats(listing_id);
CREATE INDEX IF NOT EXISTS idx_stats_address ON spartan1_listing_stats(address);
CREATE INDEX IF NOT EXISTS idx_stats_date ON spartan1_listing_stats(date);
CREATE INDEX IF NOT EXISTS idx_narrative_listing_id ON spartan1_narrative_log(listing_id);
CREATE INDEX IF NOT EXISTS idx_narrative_address ON spartan1_narrative_log(address);
CREATE INDEX IF NOT EXISTS idx_narrative_date ON spartan1_narrative_log(date);

-- Function to auto-update days_since_update
CREATE OR REPLACE FUNCTION update_days_since_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.days_since_update := EXTRACT(DAY FROM (
        CURRENT_DATE - GREATEST(
            COALESCE(NEW.week_1_sent, '1900-01-01'::DATE),
            COALESCE(NEW.week_2_sent, '1900-01-01'::DATE),
            COALESCE(NEW.week_3_sent, '1900-01-01'::DATE),
            COALESCE(NEW.week_4_sent, '1900-01-01'::DATE)
        )
    ))::INTEGER;
    
    -- If no weeks marked yet, days_since_update = days_on_market
    IF NEW.week_1_sent IS NULL AND NEW.week_2_sent IS NULL AND NEW.week_3_sent IS NULL AND NEW.week_4_sent IS NULL THEN
        NEW.days_since_update := EXTRACT(DAY FROM (CURRENT_DATE - NEW.list_date))::INTEGER;
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate days_since_update
DROP TRIGGER IF EXISTS trigger_update_days_since_update ON spartan1_listings;
CREATE TRIGGER trigger_update_days_since_update
BEFORE INSERT OR UPDATE ON spartan1_listings
FOR EACH ROW
EXECUTE FUNCTION update_days_since_update();

-- Function to auto-calculate projected_monthly_saves and internal_grade
CREATE OR REPLACE FUNCTION calculate_listing_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Projected Monthly Saves calculation
    IF NEW.zillow_saves IS NOT NULL AND NEW.days_on_market IS NOT NULL AND NEW.days_on_market > 0 THEN
        IF NEW.days_on_market < 30 THEN
            NEW.projected_monthly_saves := ROUND((NEW.zillow_saves::DECIMAL / NEW.days_on_market) * 30);
        ELSE
            -- If 30+ days, the saves number already represents a full 30-day window
            NEW.projected_monthly_saves := NEW.zillow_saves;
        END IF;
    END IF;
    
    -- Internal Grade calculation
    IF NEW.projected_monthly_saves IS NOT NULL THEN
        IF NEW.projected_monthly_saves >= 90 THEN
            NEW.internal_grade := 'S';
        ELSIF NEW.projected_monthly_saves >= 60 THEN
            NEW.internal_grade := 'B+';
        ELSIF NEW.projected_monthly_saves >= 30 THEN
            NEW.internal_grade := 'C-';
        ELSE
            NEW.internal_grade := 'F';
        END IF;
    END IF;
    
    -- Auto-generate Copy for Claude
    NEW.copy_for_claude := FORMAT(
        '%s | %s | Z:%s | S:%s | H:%s | MLS:%s/%s | Show:%s | DOM:%s',
        COALESCE(NEW.address, ''),
        TO_CHAR(NEW.date, 'MM/DD/YYYY'),
        COALESCE(NEW.zillow_views::TEXT, ''),
        COALESCE(NEW.zillow_saves::TEXT, ''),
        COALESCE(NEW.homes_views::TEXT, ''),
        COALESCE(NEW.mls_matches::TEXT, ''),
        COALESCE(NEW.mls_emailed::TEXT, ''),
        COALESCE(NEW.showings::TEXT, ''),
        COALESCE(NEW.days_on_market::TEXT, '')
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate stats fields
DROP TRIGGER IF EXISTS trigger_calculate_listing_stats ON spartan1_listing_stats;
CREATE TRIGGER trigger_calculate_listing_stats
BEFORE INSERT OR UPDATE ON spartan1_listing_stats
FOR EACH ROW
EXECUTE FUNCTION calculate_listing_stats();

-- Enable RLS (Row Level Security)
ALTER TABLE spartan1_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE spartan1_listing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE spartan1_narrative_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin (Brandon) only
-- Check if user is admin by querying agent_profiles table
CREATE POLICY "Admin only access - listings" ON spartan1_listings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM agent_profiles
            WHERE agent_profiles.user_id = auth.uid()
            AND agent_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin only access - stats" ON spartan1_listing_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM agent_profiles
            WHERE agent_profiles.user_id = auth.uid()
            AND agent_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin only access - narrative" ON spartan1_narrative_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM agent_profiles
            WHERE agent_profiles.user_id = auth.uid()
            AND agent_profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON spartan1_listings TO authenticated;
GRANT ALL ON spartan1_listing_stats TO authenticated;
GRANT ALL ON spartan1_narrative_log TO authenticated;
