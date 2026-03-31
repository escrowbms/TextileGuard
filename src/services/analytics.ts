import { supabase } from '../lib/supabase';

export interface FinancialAnalytics {
  totalOverdue: number;
  blockedCapital: number; // Sum of all invoices in 'Red' buckets (61+ days)
  interestLoss: number;   // Calculated based on aging and interest rate
  interestRate: number;   // Current annual rate used for calculation
  avgStrength: number;    // Average legal strength (0-100)
  collectionRate: number; // Percentage of invoices paid on time
  dso: number;            // Days Sales Outstanding
}

const DEFAULT_INTEREST_RATE = Number(import.meta.env.VITE_DEFAULT_INTEREST_RATE) || 18;

/**
 * Calculates financial impact metrics for a company.
 * Runs entirely on client-side logic using Supabase data.
 */
export const getFinancialAnalytics = async (companyId: string): Promise<FinancialAnalytics> => {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('balance_due, status, due_date, aging_bucket, po_number, clause_ids, eway_bill_number, jurisdiction, total_amount, created_at')
    .eq('company_id', companyId);

  // Fetch company settings for custom rates
  const { data: company } = await supabase
    .from('companies')
    .select('settings')
    .eq('id', companyId)
    .single();

  const settings = company?.settings || {};
  const interestRate = settings.interest_rate || DEFAULT_INTEREST_RATE;
  const gracePeriod = settings.grace_period || 0;

  let totalOverdue = 0;
  let blockedCapital = 0;
  let totalInterestLoss = 0;
  let totalInvoicesWithScore = 0;
  let cumulativeStrength = 0;
  let paidLast30 = 0;
  let dueLast30 = 0;
  let totalAgingDays = 0;
  let totalInvoicesForDSO = 0;

  const today = new Date();

  invoices?.forEach(inv => {
    const amount = Number(inv.balance_due);
    const totalAmount = Number(inv.total_amount);
    const createdAt = new Date(inv.created_at);
    const dueDate = new Date(inv.due_date);

    // 1. Total Overdue
    if (inv.status === 'overdue') {
      totalOverdue += amount;
    }

    // 2. Blocked Capital (Defined as invoices in 61-90, 91-180, or 180+ buckets)
    const criticalBuckets = ['61-90', '91-180', '180+'];
    if (inv.aging_bucket && criticalBuckets.includes(inv.aging_bucket) && inv.status !== 'paid') {
      blockedCapital += amount;
    }

    // 3. Interest Loss Calculation
    if (inv.status !== 'paid' && dueDate < today) {
      const diffTime = Math.abs(today.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > gracePeriod) {
        const effectiveDays = diffDays - gracePeriod;
        const annualLoss = amount * (interestRate / 100);
        const dailyLoss = annualLoss / 365;
        totalInterestLoss += dailyLoss * effectiveDays;
      }
    }

    // 4. Collection Rate & DSO Stats
    const isWithin30Days = (today.getTime() - createdAt.getTime()) <= (30 * 24 * 60 * 60 * 1000);
    if (isWithin30Days) {
      dueLast30 += totalAmount;
      if (inv.status === 'paid') {
        paidLast30 += totalAmount;
      }
    }

    if (inv.status !== 'paid') {
      const diffTime = Math.abs(today.getTime() - createdAt.getTime());
      totalAgingDays += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalInvoicesForDSO++;
    }

    // 5. Strength/Enforcement Calculation
    if (inv.status !== 'paid') {
      let strength = 0;
      if (inv.po_number) strength += 25;
      if (inv.eway_bill_number) strength += 25;
      if (inv.clause_ids && inv.clause_ids.length > 0) strength += 25;
      if (inv.jurisdiction && inv.jurisdiction !== 'Local Jurisdiction Only') strength += 25;
      
      cumulativeStrength += strength;
      totalInvoicesWithScore++;
    }
  });

  return {
    totalOverdue,
    blockedCapital,
    interestLoss: Math.round(totalInterestLoss),
    interestRate,
    avgStrength: totalInvoicesWithScore > 0 ? Math.round(cumulativeStrength / totalInvoicesWithScore) : 0,
    collectionRate: dueLast30 > 0 ? Math.round((paidLast30 / dueLast30) * 100) : 100,
    dso: totalInvoicesForDSO > 0 ? Math.round(totalAgingDays / totalInvoicesForDSO) : 0
  };
};

/**
 * Detailed breakdown for generating Interest Debit Note suggestions.
 */
export const getInterestRecoveryPotential = async (companyId: string) => {
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id, 
      invoice_number, 
      balance_due, 
      due_date,
      customer_id,
      customers (name)
    `)
    .eq('company_id', companyId)
    .gt('balance_due', 0);

  const { data: company } = await supabase
    .from('companies')
    .select('settings')
    .eq('id', companyId)
    .single();

  const settings = company?.settings || {};
  const interestRate = settings.interest_rate || DEFAULT_INTEREST_RATE;
  
  const today = new Date();
  
  return invoices?.map(inv => {
    const dueDate = new Date(inv.due_date);
    const amount = Number(inv.balance_due);
    
    if (dueDate < today) {
      const diffTime = Math.abs(today.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const interest = (amount * (interestRate / 100) / 365) * diffDays;
      
      // Handle the case where customers might be returned as an array or object
      const customer = Array.isArray(inv.customers) ? inv.customers[0] : inv.customers;
      
      return {
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        customerName: customer?.name || 'Unknown Customer',
        amount,
        daysOverdue: diffDays,
        suggestedInterest: Math.round(interest),
        rateUsed: interestRate
      };
    }
    return null;
  }).filter(item => item !== null) || [];
};

/**
 * Returns the current concentration of capital across aging buckets.
 */
export const getAgingConcentration = async (companyId: string) => {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('balance_due, aging_bucket')
    .eq('company_id', companyId)
    .gt('balance_due', 0);

  const buckets = {
    '0-30': 0,
    '31-60': 0,
    '61-90': 0,
    '91-180': 0,
    '180+': 0
  };

  invoices?.forEach(inv => {
    const bucket = inv.aging_bucket as keyof typeof buckets;
    if (buckets.hasOwnProperty(bucket)) {
      buckets[bucket] += Number(inv.balance_due);
    }
  });

  return Object.entries(buckets).map(([name, value]) => ({
    name,
    amount: value,
    percentage: 0 // Will be calculated in UI or here
  }));
};
