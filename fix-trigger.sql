-- Fix the trigger function - proper type casting for date calculations

DROP FUNCTION IF EXISTS update_listing_days() CASCADE;

CREATE OR REPLACE FUNCTION update_listing_days()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate days on market (simple date subtraction gives integer in PostgreSQL)
    NEW.days_on_market := (CURRENT_DATE - NEW.list_date);
    
    -- Calculate days since update
    NEW.days_since_update := (
        CURRENT_DATE - GREATEST(
            COALESCE(NEW.week_1_sent, DATE '1900-01-01'),
            COALESCE(NEW.week_2_sent, DATE '1900-01-01'),
            COALESCE(NEW.week_3_sent, DATE '1900-01-01'),
            COALESCE(NEW.week_4_sent, DATE '1900-01-01')
        )
    );
    
    -- If no weeks marked yet, days_since_update = days_on_market
    IF NEW.week_1_sent IS NULL AND NEW.week_2_sent IS NULL AND NEW.week_3_sent IS NULL AND NEW.week_4_sent IS NULL THEN
        NEW.days_since_update := NEW.days_on_market;
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_update_listing_days ON spartan1_listings;
CREATE TRIGGER trigger_update_listing_days
BEFORE INSERT OR UPDATE ON spartan1_listings
FOR EACH ROW
EXECUTE FUNCTION update_listing_days();
