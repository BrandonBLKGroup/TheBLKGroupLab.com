# Monthly Scorecard Updates - Deployment Instructions

## Changes Made

### 1. PAID/NOT PAID Status Dropdown
- Each transaction now has a dropdown to mark as "PAID" or "NOT PAID"
- Visual feedback: green for paid, orange for not paid
- Default: "NOT PAID" for new transactions

### 2. Auto-Sync to Under Contract
- When you add a transaction to Monthly Scorecard, it automatically creates an entry in Under Contract
- When you update:
  - **Transaction Name** → syncs to Under Contract
  - **Date** → sets contract_date and calculates deadlines (SPD due 10 days, IRSA due 5 days)
  - **Agent** → syncs to Under Contract
  - **Volume** → syncs to Under Contract

### 3. New Totals
**Monthly totals (per month card):**
- Volume
- Gross Commission
- Monthly Total (My Commission)
- Paid (green) - sum of paid transactions
- Not Paid (orange) - sum of unpaid transactions

**YTD totals (bottom bar):**
- YTD Total
- YTD Total Paid (green)
- Total Not Paid (orange)
- YTD Gross Commission
- YTD Volume

## Required: Run SQL Migration

**⚠️ IMPORTANT: You must run the SQL file to add the new database columns.**

### Steps:

1. Go to: https://fzlwkbhpsklsgkinwljt.supabase.co/project/default/sql/new
2. Copy the entire contents of `add-scorecard-features.sql` (in the same folder as index.html)
3. Paste into the SQL Editor
4. Click **"Run"**
5. Refresh the Lab page

### What the SQL does:
- Adds `payment_status` column (PAID/NOT PAID)
- Adds `entry_date` column (for contract date sync)
- Adds `agent` and `agent_id` columns to scorecard
- Adds `volume` and `agent` columns to contracts (if missing)

## Testing Checklist

After running the SQL:

1. ✅ Go to Monthly Scorecard tab
2. ✅ Add a new transaction
3. ✅ Check Under Contract tab - should see new entry automatically
4. ✅ Set a Date in scorecard - check Under Contract for updated contract_date and deadlines
5. ✅ Toggle PAID/NOT PAID dropdown - check totals update correctly
6. ✅ Verify YTD totals at bottom show correct Paid vs Not Paid amounts

## Files Changed

- `index.html` - Updated Monthly Scorecard rendering and sync logic
- `add-scorecard-features.sql` - Database migration
- `index-backup-20260522-224501.html` - Backup of previous version

## Live URL

Changes are live at: https://theblkgrouplab.com

(Hard refresh if you see old version: Cmd+Shift+R)

## Rollback

If something breaks, the backup is saved as `index-backup-20260522-224501.html`
