// Supabase Edge Function: escalate-targets
// Runs on 1st of each month to increase all stat targets by 10%

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current date (1st of month)
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`

    console.log(`Current month: ${currentMonth}, Next month: ${nextMonthStr}`)

    // Fetch current month's targets
    const { data: currentTargets, error: fetchError } = await supabase
      .from('lab_stat_targets')
      .select('*')
      .eq('month', currentMonth)

    if (fetchError) {
      throw new Error(`Error fetching targets: ${fetchError.message}`)
    }

    if (!currentTargets || currentTargets.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No targets found for current month' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if next month targets already exist
    const { data: existingTargets } = await supabase
      .from('lab_stat_targets')
      .select('stat_name')
      .eq('month', nextMonthStr)

    if (existingTargets && existingTargets.length > 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Targets already exist for next month', 
          month: nextMonthStr,
          count: existingTargets.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create next month's targets (10% increase)
    const newTargets = currentTargets.map(target => ({
      month: nextMonthStr,
      stat_name: target.stat_name,
      target_value: Math.round(target.target_value * 1.10 * 100) / 100, // 10% increase, round to 2 decimals
      actual_value: 0,
      notes: `Auto-escalated from ${currentMonth} (10% increase)`
    }))

    const { data: insertedTargets, error: insertError } = await supabase
      .from('lab_stat_targets')
      .insert(newTargets)
      .select()

    if (insertError) {
      throw new Error(`Error inserting targets: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Targets escalated successfully',
        month: nextMonthStr,
        targets: insertedTargets
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
