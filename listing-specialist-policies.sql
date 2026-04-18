-- Listing Specialist Policy Library Table
CREATE TABLE lab_policies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text, -- HTML content from rich text editor
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id text NOT NULL
);

-- Enable RLS
ALTER TABLE lab_policies ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON lab_policies
  FOR ALL USING (auth.role() = 'authenticated');

-- Index for faster queries
CREATE INDEX lab_policies_user_id_idx ON lab_policies(user_id);
CREATE INDEX lab_policies_status_idx ON lab_policies(status);
CREATE INDEX lab_policies_created_at_idx ON lab_policies(created_at DESC);
