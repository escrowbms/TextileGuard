import { supabase } from '../lib/supabase';
import { checkCreditStatus } from './customers';

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  balance_due: number;
  status: string;
  due_date: string;
  created_at: string;
  aging_bucket: string;
  po_number?: string;
  jurisdiction?: string;
  clause_ids?: string[];
  delivery_proof_url?: string;
  eway_bill_number?: string;
  transport_details?: string;
}

export const getInvoices = async (
  companyId: string,
  search?: string,
  status?: string,
  bucket?: string,
  customerId?: string
): Promise<Invoice[]> => {
  let query = supabase
    .from('invoices')
    .select(`
      *,
      customers (
        name,
        city
      )
    `)
    .eq('company_id', companyId);

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  if (status && status.toLowerCase() !== 'all') {
    query = query.eq('status', status.toLowerCase());
  }

  if (bucket && bucket.toLowerCase() !== 'all buckets') {
    // Bucket in URL is like "0-30", "31-60", etc.
    query = query.eq('aging_bucket', bucket);
  }

  // Handle Search using 'or' for multiple fields
  // Note: Supabase 'or' with joined tables requires the full path
  if (search && search.trim() !== "") {
    const s = `%${search.trim()}%`;
    query = query.or(`invoice_number.ilike.${s},customer_name_manual.ilike.${s}`);
    // If we want to search via joined customer name, it's slightly more complex (requires filter on joined table or computed column)
    // We'll stick to invoice_number and a potential customer_name_manual if we had one, 
    // but better yet, we can use the text search feature or just filter client-side if the dataset is small.
    // For "100% working", let's use client-side search if we can't do a clean joins filter in one call without complex syntax.
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }

  let results = (data || []).map(inv => ({
    ...inv,
    customer_name: inv.customers?.name || 'Unknown'
  }));

  // Robust Client-side Search Fallback for complex joined fields
  if (search && search.trim() !== "") {
    const s = search.toLowerCase().trim();
    results = results.filter(r => 
      r.invoice_number.toLowerCase().includes(s) || 
      r.customer_name.toLowerCase().includes(s)
    );
  }

  return results;
};

export const createInvoice = async (data: {
  customerId: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: Date;
  companyId: string;
  poNumber?: string;
  jurisdiction?: string;
  clauseIds?: string[];
}) => {
  const status = await checkCreditStatus(data.customerId);
  
  if (status.isFrozen) {
    return { error: `DISPATCH BLOCKED: ${status.reason}` };
  }

  const { error } = await supabase
    .from('invoices')
    .insert({
      customer_id: data.customerId,
      invoice_number: data.invoiceNumber,
      total_amount: data.totalAmount,
      balance_due: data.totalAmount,
      due_date: data.dueDate.toISOString(),
      company_id: data.companyId,
      status: 'pending',
      po_number: data.poNumber,
      jurisdiction: data.jurisdiction,
      clause_ids: data.clauseIds,
    });

  return { error: error?.message };
};

export const settleInvoice = async (invoiceId: string) => {
  const { error } = await supabase
    .from('invoices')
    .update({ 
      status: 'paid',
      balance_due: 0
    })
    .eq('id', invoiceId);
  
  return { error: error?.message };
};

export const createDebitNote = async (data: {
  customerId: string;
  amount: number;
  reason: string;
  companyId: string;
}) => {
  const { error } = await supabase
    .from('invoices')
    .insert({
      customer_id: data.customerId,
      invoice_number: `DN-${Date.now().toString().slice(-6)}`,
      total_amount: data.amount,
      balance_due: data.amount,
      due_date: new Date().toISOString(),
      company_id: data.companyId,
      status: 'pending',
      po_number: 'INT-RECOVERY',
      jurisdiction: 'Interest Penal Charge',
    });

  return { error: error?.message };
};
