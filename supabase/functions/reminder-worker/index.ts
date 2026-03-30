// @ts-nocheck - Supabase Deno Edge Function (not a Node.js file)
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

        // 3. AUTO-FREEZE LOGIC
        const autoFreezeThreshold = (company.settings as any)?.auto_freeze_days || 90;
        if (diffDays >= autoFreezeThreshold) {
          // Check current customer status first to avoid redundant updates
          const { data: customer } = await supabase
            .from('customers')
            .select('is_credit_frozen')
            .eq('id', invoice.customer_id)
            .single();

          if (customer && !customer.is_credit_frozen) {
            console.log(`FREEZING CUSTOMER: ${invoice.customer_id} due to ${diffDays} days delay on ${invoice.invoice_number}`);
            await supabase
              .from('customers')
              .update({ is_credit_frozen: true })
              .eq('id', invoice.customer_id);
          }
        }

        // 4. ESCALATION LOGIC (Define trigger days: 7, 15, 30, 45, 60, 90)
        const triggerDays = [7, 15, 30, 45, 60, 90];

        if (triggerDays.includes(diffDays)) {
          const { data: existing } = await supabase
            .from('reminders')
            .select('id')
            .eq('invoice_id', invoice.id)
            .eq('trigger_day', diffDays)
            .limit(1)
            .maybeSingle();

          if (!existing) {
            // Tiered escalation level
            let escalationLevel = 0;
            let message = "";
            const customerName = (invoice.customers as any).name;
            const amount = invoice.balance_due;
            const invNum = invoice.invoice_number;

            if (diffDays >= 90) {
              escalationLevel = 3;
              message = `PRANAM ${customerName} JI, TEXTILEGUARD FINAL NOTICE: Invoice #${invNum} is critically overdue (90+ days). AAPKA CREDIT BLOCK HO GAYA HAI. Kripya turant payment karein ya direct contact karein. Urgent.`;
            } else if (diffDays >= 60) {
              escalationLevel = 3;
              message = `PRANAM ${customerName} JI, TEXTILEGUARD NOTICE: Invoice #${invNum} is critically overdue (60+ days). AAPKA CREDIT BLOCK HO SAKTA HAI. Kripya turant payment confirm karein.`;
            } else if (diffDays >= 30) {
              escalationLevel = 2;
              message = `Pranam ${customerName} ji, TextileGuard Warning: Aapka invoice #${invNum} 30 din se pending hai. Rules ke mutabik 18% interest apply ho sakta hai. Please clear this immediately.`;
            } else if (diffDays >= 15) {
              escalationLevel = 1;
              message = `Pranam ${customerName} ji, TextileGuard notice: Invoice #${invNum} 15 din se overdue hai. Kripya aaj hi settle karne ka dhyan rakhein. Dhanyawad.`;
            } else {
              escalationLevel = 0;
              message = `Pranam ${customerName} ji, TextileGuard reminder: Aapka invoice #${invNum} amount ₹${amount.toLocaleString()} overdue hai. Kripya payment logic check karein. Thank you!`;
            }

            await supabase.from('reminders').insert({
              company_id: company.id,
              invoice_id: invoice.id,
              trigger_day: diffDays,
              channel: 'whatsapp',
              status: 'pending',
              escalation_level: escalationLevel,
              metadata: { message }
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

  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Worker Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
