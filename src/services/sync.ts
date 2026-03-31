import { supabase } from "@/lib/supabase";
import { calculateRiskLevel } from "./customers";

export interface SyncResult {
  invoicesProcessed: number;
  escalationsTriggered: number;
  creditsFrozen: number;
  timestamp: string;
}

export const runDeepSync = async (companyId: string): Promise<SyncResult> => {
  const today = new Date();
  let invoicesProcessed = 0;
  let escalationsTriggered = 0;
  let creditsFrozen = 0;

  // 1. Fetch Company Settings for thresholds
  const { data: company } = await supabase
    .from('companies')
    .select('settings')
    .eq('id', companyId)
    .single();
  
  const settings = company?.settings || { auto_freeze_days: 90 };

  // 2. Fetch all non-paid invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('company_id', companyId)
    .neq('status', 'paid');

  if (!invoices) return { invoicesProcessed: 0, escalationsTriggered: 0, creditsFrozen: 0, timestamp: today.toISOString() };

  for (const inv of invoices) {
    const dueDate = new Date(inv.due_date);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let newStatus = inv.status;
    let newBucket = inv.aging_bucket;

    // Recalculate Bucket
    if (diffDays <= 0) {
      newStatus = 'pending';
      newBucket = 'current';
    } else {
      newStatus = 'overdue';
      if (diffDays <= 30) newBucket = '1-30';
      else if (diffDays <= 60) newBucket = '31-60';
      else if (diffDays <= 90) newBucket = '61-90';
      else if (diffDays <= 180) newBucket = '91-180';
      else newBucket = '180+';
    }

    // Trigger Escalation if moving to 90+ bucket
    if (diffDays >= 90 && inv.status !== 'escalated') {
      const { error: escError } = await supabase
        .from('escalations')
        .insert([{
          invoice_id: inv.id,
          company_id: companyId,
          buyer_id: inv.buyer_id,
          reason: 'Automated: Aging exceeded 90-day critical threshold',
          severity: 'high',
          status: 'pending'
        }]);
      
      if (!escError) {
        newStatus = 'escalated';
        escalationsTriggered++;
      }
    }

    // Update Invoice status if changed
    if (newStatus !== inv.status || newBucket !== inv.aging_bucket) {
      await supabase
        .from('invoices')
        .update({ status: newStatus, aging_bucket: newBucket })
        .eq('id', inv.id);
    }
    
    invoicesProcessed++;
  }

  // 3. Check for Credit Freezing (Buyers with 90+ day invoices)
  const { data: overdueBuyers } = await supabase
    .from('invoices')
    .select('buyer_id')
    .eq('company_id', companyId)
    .eq('status', 'escalated');
  
  const uniqueBuyerIds = [...new Set(overdueBuyers?.map(b => b.buyer_id) || [])];
  
  for (const bId of uniqueBuyerIds) {
    const { data: buyer } = await supabase.from('buyers').select('is_credit_frozen').eq('id', bId).single();
    if (buyer && !buyer.is_credit_frozen) {
      await supabase.from('buyers').update({ is_credit_frozen: true }).eq('id', bId);
      creditsFrozen++;
    }
  }

  // 4. Log Sync History
  await supabase.from('sync_logs').insert([{
    company_id: companyId,
    invoices_synced: invoicesProcessed,
    escalations_created: escalationsTriggered,
    meta: { creditsFrozen }
  }]);

  return {
    invoicesProcessed,
    escalationsTriggered,
    creditsFrozen,
    timestamp: today.toISOString()
  };
};
