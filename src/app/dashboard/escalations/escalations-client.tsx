'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, ArrowUpRight, Phone, Bell, Send, Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { Reminder, markReminderSent } from "@/services/reminders";
import { toast } from "sonner";

interface EscalationMember {
  id: string;
  name: string;
  city: string | null;
  exposure: string;
  riskLevel: string;
  riskScore: number;
  isCreditFrozen: boolean;
}

const levelConfig: Record<string, { label: string; pill: string; dot: string; ring: string }> = {
  critical: { label: "Critical", pill: "bg-ruby-500/10 text-ruby-500 border-ruby-500/20", dot: "bg-ruby-500", ring: "border-l-ruby-500" },
  high:     { label: "High", pill: "bg-amber-500/10 text-amber-500 border-amber-500/20", dot: "bg-amber-500", ring: "border-l-amber-500" },
};

export function EscalationsClient({ 
  initialEscalations, 
  initialReminders,
  companyId 
}: { 
  initialEscalations: EscalationMember[], 
  initialReminders: Reminder[],
  companyId: string
}) {
  const [filter, setFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<'escalations' | 'reminders'>('escalations');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleSendReminder = async (reminder: Reminder, channel: 'email' | 'whatsapp' | 'sms') => {
    if (channel === 'whatsapp') {
      window.open(reminder.whatsapp_url, '_blank');
      await markReminderSent(companyId, reminder.invoice_id, reminder.trigger_day);
      toast.success("Opening WhatsApp chat...");
      return;
    }

    setSendingId(reminder.invoice_id);
    const { error } = await markReminderSent(companyId, reminder.invoice_id, reminder.trigger_day);
    if (!error) {
      toast.success("Reminder marked as sent.");
    } else {
      toast.error("Failed to update reminder status.");
    }
    setSendingId(null);
  };

  const filtered = initialEscalations.filter(e => 
    filter === "All" ? true : e.riskLevel === filter.toLowerCase()
  );

  const totalAtRisk = initialEscalations.reduce((s, e) => s + parseFloat(e.exposure), 0);
  const criticalCount = initialEscalations.filter(e => e.riskLevel === 'critical').length;
  const highCount = initialEscalations.filter(e => e.riskLevel === 'high').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Critical Priority", value: criticalCount.toString(), icon: "🔴", color: "text-ruby-500" },
          { label: "High Priority", value: highCount.toString(), icon: "🟠", color: "text-amber-500" },
          { label: "Credit Frozen", value: initialEscalations.filter(e => e.isCreditFrozen).length.toString(), icon: "🔒", color: "text-ruby-500" },
          { label: "Total Exposure", value: `₹${(totalAtRisk / 100000).toFixed(2)}L`, icon: "⚠️", color: "text-ruby-600" },
        ].map(card => (
          <div key={card.label} className="glass p-4 rounded-2xl border border-border">
            <span className="text-2xl mb-2 block">{card.icon}</span>
            <p className={`text-xl font-extrabold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Segmented Control Tab Switcher */}
      <div className="p-1 glass rounded-[1.5rem] flex gap-1 border border-border w-fit">
        {(['escalations', 'reminders'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-6 py-2.5 rounded-[1.25rem] text-xs font-black transition-all duration-300 uppercase tracking-widest ${
              activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-[1.25rem] shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab === 'escalations' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
              {tab === 'escalations' ? `Risk Escalations (${initialEscalations.length})` : `Reminders (${initialReminders.length})`}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'escalations' ? (
        <>
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {["All", "Critical", "High"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${filter === f ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "border-border text-muted-foreground glass hover:text-foreground"}`}>
                {f === "All" ? "All Active" : `${f === "Critical" ? "🔴" : "🟠"} ${f}`}
              </button>
            ))}
          </div>

      {/* Escalation Cards */}
      <div className="space-y-3">
        {filtered.map((esc, i) => {
          const config = levelConfig[esc.riskLevel.toLowerCase()] ?? levelConfig.high;
          return (
            <motion.div key={esc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass rounded-2xl border border-border border-l-4 ${config.ring} p-5 hover:shadow-lg transition-all cursor-pointer group`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${config.dot} ${esc.riskLevel === "critical" ? "animate-pulse" : ""}`} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.pill}`}>{config.label} Priority</span>
                      {esc.isCreditFrozen && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-ruby-500/10 text-ruby-500`}>CREDIT FROZEN</span>}
                    </div>
                    <p className="font-bold mt-1 group-hover:text-primary transition-colors">{esc.name} <span className="text-muted-foreground font-normal text-xs">— {esc.city || 'Location N/A'}</span></p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Risk Score: <span className="font-bold text-foreground">{esc.riskScore}/100</span> · Automated Action Triggers Active</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:text-right flex-shrink-0">
                  <div>
                    <p className="font-extrabold text-ruby-500">₹{(parseFloat(esc.exposure)/100000).toFixed(2)}L</p>
                    <p className="text-[10px] text-muted-foreground">Total Exposure</p>
                  </div>
                  <div>
                    <p className="font-bold text-xs">High</p>
                    <p className="text-[10px] text-muted-foreground">Action Level</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:bg-ruby-500/10 hover:text-ruby-500 transition-all">
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

          {filtered.length === 0 && (
            <div className="glass rounded-2xl border border-border py-16 text-center text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500 opacity-50" />
              <p className="font-semibold text-sm">Great job! All clear in this category.</p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {initialReminders.map((rem, i) => (
            <motion.div key={rem.invoice_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl border border-border p-5 hover:bg-secondary/20 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    rem.days_overdue >= 60 ? 'bg-ruby-500/10 text-ruby-500' :
                    rem.days_overdue >= 30 ? 'bg-amber-500/10 text-amber-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{rem.customer_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        INV #{rem.invoice_id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-ruby-500 font-bold">{rem.days_overdue} days overdue</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:text-right">
                  <div className="hidden sm:block">
                    <p className="font-bold text-sm">₹{rem.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground italic">Action: Send Nudge</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSendReminder(rem, 'whatsapp')}
                      disabled={sendingId === rem.invoice_id}
                      className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-emerald-500/10 hover:text-emerald-500 transition-all disabled:opacity-50 relative group"
                      title="Send WhatsApp Direct (Free)"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                      {/* Interaction Pulse for WhatsApp */}
                      <span className="absolute inset-0 rounded-xl bg-emerald-500/20 animate-ping opacity-0 group-hover:opacity-100" />
                    </button>
                    <button 
                      onClick={() => handleSendReminder(rem, 'email')}
                      disabled={sendingId === rem.invoice_id}
                      className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-50 group"
                      title="Send Email"
                    >
                      <Mail className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {initialReminders.length === 0 && (
            <div className="glass rounded-2xl border border-border py-16 text-center text-muted-foreground">
              <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-emerald-500 opacity-50" />
              <p className="font-semibold text-sm">No pending reminders. Flow is clean.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
