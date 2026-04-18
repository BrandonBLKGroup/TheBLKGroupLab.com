/**
 * Programmatic Database Setup for Spartan 1 Dashboard
 * Creates tables via Supabase Management API
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fzlwkbhpsklsgkinwljt.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bHdrYmhwc2tsc2draW53bGp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA1MTQzMSwiZXhwIjoyMDg3NjI3NDMxfQ.PKPShz05ibsEXYKksSNcTeyR0tjB_z1YEk3oOLMyVIc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTables() {
    console.log('🔍 Checking if tables exist...\n');
    
    // Try to query each table
    const tables = ['spartan1_listings', 'spartan1_listing_stats', 'spartan1_narrative_log'];
    
    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
        
        if (error) {
            console.log(`❌ Table ${table} does not exist or is not accessible`);
        } else {
            console.log(`✅ Table ${table} exists`);
        }
    }
}

console.log('📊 Spartan 1 Database Setup\n');
console.log('⚠️  Note: Supabase requires SQL to be run via Dashboard for table creation.\n');
console.log('Please follow these steps:\n');
console.log('1. Open Supabase SQL Editor:');
console.log('   https://supabase.com/dashboard/project/fzlwkbhpsklsgkinwljt/sql/new\n');
console.log('2. Copy and paste the SQL from: spartan1-schema.sql\n');
console.log('3. Click "Run" to execute\n');
console.log('4. Return here and I will import the data\n');

checkTables();
