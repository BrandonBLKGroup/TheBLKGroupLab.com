# AUTO-ESCALATION SETUP GUIDE

**Purpose:** Automatically escalate all stat targets by 10% on the 1st of each month.

**Status:** Edge function created, needs deployment and cron trigger setup.

---

## What Gets Escalated

On the 1st of each month, ALL targets in `lab_stat_targets` increase by 10%:

- Team Gross Commission: $100K → $110K → $121K → ...
- Brandon's Income: $60K → $66K → $72.6K → ...
- Volume: $5M → $5.5M → $6.05M → ...
- Transactions: 12.5 → 13.75 → 15.125 → ...
- New Listings: 25 → 27.5 → 30.25 → ...
- Opens: 55 → 60.5 → 66.55 → ...

**Formula:** `new_target = current_target × 1.10`

---

## STEP 1: Install Supabase CLI

```bash
brew install supabase/tap/supabase
```

Or download from: https://github.com/supabase/cli/releases

---

## STEP 2: Login to Supabase

```bash
cd /Users/jarvis/.openclaw/workspace-spartan4/projects/theblkgrouplab
supabase login
```

This will open a browser for authentication.

---

## STEP 3: Link Project

```bash
supabase link --project-ref fzlwkbhpsklsgkinwljt
```

You'll be prompted for your database password. Use the password from your Supabase dashboard.

---

## STEP 4: Deploy the Edge Function

```bash
supabase functions deploy escalate-targets
```

This uploads the function to Supabase and makes it available at:
`https://fzlwkbhpsklsgkinwljt.supabase.co/functions/v1/escalate-targets`

---

## STEP 5: Set Up Cron Trigger

**Option A: Supabase pg_cron (Recommended)**

Run this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run on the 1st of every month at 12:01 AM UTC
SELECT cron.schedule(
  'escalate-monthly-targets',          -- job name
  '1 0 1 * *',                         -- cron expression (1st day, 12:01 AM)
  $$
  SELECT
    net.http_post(
      url := 'https://fzlwkbhpsklsgkinwljt.supabase.co/functions/v1/escalate-targets',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**REPLACE `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key from Supabase Settings → API.**

---

**Option B: External Cron (GitHub Actions, OpenClaw, etc.)**

Create a cron job that runs on the 1st of each month:

```bash
curl -X POST \
  https://fzlwkbhpsklsgkinwljt.supabase.co/functions/v1/escalate-targets \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## STEP 6: Test the Function

**Manual test (run anytime):**

```bash
curl -X POST \
  https://fzlwkbhpsklsgkinwljt.supabase.co/functions/v1/escalate-targets \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected response (success):**

```json
{
  "success": true,
  "message": "Targets escalated successfully",
  "month": "2026-06-01",
  "targets": [
    {"stat_name": "team_gci", "target_value": 110000},
    {"stat_name": "brandon_income", "target_value": 66000},
    ...
  ]
}
```

**Expected response (already exists):**

```json
{
  "message": "Targets already exist for next month",
  "month": "2026-06-01",
  "count": 6
}
```

---

## STEP 7: Verify in Supabase

1. Go to Supabase SQL Editor
2. Run this query to see all targets:

```sql
SELECT month, stat_name, target_value, notes
FROM lab_stat_targets
ORDER BY month DESC, stat_name;
```

You should see June 2026 targets with 10% higher values.

---

## How It Works

1. **On the 1st of each month at 12:01 AM UTC**, the cron job triggers
2. **Edge function runs** and fetches current month's targets from `lab_stat_targets`
3. **Calculates 10% increase** for each target
4. **Inserts new rows** for next month with escalated values
5. **Logs the operation** (notes field: "Auto-escalated from YYYY-MM-DD (10% increase)")

**Safety features:**
- Won't create duplicates (checks if next month already exists)
- Uses `ON CONFLICT DO NOTHING` pattern
- Logs every escalation with notes field

---

## Troubleshooting

**Edge function not deploying?**
```bash
supabase functions list  # Check if it shows up
supabase functions logs escalate-targets  # View logs
```

**Cron not triggering?**
```sql
-- View scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

**Targets not escalating?**
- Check function logs in Supabase Dashboard → Edge Functions
- Verify service role key has correct permissions
- Manually trigger the function with curl to test

---

## Manual Escalation (Fallback)

If automated system fails, run this SQL on the 1st of each month:

```sql
-- Replace YYYY-MM with current/next month
INSERT INTO lab_stat_targets (month, stat_name, target_value, notes)
SELECT 
  '2026-06-01'::date AS month,
  stat_name,
  ROUND(target_value * 1.10, 2) AS target_value,
  'Manual escalation (10% increase)' AS notes
FROM lab_stat_targets
WHERE month = '2026-05-01'
ON CONFLICT (month, stat_name) DO NOTHING;
```

---

## Files Created

- `/supabase/functions/escalate-targets/index.ts` - Edge function code
- `SETUP-AUTO-ESCALATION.md` - This setup guide (you're reading it)

---

**DEPLOYMENT STATUS:** ⏳ Waiting for Brandon to run Steps 1-7

**Once deployed, the system will automatically escalate targets every month on the 1st. Set it and forget it.** 🚀
