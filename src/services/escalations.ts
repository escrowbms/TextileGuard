import { supabase } from '../lib/supabase';

export interface Escalation {
  id: string;
  customer_id: string;
  customer_name: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'resolved' | 'ignored';
  created_at: string;
}

export const getEscalations = async (companyId: string): Promise<Escalation[]> => {
  const { data, error } = await supabase
    .from('escalations')
    .select(`
      *,
      customers (
        name
      )
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching escalations:', error);
    return [];
  }

  return (data || []).map(esc => ({
    ...esc,
    customer_name: esc.customers?.name || 'Unknown'
  }));
};
