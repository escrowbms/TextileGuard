import { supabase } from '../lib/supabase';

export interface Reminder {
  id: string;
  invoice_id: string;
  customer_name: string;
  amount: number;
  due_date: string;
  days_overdue: number;
  trigger_day: number;
  message: string;
  whatsapp_url: string;
  status: 'pending' | 'sent';
}

/**
 * Normalizes phone numbers for WhatsApp utility.
 */
const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
};

/**
 * Generates a professional reminder message.
 */
const generateReminderMessage = (
  customerName: string, 
  amount: number, 
  invoiceNumber: string, 
  dueDate: string,
  isOverdue: boolean
) => {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);

  if (isOverdue) {
    return `Pranam ${customerName} ji, TextileGuard reminder: Aapka invoice #${invoiceNumber} amount ${formattedAmount} overdue ho gaya hai (Due: ${new Date(dueDate).toLocaleDateString()}). Kripya payment update karein ya humein contact karein. Thank you!`;
  }
  
  return `Pranam ${customerName} ji, TextileGuard update: Aapka invoice #${invoiceNumber} amount ${formattedAmount} ki due date ${new Date(dueDate).toLocaleDateString()} hai. Kripya time pe payment settle karne ka dhyan rakhein. Dhanyawad!`;
};

/**
 * Scans for invoices that need reminders based on company settings and triggers.
 */
export const getPendingReminders = async (companyId: string): Promise<Reminder[]> => {
  // 1. Fetch Company Settings
  const { data: company } = await supabase
    .from('companies')
    .select('settings')
    .eq('id', companyId)
    .single();

  const settings = company?.settings || {};
  const reminderSchedule = [7, 30, 60]; // Default days if not in settings

  // 2. Fetch Unpaid Invoices with Customer Data
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id, 
      invoice_number, 
      total_amount, 
      balance_due, 
      due_date, 
      status,
      customers (id, name, phone)
    `)
    .eq('company_id', companyId)
    .neq('status', 'paid');

  if (!invoices) return [];

  const today = new Date();
  const pendingReminders: Reminder[] = [];

  for (const inv of invoices) {
    const dueDate = new Date(inv.due_date);
    const diffTime = today.getTime() - dueDate.getTime();
    const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Check which reminder matches
    // For now, we'll find the highest trigger_day that has passed and hasn't been sent
    const activeTrigger = reminderSchedule.find(day => daysOverdue >= day);

    if (activeTrigger !== undefined) {
      // Check if this reminder (trigger_day) was already sent
      const { data: existing } = await supabase
        .from('reminders')
        .select('id')
        .eq('invoice_id', inv.id)
        .eq('trigger_day', activeTrigger)
        .eq('status', 'sent')
        .maybeSingle();

      if (!existing) {
        const customer = inv.customers as any;
        const msg = generateReminderMessage(
          customer.name, 
          inv.balance_due, 
          inv.invoice_number, 
          inv.due_date, 
          daysOverdue > 0
        );

        const phone = customer.phone ? formatPhone(customer.phone) : '910000000000';
        
        pendingReminders.push({
          id: `${inv.id}-${activeTrigger}`,
          invoice_id: inv.id,
          customer_name: customer.name,
          amount: inv.balance_due,
          due_date: inv.due_date,
          days_overdue: daysOverdue,
          trigger_day: activeTrigger,
          message: msg,
          whatsapp_url: `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
          status: 'pending'
        });
      }
    }
  }

  return pendingReminders;
};

/**
 * Marks a reminder as sent in the database.
 */
export const markReminderSent = async (companyId: string, invoiceId: string, triggerDay: number) => {
  return await supabase
    .from('reminders')
    .upsert({
      company_id: companyId,
      invoice_id: invoiceId,
      trigger_day: triggerDay,
      status: 'sent',
      sent_at: new Date().toISOString(),
      channel: 'whatsapp'
    }, { onConflict: 'company_id,invoice_id,trigger_day' });
};
