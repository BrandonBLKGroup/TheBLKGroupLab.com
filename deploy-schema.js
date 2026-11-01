/**
 * Deploy Spartan 1 Schema to Supabase
 * Run with: node deploy-schema.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://fzlwkbhpsklsgkinwljt.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // never commit this key; set it in your shell when running this script
if (!SUPABASE_SERVICE_KEY) { console.error('Set SUPABASE_SERVICE_KEY in your environment first.'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('⚠️  MANUAL STEP REQUIRED');
console.log('\nSupabase does not allow programmatic SQL execution via REST API.');
console.log('You need to run the schema manually in the Supabase Dashboard:\n');
console.log('1. Go to: https://supabase.com/dashboard/project/fzlwkbhpsklsgkinwljt/sql/new');
console.log('2. Copy the contents of spartan1-schema.sql');
console.log('3. Paste into the SQL Editor');
console.log('4. Click "Run"');
console.log('\nAfter schema is deployed, run: node import-spartan1-data.js');
console.log('\n📄 Schema file location: /Users/jarvis/.openclaw/workspace-spartan4/projects/theblkgrouplab/spartan1-schema.sql');
