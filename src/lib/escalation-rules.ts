export type EscalationLevel = 0 | 1 | 2 | 3;

export interface EscalationRule {
  level: EscalationLevel;
  triggerDays: number;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  getMessage: (customerName: string, amount: number, invoiceNumber: string) => string;
}

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);

export const ESCALATION_RULES: Record<EscalationLevel, EscalationRule> = {
  0: {
    level: 0,
    triggerDays: 7,
    label: "Soft Nudge",
    severity: 'low',
    getMessage: (c, a, i) => `Pranam ${c} ji, TextileGuard reminder: Aapka invoice #${i} for ${formatCurrency(a)} is slightly overdue. Kripya payment update check karein. Thank you!`
  },
  1: {
    level: 1,
    triggerDays: 15,
    label: "Firm Reminder",
    severity: 'medium',
    getMessage: (c, a, i) => `Pranam ${c} ji, TextileGuard notice: Invoice #${i} (${formatCurrency(a)}) 15 din se overdue hai. Kripya dhyan dein aur aaj hi settle karein tabhi business smooth rahega. Dhanyawad.`
  },
  2: {
    level: 2,
    triggerDays: 30,
    label: "Strict Warning",
    severity: 'high',
    getMessage: (c, a, i) => `Pranam ${c} ji, TextileGuard Warning: Aapka invoice #${i} 30 din se pending hai. Rules ke mutabik, ab ispe 18% interest apply ho sakta hai. Please clear this immediately. Dhanyawad.`
  },
  3: {
    level: 3,
    triggerDays: 60,
    label: "Final Notice",
    severity: 'critical',
    getMessage: (c, a, i) => `PRANAM ${c} JI, TEXTILEGUARD FINAL NOTICE: Invoice #${i} is critically overdue (60+ days). AAPKA CREDIT BLOCK HO SAKTA HAI. Kripya turant payment karein ya humse baat karein logic settle karne ke liye. Urgent.`
  }
};

export const getEscalationByDays = (days: number): EscalationRule => {
  if (days >= 60) return ESCALATION_RULES[3];
  if (days >= 30) return ESCALATION_RULES[2];
  if (days >= 15) return ESCALATION_RULES[1];
  return ESCALATION_RULES[0];
};
