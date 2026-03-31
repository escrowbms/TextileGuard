import { supabase } from '../lib/supabase';
import { calculateAndUpdateRiskScore } from './customers';

export interface ErpCustomer {
  name: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  city?: string;
  creditLimit?: number;
}

export interface ErpInvoice {
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  balanceDue: number;
  dueDate: string;
  status: 'pending' | 'overdue' | 'paid';
}

export interface SyncResult {
  customersAdded: number;
  customersUpdated: number;
  invoicesAdded: number;
  invoicesUpdated: number;
  errors: string[];
}

/**
 * Main service to handle bulk data ingestion from ERPs (Tally/Busy/JSON)
 */
export const syncErpData = async (
  companyId: string,
  customers: ErpCustomer[],
  invoices: ErpInvoice[]
): Promise<SyncResult> => {
  const result: SyncResult = {
    customersAdded: 0,
    customersUpdated: 0,
    invoicesAdded: 0,
    invoicesUpdated: 0,
    errors: [],
  };

  try {
    // 1. Get existing customers to map names to IDs
    const { data: existingCustomers } = await supabase
      .from('customers')
      .select('id, name')
      .eq('company_id', companyId);

    const customerMap = new Map(existingCustomers?.map(c => [c.name.toLowerCase(), c.id]));

    // 2. Process Customers
    for (const cust of customers) {
      const existingId = customerMap.get(cust.name.toLowerCase());
      
      const payload = {
        company_id: companyId,
        name: cust.name,
        email: cust.email || null,
        phone: cust.phone || null,
        gst_number: cust.gstNumber || null,
        city: cust.city || null,
        credit_limit: cust.creditLimit || 0,
        status: 'active',
      };

      if (existingId) {
        const { error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', existingId);
        
        if (!error) {
          result.customersUpdated++;
        } else {
          result.errors.push(`Failed to update customer ${cust.name}: ${error.message}`);
        }
      } else {
        const { data: newCust, error } = await supabase
          .from('customers')
          .insert(payload)
          .select('id')
          .single();

        if (!error && newCust) {
          result.customersAdded++;
          customerMap.set(cust.name.toLowerCase(), newCust.id);
        } else {
          result.errors.push(`Failed to add customer ${cust.name}: ${error?.message}`);
        }
      }
    }

    // 3. Process Invoices
    for (const inv of invoices) {
      const customerId = customerMap.get(inv.customerName.toLowerCase());
      
      if (!customerId) {
        result.errors.push(`Skipped invoice ${inv.invoiceNumber}: Customer ${inv.customerName} not found.`);
        continue;
      }

      // Calculate aging bucket
      const dueDate = new Date(inv.dueDate);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
      
      let bucket = 'current';
      if (diffDays > 180) bucket = '180+';
      else if (diffDays > 90) bucket = '91-180';
      else if (diffDays > 60) bucket = '61-90';
      else if (diffDays > 45) bucket = '46-60';
      else if (diffDays > 30) bucket = '31-45';
      else if (diffDays > 0) bucket = '1-30';

      const invoicePayload = {
        company_id: companyId,
        customer_id: customerId,
        invoice_number: inv.invoiceNumber,
        total_amount: inv.totalAmount,
        balance_due: inv.balanceDue,
        due_date: inv.dueDate,
        status: inv.status,
        aging_bucket: bucket,
      };

      // Check for existing invoice
      const { data: existingInv } = await supabase
        .from('invoices')
        .select('id')
        .eq('company_id', companyId)
        .eq('invoice_number', inv.invoiceNumber)
        .single();

      if (existingInv) {
        const { error } = await supabase
          .from('invoices')
          .update(invoicePayload)
          .eq('id', existingInv.id);

        if (!error) result.invoicesUpdated++;
        else result.errors.push(`Failed to update invoice ${inv.invoiceNumber}: ${error.message}`);
      } else {
        const { error } = await supabase
          .from('invoices')
          .insert(invoicePayload);

        if (!error) result.invoicesAdded++;
        else result.errors.push(`Failed to add invoice ${inv.invoiceNumber}: ${error.message}`);
      }
    }

    // 4. Update Risk Scores for all affected customers
    const uniqueAffectedCustomers = Array.from(new Set(invoices.map(i => i.customerName.toLowerCase())))
      .map(name => customerMap.get(name))
      .filter((id): id is string => !!id);

    for (const id of uniqueAffectedCustomers) {
      await calculateAndUpdateRiskScore(id);
    }

  } catch (err: any) {
    result.errors.push(`Critical sync error: ${err.message}`);
  }

  return result;
};

/**
 * Robust XML Parser for Tally standard exports
 */
export const parseTallyXml = (xmlContent: string): { customers: ErpCustomer[], invoices: ErpInvoice[] } => {
  const customers: ErpCustomer[] = [];
  const invoices: ErpInvoice[] = [];

  // Extract Ledgers (Potential Customers)
  // Tally uses <LEDGER NAME="..."> tags
  const ledgerMatches = xmlContent.matchAll(/<LEDGER NAME="([^"]+)"[^>]*>.*?<\/LEDGER>/gs);
  for (const match of ledgerMatches) {
    const name = match[1];
    // Simple deduplication logic
    if (!customers.find(c => c.name === name)) {
      customers.push({ name, creditLimit: 100000 }); // Default 1L limit for new
    }
  }

  // Extract Vouchers (Sales Invoices)
  // Standard Sales Voucher
  const voucherMatches = xmlContent.matchAll(/<VOUCHER VCHTYPE="Sales"[^>]*>.*?<VOUCHERNUMBER>([^<]+)<\/VOUCHERNUMBER>.*?<PARTYLEDGERNAME>([^<]+)<\/PARTYLEDGERNAME>.*?<DATE>([^<]+)<\/DATE>.*?<AMOUNT>([^<]+)<\/AMOUNT>.*?<\/VOUCHER>/gs);
  for (const match of voucherMatches) {
    const [, vchNo, party, dateStr, amount] = match;
    
    // Convert Tally Date 20240401 to ISO
    let dueDate = new Date().toISOString();
    if (dateStr && dateStr.length === 8) {
      dueDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    }

    invoices.push({
      invoiceNumber: vchNo,
      customerName: party,
      totalAmount: Math.abs(parseFloat(amount)),
      balanceDue: Math.abs(parseFloat(amount)),
      dueDate: dueDate,
      status: 'pending'
    });
  }

  return { customers, invoices };
};

/**
 * Generic CSV Parser for custom ERP exports
 */
export const parseErpCsv = (csvContent: string): { customers: ErpCustomer[], invoices: ErpInvoice[] } => {
  const lines = csvContent.split(/\r?\n/);
  const customers: ErpCustomer[] = [];
  const invoices: ErpInvoice[] = [];

  if (lines.length < 2) return { customers, invoices };

  // Expecting Header: Customer Name, Phone, GST, Invoice #, Invoice Date, Amount
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(c => c.trim());
    if (row.length < 3 || !row[0]) continue;

    const custName = row[0];
    const phone = row[1] || '';
    const gst = row[2] || '';
    const invNo = row[3] || `CSV-${Math.random().toString(36).substring(7)}`;
    const invDateStr = row[4] || new Date().toISOString().split('T')[0];
    const amount = parseFloat(row[5]) || 0;

    // Add unique customer
    if (!customers.find(c => c.name === custName)) {
      customers.push({
        name: custName,
        phone: phone,
        gstNumber: gst,
        creditLimit: 500000
      });
    }

    invoices.push({
      invoiceNumber: invNo,
      customerName: custName,
      totalAmount: amount,
      balance_due: amount, // Match internal field name expectation
      dueDate: invDateStr,
      status: 'pending'
    } as any);
  }

  return { customers, invoices };
};
