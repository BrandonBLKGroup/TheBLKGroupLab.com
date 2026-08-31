-- Create optempo_storage table for Brandon's OPTEMPO data
-- This stores his daily operations board, projects, and archived days

CREATE TABLE IF NOT EXISTS optempo_storage (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE optempo_storage ENABLE ROW LEVEL SECURITY;

-- Policy: Brandon (user ID: b5c2c7d8-cb11-4b00-a820-14f6c1e64b93) can do everything
CREATE POLICY "Brandon full access to optempo_storage"
    ON optempo_storage
    FOR ALL
    USING (auth.uid() = 'b5c2c7d8-cb11-4b00-a820-14f6c1e64b93'::uuid);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_optempo_storage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER optempo_storage_updated_at
    BEFORE UPDATE ON optempo_storage
    FOR EACH ROW
    EXECUTE FUNCTION update_optempo_storage_timestamp();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_optempo_storage_key ON optempo_storage(key);

COMMENT ON TABLE optempo_storage IS 'Brandon''s OPTEMPO operations board storage - daily tasks, projects, and archived days';
