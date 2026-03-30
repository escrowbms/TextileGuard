import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("Starting Reminder Worker...");

    // 1. Get all active companies and their rules
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, name, settings');

    if (compError) throw compError;

    let processedCount = 0;

    for (const company of companies) {
      // 2. Fetch overdue invoices for this company
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select(`
          id, 
          invoice_number, 
          total_amount, 
          balance_due, 
          due_date,
          customer_id,
          customers (name)
        `)
        .eq('company_id', company.id)
        .gt('balance_due', 0);

      if (invError) continue;

      for (const invoice of invoices) {
        const dueDate = new Date(invoice.due_date);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

        // Define trigger days (e.g., 7, 15, 30 days overdue)
        const triggerDays = [7, 15, 30, 45, 60];

        if (triggerDays.includes(diffDays)) {
          // 3. Check if reminder already exists for this trigger day
          const { data: existing } = await supabase
            .from('reminders')
            .select('id')
            .eq('invoice_id', invoice.id)
            .eq('trigger_day', diffDays)
            .limit(1)
            .maybeSingle();

          if (!existing) {
            // 4. Create new reminder
            await supabase.from('reminders').insert({
              company_id: company.id,
              invoice_id: invoice.id,
              trigger_day: diffDays,
              channel: 'whatsapp',
              status: 'pending'
            });
            processedCount++;
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: processedCount,
      timestamp: new Date().toISOString() 
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Worker Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
