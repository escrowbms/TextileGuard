// @ts-nocheck - Supabase Deno Edge Function (not a Node.js file)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const waToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Utility to format phone for Meta API
  const formatPhone = (p: string) => {
    const clean = p.replace(/\D/g, '');
    return clean.startsWith('91') ? clean : `91${clean}`;
  };

  try {
    console.log("Starting Reminder Worker...");

    // 1. Get all active companies and their rules
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, name, settings');

    if (compError) throw compError;

    let processedCount = 0;

    for (const company of companies) {
      // 2. Fetch non-paid invoices for this company
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select(`
          id, 
          invoice_number, 
          total_amount, 
          balance_due, 
          due_date,
          status,
          aging_bucket,
          customer_id,
          customers (name, phone)
        `)
        .eq('company_id', company.id)
        .gt('balance_due', 0);

      if (invError) continue;

      for (const invoice of invoices) {
        const dueDate = new Date(invoice.due_date);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

        // 2.5 RECALCULATE AGING BUCKETS & STATUS
        let newStatus = invoice.status;
        let newBucket = invoice.aging_bucket;

        if (diffDays <= 0) {
          newBucket = '0-30';
        } else if (diffDays <= 30) {
          newBucket = '0-30';
          newStatus = 'overdue';
        } else if (diffDays <= 60) {
          newBucket = '31-60';
          newStatus = 'overdue';
        } else if (diffDays <= 90) {
          newBucket = '61-90';
          newStatus = 'overdue';
        } else if (diffDays <= 180) {
          newBucket = '91-180';
          newStatus = 'overdue';
        } else {
          newBucket = '180+';
          newStatus = 'overdue';
        }

        // Only update if changed
        if (newBucket !== invoice.aging_bucket || newStatus !== invoice.status) {
          await supabase
            .from('invoices')
            .update({ aging_bucket: newBucket, status: newStatus })
            .eq('id', invoice.id);
        }

        // 3. AUTO-FREEZE LOGIC
        const autoFreezeThreshold = (company.settings as any)?.auto_freeze_days || 90;
        if (diffDays >= autoFreezeThreshold) {
          const { data: customer } = await supabase
            .from('customers')
            .select('is_credit_frozen')
            .eq('id', invoice.customer_id)
            .single();

          if (customer && !customer.is_credit_frozen) {
            console.log(`FREEZING CUSTOMER: ${invoice.customer_id}`);
            await supabase
              .from('customers')
              .update({ is_credit_frozen: true })
              .eq('id', invoice.customer_id);
          }
        }

        // 4. REMINDER TRIGGER LOGIC
        const triggerDays = [1, 7, 15, 25, 45, 60, 75, 90];
        if (triggerDays.includes(diffDays)) {
          const { data: existing } = await supabase
            .from('reminders')
            .select('id')
            .eq('invoice_id', invoice.id)
            .eq('trigger_day', diffDays)
            .limit(1)
            .maybeSingle();

          if (!existing) {
            let escalationLevel = 0;
            let message = "";
            const customerName = (invoice.customers as any).name;
            const amount = invoice.balance_due;
            const invNum = invoice.invoice_number;

            if (diffDays >= 90) {
              escalationLevel = 3;
              message = `CRITICAL: Invoice #${invNum} is 90+ days overdue. Account Frozen.`;
            } else if (diffDays >= 60) {
              escalationLevel = 3;
              message = `URGENT: Invoice #${invNum} is 60+ days overdue.`;
            } else if (diffDays >= 30) {
              escalationLevel = 2;
              message = `Reminder: Invoice #${invNum} is 30+ days overdue. Penal interest may apply.`;
            } else {
              escalationLevel = 1;
              message = `Reminder: Invoice #${invNum} is overdue.`;
            }

            const reminderBase = {
              company_id: company.id,
              invoice_id: invoice.id,
              trigger_day: diffDays,
              status: 'pending',
              escalation_level: escalationLevel,
              metadata: { message, customer_name: customerName, amount, invoice_number: invNum }
            };

            const channels = ['whatsapp'];
            if (escalationLevel >= 2) channels.push('email');
            if (escalationLevel >= 3) {
              channels.push('sms');
              // 5. SENIOR MANAGEMENT ALERT
              await supabase.from('escalations').insert([{
                company_id: company.id,
                customer_id: invoice.customer_id,
                level: 'critical',
                severity: 'high',
                reason: `Unpaid invoice #${invNum} (${diffDays} days past due)`,
                status: 'pending'
              }]);
            }

            for (const ch of channels) {
              const { data: reminder, error: remInsertError } = await supabase
                .from('reminders')
                .insert([{ ...reminderBase, channel: ch }])
                .select('id')
                .single();

              // FULL AUTOMATION TRIGGER (IF KEYS EXIST)
              if (ch === 'whatsapp' && waToken && phoneId && !remInsertError && reminder) {
                const customer = (invoice.customers as any);
                const phone = customer.phone ? formatPhone(customer.phone) : null;
                
                if (phone && phone.length >= 10) {
                  try {
                    const waRes = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
                      method: "POST",
                      headers: {
                        "Authorization": `Bearer ${waToken}`,
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: phone,
                        type: "text",
                        text: { body: message }
                      })
                    });

                    if (waRes.ok) {
                      await supabase.from('reminders').update({ status: 'sent' }).eq('id', (reminder as any).id);
                      console.log(`Successfully auto-sent to ${phone}`);
                    } else {
                      const logError = await waRes.json();
                      console.error(`Meta API Error for ${phone}:`, logError);
                    }
                  } catch (e) {
                    console.error("Fetch error for WhatsApp API:", e);
                  }
                }
              }
            }
            processedCount++;
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed: processedCount }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
