'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  ShieldAlert, 
  Percent, 
  BellRing, 
  Save, 
  Loader2, 
  MessageSquare,
  Clock,
  Globe,
  Lock,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getUserByFirebaseUid } from '@/services/user';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CompanySettings {
  interest_rate: number;
  grace_period: number;
  auto_whatsapp: boolean;
  block_overdue_threshold: number;
  reminder_frequency: 'daily' | 'weekly' | 'custom';
}

export default function SettingsClient() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [settings, setSettings] = useState<CompanySettings>({
    interest_rate: 18,
    grace_period: 7,
    auto_whatsapp: true,
    block_overdue_threshold: 100000,
    reminder_frequency: 'daily',
  });

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const profile = await getUserByFirebaseUid(user.uid);
        if (profile?.companyId) {
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profile.companyId)
            .single();
          
          if (data) {
            setCompany(data);
            if (data.settings) {
              setSettings({ ...settings, ...data.settings });
            }
          }
        }
      } catch (err) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ settings })
        .eq('id', company.id);
      
      if (error) throw error;
      toast.success("Settings synchronized successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading Configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">System Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage enforcement rules and company profile</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
          {saving ? "Deploying..." : "Save Configuration"}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Company Profile */}
        <div className="lg:col-span-2 space-y-8">
           <section className="glass rounded-[32px] p-8 border border-border">
             <div className="flex items-center gap-3 mb-8">
               <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                 <Building2 className="w-6 h-6" />
               </div>
               <h2 className="text-xl font-bold italic">Entity Profile</h2>
             </div>
             
             <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Legal Name</label>
                 <input 
                   className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 ring-primary/20 transition-all outline-none"
                   value={company?.name || ''}
                   readOnly
                 />
                 <p className="text-[10px] text-muted-foreground italic px-1">* Managed by Administrator</p>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">GST Identification</label>
                 <input 
                   className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 font-mono text-sm tracking-wider"
                   value={company?.gst || 'UNREGISTERED'}
                   readOnly
                 />
               </div>
             </div>
           </section>

           {/* Financial Enforcement Rules */}
           <section className="glass rounded-[32px] p-8 border border-border bg-gradient-to-br from-background to-secondary/30">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold italic">Enforcement Logic</h2>
             </div>

             <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <Percent className="w-4 h-4 text-muted-foreground" />
                       <span className="text-sm font-bold">Annual Interest Rate</span>
                     </div>
                     <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-md">{settings.interest_rate}%</span>
                   </div>
                   <input 
                     type="range" min="0" max="36" step="1"
                     className="w-full accent-primary"
                     value={settings.interest_rate}
                     onChange={(e) => setSettings({...settings, interest_rate: parseInt(e.target.value)})}
                   />
                   <p className="text-[10px] text-muted-foreground leading-relaxed">
                     Applied to all overdue invoices after grace period. Standard textile rate is usually 18-24%.
                   </p>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <Clock className="w-4 h-4 text-muted-foreground" />
                       <span className="text-sm font-bold">Grace Period (Days)</span>
                     </div>
                     <span className="text-xs font-black text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md">{settings.grace_period} Days</span>
                   </div>
                   <input 
                     type="range" min="0" max="60" step="1"
                     className="w-full accent-indigo-500"
                     value={settings.grace_period}
                     onChange={(e) => setSettings({...settings, grace_period: parseInt(e.target.value)})}
                   />
                   <p className="text-[10px] text-muted-foreground leading-relaxed">
                     Buffer days allowed after the official due date before interest calculation starts.
                   </p>
                </div>
             </div>
           </section>
        </div>

        {/* Sidebar Settings (Automation & Security) */}
        <div className="space-y-8">
           <div className="glass rounded-[32px] p-8 border border-border overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <MessageSquare className="w-24 h-24 rotate-12" />
              </div>
              <h3 className="text-lg font-black mb-6 uppercase tracking-tight flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-500" />
                Connectivity
              </h3>
              
              <div className="space-y-6 relative z-10">
                 <div className="flex items-center justify-between">
                    <div>
                       <div className="font-bold text-sm">Auto-WhatsApp Reminders</div>
                       <div className="text-[10px] text-muted-foreground">Queue messages automatically</div>
                    </div>
                    <button 
                      onClick={() => setSettings({...settings, auto_whatsapp: !settings.auto_whatsapp})}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${settings.auto_whatsapp ? 'bg-emerald-500' : 'bg-muted'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${settings.auto_whatsapp ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                 </div>
                 
                 <div className="space-y-3 pt-4 border-t border-border/50">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Global Credit Barrier</label>
                    <div className="flex items-center gap-2 bg-secondary/50 p-3 rounded-xl border border-border">
                       <span className="text-muted-foreground font-bold text-xs">₹</span>
                       <input 
                         type="number"
                         className="bg-transparent border-none outline-none font-bold text-sm w-full"
                         value={settings.block_overdue_threshold}
                         onChange={(e) => setSettings({...settings, block_overdue_threshold: parseInt(e.target.value)})}
                       />
                    </div>
                    <p className="text-[10px] text-ruby-500 font-bold">Hard-lock entities exceeding this overdue.</p>
                 </div>
              </div>
           </div>

           <div className="glass rounded-[32px] p-8 border border-border">
              <h3 className="text-lg font-black mb-6 uppercase tracking-tight flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Security Hub
              </h3>
              <div className="space-y-4">
                 <SecurityItem icon={Globe} label="Public API Access" status="Disabled" />
                 <SecurityItem icon={CheckCircle2} label="Auto-Backup (Every 12h)" status="Active" />
                 <SecurityItem icon={BellRing} label="High-Risk Alerts" status="Active" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function SecurityItem({ icon: Icon, label, status }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/20 border border-border/50">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-bold">{label}</span>
      </div>
      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
        {status}
      </span>
    </div>
  );
}
