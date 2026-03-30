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
        name
      )
    `)
    .eq('company_id', companyId);

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (bucket && bucket !== 'all') {
    query = query.eq('aging_bucket', bucket);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }

  return (data || []).map(inv => ({
    ...inv,
    customer_name: inv.customers?.name || 'Unknown'
  }));
};

export const createInvoice = async (data: {
  customerId: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: Date;
  companyId: string;
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
      amount: data.totalAmount,
      balance_due: data.totalAmount,
      due_date: data.dueDate.toISOString(),
      company_id: data.companyId,
      status: 'pending',
    });

  return { error: error?.message };
};
