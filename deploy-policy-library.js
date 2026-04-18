const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPA_URL = 'https://fzlwkbhpsklsgkinwljt.supabase.co';
const SUPA_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bHdrYmhwc2tsc2draW53bGp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA1MTQzMSwiZXhwIjoyMDg3NjI3NDMxfQ.PKPShz05ibsEXYKksSNcTeyR0tjB_z1YEk3oOLMyVIc';

const sb = createClient(SUPA_URL, SUPA_SERVICE_KEY);

async function deploy() {
  console.log('Creating policy_library table...');
  
  const sql = fs.readFileSync('create-policy-library-table.sql', 'utf8');
  
  const { data, error } = await sb.rpc('exec_sql', { sql_string: sql });
  
  if (error) {
    console.error('Error creating table:', error);
    process.exit(1);
  }
  
  console.log('✓ Policy library table created successfully');
  console.log('✓ RLS policies enabled');
  console.log('✓ Admin can now create and manage policy letters');
}

deploy();
