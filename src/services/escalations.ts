import { supabase } from '../lib/supabase';

export interface Escalation {
  id: string;
  customer_id: string;
  customer_name: string;
  level: string;
  reason: string | null;
  severity: string;
  status: string;
  notes: string | null;
  triggered_at: string;
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
    .order('triggered_at', { ascending: false });

  if (error) {
    console.error('Error fetching escalations:', error);
    return [];
  }

  return (data || []).map(esc => ({
    ...esc,
    customer_name: esc.customers?.name || 'Unknown',
    created_at: esc.createdat || esc.triggered_at,
  }));
};

export const resolveEscalation = async (escalationId: string): Promise<void> => {
  await supabase
    .from('escalations')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', escalationId);
};
