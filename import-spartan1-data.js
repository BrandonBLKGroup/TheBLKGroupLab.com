/**
 * Spartan 1 Data Import Script
 * Imports all CSV data into Supabase
 * Run this after creating the database schema
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://fzlwkbhpsklsgkinwljt.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bHdrYmhwc2tsc2draW53bGp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA1MTQzMSwiZXhwIjoyMDg3NjI3NDMxfQ.PKPShz05ibsEXYKksSNcTeyR0tjB_z1YEk3oOLMyVIc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// CSV file paths (from Discord attachments)
const CSV_FILES = {
  narrative: '/Users/jarvis/.openclaw/media/inbound/b5583001-7841-4dce-a59f-1feb1aae5cee.csv',
  stats: '/Users/jarvis/.openclaw/media/inbound/35d09330-c921-4612-afce-7418250a9a93.csv',
  listings: '/Users/jarvis/.openclaw/media/inbound/9f11397a-f73c-4a33-b787-6ccfb28ae60f.csv',
  actions: '/Users/jarvis/.openclaw/media/inbound/09646162-7b84-4fbe-8d15-1e1099643a66.csv',
  emails: '/Users/jarvis/.openclaw/media/inbound/e8dbc79b-6bb2-43c4-97e0-0cd0e608bbe2.csv',
  workflow: '/Users/jarvis/.openclaw/media/inbound/a42395f7-54ea-4bf9-b429-8f78b1bb3b01.csv'
};

// Parse CSV manually (simple parser for this use case)
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    // Skip empty rows or test data
    if (values.some(v => v && v !== 'TEST' && !v.includes('Test'))) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });
      rows.push(row);
    }
  }
  
  return rows;
}

// Parse date in various formats
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '' || dateStr === 'undefined') return null;
  
  // Handle MM/DD or MM/DD/YY or MM/DD/YYYY format
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 2) {
      // MM/DD format - assume current year 2026
      const [month, day] = parts;
      return `2026-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else if (parts.length === 3) {
      let [month, day, year] = parts;
      // Handle 2-digit year
      if (year.length === 2) {
        year = '20' + year;
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  // Already in YYYY-MM-DD format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // Handle YY-MM-DD format (like 25-11-13)
  if (dateStr.match(/^\d{2}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-');
    return `20${year}-${month}-${day}`;
  }
  
  return null;
}

// Clean address for consistency
function cleanAddress(address) {
  if (!address) return null;
  return address
    .replace(/,\s*AR\s*$/, ', AR')
    .replace(/\s+/g, ' ')
    .trim();
}

async function importListings() {
  console.log('📋 Importing Listings...');
  
  const content = fs.readFileSync(CSV_FILES.listings, 'utf-8');
  const rows = parseCSV(content);
  
  const listings = rows
    .filter(row => row['Property Address'] && !row['Property Address'].includes('TEST'))
    .map(row => ({
      address: cleanAddress(row['Property Address']),
      list_date: parseDate(row['Listing Date Started']),
      status: (row['Status'] || 'Active').toLowerCase(),
      week_1_sent: parseDate(row['Week 1 Update Sent']),
      week_2_sent: parseDate(row['Week 2 Update Sent']),
      week_3_sent: parseDate(row['Week 3 Update Sent']),
      week_4_sent: parseDate(row['Week 4 Update Sent']),
      notes: row['Notes'] || null
    }))
    .filter(listing => listing.address && listing.list_date);
  
  console.log(`  Found ${listings.length} valid listings`);
  
  // Insert with upsert (address is unique)
  for (const listing of listings) {
    const { data, error } = await supabase
      .from('spartan1_listings')
      .upsert(listing, { onConflict: 'address' });
    
    if (error) {
      console.error(`  ❌ Error inserting ${listing.address}:`, error.message);
    } else {
      console.log(`  ✅ Imported: ${listing.address}`);
    }
  }
  
  return listings.length;
}

async function importStats() {
  console.log('📊 Importing Listing Stats...');
  
  const content = fs.readFileSync(CSV_FILES.stats, 'utf-8');
  const rows = parseCSV(content);
  
  // Get listing IDs for foreign key references
  const { data: listings } = await supabase
    .from('spartan1_listings')
    .select('id, address');
  
  const addressToId = {};
  listings.forEach(l => {
    addressToId[cleanAddress(l.address)] = l.id;
  });
  
  const stats = rows
    .filter(row => row['Property Address'] && !row['Property Address'].includes('TEST'))
    .map(row => {
      const address = cleanAddress(row['Property Address']);
      return {
        listing_id: addressToId[address] || null,
        address: address,
        date: parseDate(row['Date']),
        zillow_views: parseInt(row['Zillow Views']?.replace(/,/g, '')) || null,
        zillow_saves: parseInt(row['Zillow Saves']) || null,
        projected_monthly_saves: parseInt(row['Projected Monthly Saves']) || null,
        internal_grade: row['Internal Grade'] || null,
        homes_views: parseInt(row['Homes.com Views']?.replace(/,/g, '')) || null,
        mls_matches: parseInt(row['MLS Matches']) || null,
        mls_emailed: parseInt(row['MLS Emailed']) || null,
        showings: row['Showings'] || null,
        step_diagnosis: row['Step Diagnosis'] || null,
        days_on_market: parseInt(row['Days On Market']) || null,
        copy_for_claude: row['Copy for Claude'] || null
      };
    })
    .filter(stat => stat.address && stat.date);
  
  console.log(`  Found ${stats.length} valid stat entries`);
  
  for (const stat of stats) {
    const { data, error } = await supabase
      .from('spartan1_listing_stats')
      .insert(stat);
    
    if (error) {
      console.error(`  ❌ Error inserting stats for ${stat.address}:`, error.message);
    } else {
      console.log(`  ✅ Imported stats: ${stat.address} (${stat.date})`);
    }
  }
  
  return stats.length;
}

async function importNarrativeLog() {
  console.log('📝 Importing Narrative Log...');
  
  const content = fs.readFileSync(CSV_FILES.narrative, 'utf-8');
  const rows = parseCSV(content);
  
  // Get listing IDs
  const { data: listings } = await supabase
    .from('spartan1_listings')
    .select('id, address');
  
  const addressToId = {};
  listings.forEach(l => {
    addressToId[cleanAddress(l.address)] = l.id;
  });
  
  const narratives = rows
    .filter(row => row['Property Address'] && !row['Property Address'].includes('TEST'))
    .map(row => {
      const address = cleanAddress(row['Property Address']);
      return {
        listing_id: addressToId[address] || null,
        address: address,
        date: parseDate(row['Date']),
        week: row['Week'] || null,
        stats_snapshot: row['Stats Snapshot'] || null,
        diagnosis: row['Diagnosis'] || null,
        recommendation: row['Recommendation'] || null,
        tone: row['Tone/Energy'] || null,
        summary: row['Email Summary'] || null
      };
    })
    .filter(n => n.address && n.date);
  
  console.log(`  Found ${narratives.length} valid narrative entries`);
  
  for (const narrative of narratives) {
    const { data, error } = await supabase
      .from('spartan1_narrative_log')
      .insert(narrative);
    
    if (error) {
      console.error(`  ❌ Error inserting narrative for ${narrative.address}:`, error.message);
    } else {
      console.log(`  ✅ Imported narrative: ${narrative.address} (${narrative.week})`);
    }
  }
  
  return narratives.length;
}

async function main() {
  console.log('🚀 Starting Spartan 1 Data Import\n');
  
  try {
    const listingsCount = await importListings();
    console.log(`\n✅ Imported ${listingsCount} listings\n`);
    
    const statsCount = await importStats();
    console.log(`\n✅ Imported ${statsCount} stat entries\n`);
    
    const narrativeCount = await importNarrativeLog();
    console.log(`\n✅ Imported ${narrativeCount} narrative entries\n`);
    
    console.log('🎉 Data import complete!');
    console.log(`\nSummary:`);
    console.log(`  Listings: ${listingsCount}`);
    console.log(`  Stats: ${statsCount}`);
    console.log(`  Narratives: ${narrativeCount}`);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

main();
