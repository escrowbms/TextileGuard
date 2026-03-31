import { supabase } from "@/lib/supabase"

export interface Clause {
  id: string
  title: string
  content: string
  category: 'interest' | 'jurisdiction' | 'dispute' | 'payment-terms' | 'quality'
  is_default: boolean
  company_id: string
  created_at: string
}

export const getClauses = async (companyId: string): Promise<Clause[]> => {
  const { data, error } = await supabase
    .from('clause_templates')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createClause = async (clause: Omit<Clause, 'id' | 'created_at'>): Promise<Clause> => {
  const { data, error } = await supabase
    .from('clause_templates')
    .insert([clause])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateClause = async (id: string, updates: Partial<Clause>): Promise<Clause> => {
  const { data, error } = await supabase
    .from('clause_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteClause = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('clause_templates')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
