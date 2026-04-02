import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Send, CheckCircle2, AlertCircle, 
  ExternalLink, Calendar, User, IndianRupee, Clock, TrendingUp
} from "lucide-react";
import { getPendingReminders, markReminderSent, Reminder } from "@/services/reminders";
import { getInterestRecoveryPotential } from "@/services/analytics";
import { getUserByFirebaseUid } from "@/services/user";
import { useAuth } from "@/lib/auth-context";
import { RecoveryView } from "./recovery-view";

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [recoveryItems, setRecoveryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'nudges' | 'recovery'>('nudges');

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const appUser = await getUserByFirebaseUid(user.uid);
        if (appUser?.companyId) {
          setCompanyId(appUser.companyId);
          const [nudges, recovery] = await Promise.all([
            getPendingReminders(appUser.companyId),
            getInterestRecoveryPotential(appUser.companyId)
          ]);
          setReminders(nudges);
          setRecoveryItems(recovery);
        }
      } catch (err) {
        console.error("Failed to load reminders data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleSend = async (reminder: Reminder) => {
    window.open(reminder.whatsapp_url, '_blank');
    if (companyId) {
      await markReminderSent(companyId, reminder.invoice_id, reminder.trigger_day);
      setReminders(prev => prev.filter(r => r.id !== reminder.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Reminders Center
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Smart reminders and interest recovery tracking.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-secondary rounded-2xl border border-border">
          <button 
            onClick={() => setActiveTab('nudges')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'nudges' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending Nudges
          </button>
          <button 
            onClick={() => setActiveTab('recovery')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'recovery' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Interest Recovery
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'nudges' ? (
          <motion.div 
            key="nudges-tab"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            {reminders.length === 0 ? (
              <div className="glass p-12 rounded-[3rem] border border-border flex flex-col items-center text-center bg-gradient-to-br from-emerald-500/5 to-transparent">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground">All Clear!</h3>
                <p className="text-muted-foreground max-w-xs mt-2 text-sm">
                  Everything is up to date. No pending reminders required today.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reminders.map((reminder, i) => (
                  <motion.div
                    key={reminder.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="glass p-6 rounded-[2rem] border border-border group hover:border-primary/40 transition-all flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-ruby-500/10 text-ruby-500 rounded-full border border-ruby-500/20">
                      {reminder.days_overdue} Days Late
                    </div>

                    <div className="space-y-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer</p>
                          <h4 className="font-bold text-base leading-tight">{reminder.customer_name}</h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Due Amount</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <IndianRupee className="w-3.5 h-3.5 text-foreground" />
                            <span className="font-black text-lg">{(reminder.amount / 100000).toFixed(2)}L</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Trigger</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-bold text-sm">{reminder.trigger_day}d Rule</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-secondary/80 p-4 rounded-2xl border border-border/50 relative">
                        <p className="text-[11px] leading-relaxed italic text-muted-foreground break-words">
                          &quot;{reminder.message}&quot;
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button 
                        onClick={() => handleSend(reminder)}
                        className="flex-1 bg-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <Send className="w-4 h-4" />
                        SEND VIA WHATSAPP
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="recovery-tab"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <RecoveryView items={recoveryItems} companyId={companyId || ''} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Card */}
      <div className="glass p-6 rounded-[2rem] border border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-sm mb-1">System Logic</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              **Nudges** are manual WhatsApp follow-ups triggered by your credit rules. 
              **Recovery** suggests the penal interest you can legally charge based on your set interest rate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
