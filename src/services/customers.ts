import { supabase } from '../lib/supabase';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: string;
  risk_score: number;
  status: string;
  credit_limit: number;
  total_receivables: number;
  overdue_amount: number;
  last_payment_date: string | null;
  created_at: string;
}

export interface CreditStatus {
  isFrozen: boolean;
  reason: string | null;
  level: 'low' | 'medium' | 'high' | 'critical';
}

export const getCustomers = async (
  companyId: string,
  search?: string,
  risk?: string
): Promise<Customer[]> => {
  let query = supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId);

  if (risk && risk !== 'all') {
    // Basic risk filtering logic
    if (risk === 'high') query = query.gt('risk_score', 70);
    else if (risk === 'medium') query = query.gte('risk_score', 30).lte('risk_score', 70);
    else if (risk === 'low') query = query.lt('risk_score', 30);
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }

  return data || [];
};

export const createCustomer = async (data: {
  name: string;
  email?: string;
  city?: string;
  gstNumber?: string;
  creditLimit: number;
  companyId: string;
}) => {
  const { error } = await supabase
    .from('customers')
    .insert({
      name: data.name,
      email: data.email,
      city: data.city,
      gst_number: data.gstNumber,
      credit_limit: data.creditLimit,
      company_id: data.companyId,
      status: 'active',
      risk_score: 0,      // No history = no risk yet
      risk_level: 'low',  // Will be recalculated once invoices are added
    });

  return { error: error?.message };
};

export const getCustomerById = async (id: string) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
};

export const checkCreditStatus = async (customerId: string): Promise<CreditStatus> => {
  const { data: customer, error } = await supabase
    .from('customers')
    .select('risk_score, credit_limit, overdue_amount, status, company_id')
    .eq('id', customerId)
    .single();

  if (error || !customer) {
    return { isFrozen: false, reason: 'Customer not found', level: 'low' };
  }

  // Fetch company settings for enforcement
  const { data: company } = await supabase
    .from('companies')
    .select('settings')
    .eq('id', customer.company_id)
    .single();

  const settings = company?.settings || {
    enforce_credit_limit: false, 
    credit_grace_percent: 5
  };

  const graceMultiplier = 1 + (settings.credit_grace_percent / 100);
  const isOverLimit = customer.overdue_amount > (customer.credit_limit * graceMultiplier);
  const isHighRisk = customer.risk_score > 85;
  const isManuallyFrozen = customer.status === 'frozen';

  // Only freeze automatically if enforcement is enabled OR if manually frozen/high risk
  const isFrozen = (settings.enforce_credit_limit && isOverLimit) || isHighRisk || isManuallyFrozen;
  let reason = null;

  if (isManuallyFrozen) reason = "Account manually frozen due to non-payment";
  else if (settings.enforce_credit_limit && isOverLimit) {
    reason = `Credit limit exceeded (Overdue: ₹${customer.overdue_amount.toLocaleString('en-IN')})`;
  } else if (isHighRisk) reason = "Escalated to critical risk level";

  let level: CreditStatus['level'] = 'low';
  if (customer.risk_score >= 85) level = 'critical';
  else if (customer.risk_score >= 60) level = 'high';
  else if (customer.risk_score >= 30) level = 'medium';

  return { isFrozen, reason, level };
};

/**
 * Recalculates risk score based on real-time invoice and payment data.
 * Formula: (Overdue Weight * 0.6) + (Aging Factor * 0.4)
 */
export const calculateAndUpdateRiskScore = async (customerId: string): Promise<number> => {
  const { data: customer } = await supabase
    .from('customers')
    .select('credit_limit, status')
    .eq('id', customerId)
    .single();

  const { data: invoices } = await supabase
    .from('invoices')
    .select('balance_due, aging_bucket, status')
    .eq('customer_id', customerId)
    .neq('status', 'paid');

  if (!customer) return 50;

  let totalOverdue = 0;
  let agingWeight = 0;

  invoices?.forEach(inv => {
    const amount = Number(inv.balance_due);
    totalOverdue += amount;

    // Weight aging buckets (Higher age = Exponential risk)
    if (inv.aging_bucket === '180+') agingWeight += amount * 5;
    else if (inv.aging_bucket === '91-180') agingWeight += amount * 3;
    else if (inv.aging_bucket === '61-90') agingWeight += amount * 1.5;
    else agingWeight += amount * 0.5;
  });

  // 1. Overdue Ratio (How much of limit is used up by overdue)
  const overdueRatio = Math.min(totalOverdue / customer.credit_limit, 2); // Cap at 200%
  const overdueScore = overdueRatio * 50; // 0 to 100

  // 2. Aging Stress (How old is the average debt)
  const avgAgingScore = Math.min((agingWeight / (totalOverdue || 1)) * 10, 100);

  // Combine scores
  let finalScore = (overdueScore * 0.6) + (avgAgingScore * 0.4);

  // Manual Freeze or critical status override
  if (customer.status === 'frozen') finalScore = Math.max(finalScore, 95);

  const roundedScore = Math.round(Math.min(finalScore, 100));

  // Determine critical risk level label
  let riskLevel = 'low';
  if (roundedScore >= 85) riskLevel = 'critical';
  else if (roundedScore >= 60) riskLevel = 'high';
  else if (roundedScore >= 30) riskLevel = 'medium';

  // Update DB
  await supabase
    .from('customers')
    .update({ 
      risk_score: roundedScore,
      risk_level: riskLevel,
      overdue_amount: totalOverdue
    })
    .eq('id', customerId);

  return roundedScore;
};
