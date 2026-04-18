-- Policy Library table for The Lab
-- Admin-only feature for Brandon to write and store BLK Group Policy Letters

CREATE TABLE IF NOT EXISTS policy_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- HTML content from TipTap editor
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT title_not_empty CHECK (char_length(trim(title)) > 0)
);

-- Enable RLS
ALTER TABLE policy_library ENABLE ROW LEVEL SECURITY;

-- Admin-only policy (Brandon can read/write all policies)
CREATE POLICY "Admin full access to policies"
  ON policy_library
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agent_profiles
      WHERE agent_profiles.user_id = auth.uid()
      AND agent_profiles.role = 'admin'
    )
  );

-- Index for faster queries
CREATE INDEX idx_policy_library_status ON policy_library(status);
CREATE INDEX idx_policy_library_created_at ON policy_library(created_at DESC);
CREATE INDEX idx_policy_library_title ON policy_library(title);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_policy_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER policy_library_updated_at
  BEFORE UPDATE ON policy_library
  FOR EACH ROW
  EXECUTE FUNCTION update_policy_library_updated_at();

-- Grant permissions
GRANT ALL ON policy_library TO authenticated;
