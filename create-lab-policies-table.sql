-- Lab Policies table for The Lab - Listing Specialist feature
-- Admin-only feature for Brandon to write and store BLK Group Policy Letters

CREATE TABLE IF NOT EXISTS lab_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- HTML content from TipTap editor
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL,
  CONSTRAINT title_not_empty CHECK (char_length(trim(title)) > 0)
);

-- Enable RLS
ALTER TABLE lab_policies ENABLE ROW LEVEL SECURITY;

-- Admin-only policy (Brandon can read/write all policies)
CREATE POLICY "Admin full access to policies"
  ON lab_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agent_profiles
      WHERE agent_profiles.user_id::text = auth.uid()::text
      AND agent_profiles.role = 'admin'
    )
  );

-- Index for faster queries
CREATE INDEX idx_lab_policies_status ON lab_policies(status);
CREATE INDEX idx_lab_policies_created_at ON lab_policies(created_at DESC);
CREATE INDEX idx_lab_policies_title ON lab_policies(title);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_lab_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lab_policies_updated_at
  BEFORE UPDATE ON lab_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_lab_policies_updated_at();

-- Grant permissions
GRANT ALL ON lab_policies TO authenticated;
