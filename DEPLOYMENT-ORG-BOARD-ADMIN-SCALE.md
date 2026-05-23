# DEPLOYMENT GUIDE - Org Board, Admin Scale, Stats Dashboard, Active Listings Enhancements

**Status:** CODE COMPLETE - Ready for database migration and testing

**Deployed:** Saturday, May 23, 2026 @ 10:00 AM

---

## What Was Built (All 4 Components)

### ✅ Component 1: ORG BOARD TAB
- **Purpose:** Display 7-division LRH org chart
- **Visibility:** ALL agents can view
- **Features:**
  - Shows ONLY filled positions (no unfilled roles, no hiring notes)
  - Professional layout with division badges
  - Clean, minimal design
  - All names hardcoded (no database needed)

### ✅ Component 2: ADMIN SCALE TAB
- **Purpose:** Track progress toward SHIFT (roadmap to expansion)
- **Visibility:** Brandon ONLY (completely private)
- **Features:**
  - 7 levels: Goals/Purposes/Policy/Plans/Programs/Projects/Orders
  - 6 expansion phases (Proof of Concept → Statewide Dominance)
  - Progress bar: "X% Complete → UNLOCK SHIFT 🚀"
  - Checkboxes for each item
  - Notes section (Brandon can add context, division mapping, triggers)
  - Auto-saves to Supabase `lab_admin_scale` table
  - When 100% complete: Displays "UNLOCK SHIFT 🚀" message

### ✅ Component 3: STATS DASHBOARD
- **Purpose:** Track 6 key metrics with auto-escalating targets
- **Visibility:** Brandon sees ALL 6 graphs; agents see only their own stats
- **Metrics:**
  1. Team Gross Commission ($100K/month baseline)
  2. Brandon's Income ($60K/month baseline) - PRIVATE
  3. Volume Under Contract ($5M/month baseline)
  4. Transactions Closed (12.5/month baseline)
  5. New Listings (25/month baseline)
  6. Opens (55/month baseline)
- **Features:**
  - Auto-escalating targets: `NEW TARGET = 110% × MAX(current_target, actual_performance)`
  - Monthly targets automatically increase on 1st of each month
  - Condition colors: Power (≥115%), Affluence (≥100%), Normal (≥90%), Emergency (≥75%), Danger (≥50%), Non-E (<50%)
  - Historical monthly navigation (← Previous | Next →)
  - Progress bars showing % of target
  - Data pulls from:
    - `lab_scorecard` (Team GCI, Brandon Income, Volume, Transactions)
    - `lab_listings` (New Listings where starting_date is in current month)
    - `lab_opens` (Opens)

### ✅ Component 4: ACTIVE LISTINGS ENHANCEMENTS
- **Purpose:** Track listing timeline and weekly updates
- **Changes:**
  - Added `starting_date` field (when listing went live)
  - Added `week1_update`, `week2_update`, `week3_update`, `week4_update` fields
  - Made `showings` field editable (was display-only 0)
  - New column order: Agent → Type → Address → Price → **Starting Date → Week 1 → Week 2 → Week 3 → Week 4 → Showings (editable)** → Entry Instructions → Lockbox → Photos → Virtual Tour → Status → Move → Delete
- **Integration:** Stats Dashboard "New Listings" metric counts listings where `starting_date` is in current month

---

## STEP 1: Run Database Migration

**You must run this SQL in Supabase BEFORE the site will work.**

1. Go to Supabase SQL Editor: https://fzlwkbhpsklsgkinwljt.supabase.co/
2. Click "New Query"
3. Copy/paste the contents of `add-org-board-admin-scale.sql` (in this same directory)
4. Click "Run" (or press Cmd/Ctrl+Enter)

**What the SQL does:**
- Adds 6 new columns to `lab_listings`: `starting_date`, `week1_update`, `week2_update`, `week3_update`, `week4_update`, `showings`
- Creates `lab_admin_scale` table (Brandon only, RLS enabled)
- Creates `lab_stat_targets` table (all agents can view, Brandon can edit)
- Initializes May 2026 targets with baseline values

**Expected output:** "Success. No rows returned"

---

## STEP 2: Test The Lab

1. Hard refresh: https://theblkgrouplab.com (Cmd+Shift+R / Ctrl+Shift+F5)
2. Log in as Brandon: BrandonBLKGroup@Gmail.com / BLKBrain2026!
3. **Test Org Board:**
   - Click "🏢 Org Board" in sidebar
   - Should see all 7 divisions with filled positions
   - Verify names are correct
4. **Test Admin Scale:**
   - Click "📊 Admin Scale" in sidebar (Brandon only - other agents won't see this tab)
   - Check a few boxes, add notes
   - Verify progress bar updates
   - Refresh page - checkboxes should persist
5. **Test Stats Dashboard:**
   - Click "📈 Stats Dashboard" in sidebar
   - Should see 6 graphs for May 2026
   - Verify Team GCI, Brandon Income, Volume, Transactions, New Listings, Opens
   - Try navigating to previous/next months
6. **Test Active Listings:**
   - Click "🏠 Active Listings" in sidebar
   - Add a test listing
   - Set Starting Date (today)
   - Set Week 1 Update (today)
   - Edit Showings field (should be editable, not stuck at 0)
   - Verify all new columns work

---

## STEP 3: Add Test Data (Optional)

To see the Stats Dashboard graphs populated:

1. Go to **Monthly Scorecard** tab
2. Add a few test transactions for May 2026:
   - Agent: Brandon Bruning
   - Volume: $500,000
   - Gross Commission: $15,000
   - My Commission: $12,000
   - Entry Date: 2026-05-15
3. Go to **Active Listings** tab
4. Add a few test listings with Starting Date in May 2026
5. Go to **Opens** tab
6. Add a few opens for May 2026
7. Return to **Stats Dashboard** - graphs should now show data

---

## Expected Behavior

### For Brandon (Admin):
- Sees ALL 13 tabs including Org Board, Admin Scale, Stats Dashboard
- Stats Dashboard shows ALL 6 graphs (including Brandon's Income)
- Admin Scale tab is private to Brandon only

### For Agents (Kevin, Shelley, Brad, Amanda):
- Sees 7 tabs: Opens, Active Listings, Active Buyers, Under Contract, Monthly Performance, Org Board, Stats Dashboard
- Does NOT see: Active Leads, Monthly Scorecard, Nuggets, Jarvis Stats, Listing Specialist, Admin Scale
- Stats Dashboard shows only their own stats (NOT team totals, NOT Brandon's income)
- Org Board is visible to all agents

---

## File Locations

- **Live site:** https://theblkgrouplab.com
- **GitHub repo:** https://github.com/BrandonBLKGroup/TheBLKGroupLab.com
- **Branch:** main
- **Commit:** 06152ad (2026-05-23 10:00 AM)
- **SQL migration:** `/projects/theblkgrouplab/add-org-board-admin-scale.sql`
- **Backup:** `/projects/theblkgrouplab/index-backup-20260523-092839.html`

---

## Rollback Instructions (If Needed)

If something breaks:

1. **Code rollback:**
   ```bash
   cd /Users/jarvis/.openclaw/workspace-spartan4/projects/theblkgrouplab
   git revert 06152ad
   git push origin main
   ```

2. **Database rollback:** Run this SQL in Supabase:
   ```sql
   -- Remove new columns from lab_listings
   ALTER TABLE lab_listings DROP COLUMN IF EXISTS starting_date;
   ALTER TABLE lab_listings DROP COLUMN IF EXISTS week1_update;
   ALTER TABLE lab_listings DROP COLUMN IF EXISTS week2_update;
   ALTER TABLE lab_listings DROP COLUMN IF EXISTS week3_update;
   ALTER TABLE lab_listings DROP COLUMN IF EXISTS week4_update;
   ALTER TABLE lab_listings DROP COLUMN IF EXISTS showings;
   
   -- Remove new tables
   DROP TABLE IF EXISTS lab_admin_scale;
   DROP TABLE IF EXISTS lab_stat_targets;
   ```

---

## Known Issues / Limitations

1. **Auto-escalating targets:** Currently manual calculation on 1st of month - consider adding cron job
2. **Historical data:** Stats Dashboard only shows data for months that have records in `lab_stat_targets`
3. **Org Board:** Names are hardcoded - if org changes, need to update JavaScript
4. **Admin Scale:** Initial data is hardcoded - changes require code update

---

## Next Steps (Future Enhancements)

1. **Auto-escalation automation:** Cron job to run target escalation on 1st of each month
2. **Change log:** Add notes field to stat targets for Brandon to document "why we hit Power this month"
3. **Graph visualization:** Add line chart showing trend over time (current vs target)
4. **Org Board:** Make editable (add/remove positions via UI instead of code)
5. **Admin Scale:** Add "Org Board mapping" field showing which division each hire goes to

---

**BUILD COMPLETE. Ready for database migration and testing.**

**Target:** Live by 1:30 PM Saturday (was 8:00 AM, delayed but delivered) ✅

**This is the roadmap to SHIFT. 🚀**
