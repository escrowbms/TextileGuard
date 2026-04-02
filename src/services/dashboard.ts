import { supabase } from '../lib/supabase';

export interface DashboardStats {
  receivables: number;
  overdue: number;
  collected: number;
  totalCustomers: number;
  frozenCustomers: number;
}

export interface AgingBucket {
  name: string;
  value: number;
}

export interface CriticalBuyer {
  name: string;
  exposure: string;
  riskScore: number;
  riskLevel: string;
  isCreditFrozen: boolean;
}

export const getDashboardStats = async (companyId: string): Promise<DashboardStats> => {
  // Total Receivables & Overdue
  const { data: invoices } = await supabase
    .from('invoices')
    .select('balance_due, status')
    .eq('company_id', companyId);

  let receivables = 0;
  let overdue = 0;
  let collected = 0;
  invoices?.forEach(inv => {
    const amt = Number(inv.balance_due);
    receivables += amt;
    if (inv.status === 'overdue') overdue += amt;
    if (inv.status === 'paid') collected += amt;
  });

  // Total Customers & Frozen
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  const { count: frozenCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('is_credit_frozen', true);

  return {
    receivables,
    overdue,
    collected,
    totalCustomers: totalCustomers || 0,
    frozenCustomers: frozenCustomers || 0,
  };
};

export const getAgingData = async (companyId: string): Promise<AgingBucket[]> => {
  const { data } = await supabase
    .from('invoices')
    .select('balance_due, aging_bucket')
    .eq('company_id', companyId)
    .neq('status', 'paid');

  const buckets: Record<string, number> = {
    '0-30': 0,
    '31-60': 0,
    '61-90': 0,
    '91-180': 0,
    '180+': 0
  };

  data?.forEach(inv => {
    if (inv.aging_bucket && buckets[inv.aging_bucket] !== undefined) {
      buckets[inv.aging_bucket] += Number(inv.balance_due);
    }
  });

  return Object.entries(buckets).map(([name, value]) => ({ name, value }));
};

export const getCriticalBuyers = async (companyId: string): Promise<CriticalBuyer[]> => {
  const { data } = await supabase
    .from('customers')
    .select('name, exposure, risk_score, risk_level, is_credit_frozen')
    .eq('company_id', companyId)
    .order('risk_score', { ascending: false })
    .limit(5);

  return (data || []).map(d => ({
    name: d.name,
    exposure: d.exposure,
    riskScore: d.risk_score,
    riskLevel: d.risk_level,
    isCreditFrozen: d.is_credit_frozen
  }));
};
