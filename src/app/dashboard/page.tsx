'use client';

import { 
  TrendingUp, AlertCircle, Clock, ArrowUpRight, ArrowDownRight, Users, IndianRupee, Building2, ArrowRight
} from "lucide-react";
import { 
  getDashboardStats, 
  getAgingData, 
  getCriticalBuyers 
} from "@/services/dashboard";
import { getFinancialAnalytics, getAgingConcentration } from "@/services/analytics";
import { getPendingReminders } from "@/services/reminders";
import { getUserByFirebaseUid, createCompany } from "@/services/user";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useCallback } from "react";
import { DashboardClient } from "@/app/dashboard/dashboard-client";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [gst, setGst] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);
  const [data, setData] = useState<{
    stats: any;
    aging: any[];
    critical: any[];
    analytics: any;
    remindersCount: number;
    concentration: any[];
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      try {
        const appUser = await getUserByFirebaseUid(user.uid);
        if (!appUser?.companyId) {
          setNeedsOnboarding(true);
          setLoading(false);
          return;
        }

        const [stats, aging, critical, analytics, reminders, concentration] = await Promise.all([
          getDashboardStats(appUser.companyId),
          getAgingData(appUser.companyId),
          getCriticalBuyers(appUser.companyId),
          getFinancialAnalytics(appUser.companyId),
          getPendingReminders(appUser.companyId),
          getAgingConcentration(appUser.companyId)
        ]);
 
        setData({ 
          stats, 
          aging, 
          critical, 
          analytics, 
          remindersCount: reminders.length,
          concentration
        });
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const handleTriggerSync = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('reminder-worker');
      if (error) throw error;
      
      // Refresh local data after sync
      const appUser = await getUserByFirebaseUid(user!.uid);
      if (appUser?.companyId) {
        const [stats, aging, critical, analytics, reminders, concentration] = await Promise.all([
          getDashboardStats(appUser.companyId),
          getAgingData(appUser.companyId),
          getCriticalBuyers(appUser.companyId),
          getFinancialAnalytics(appUser.companyId),
          getPendingReminders(appUser.companyId),
          getAgingConcentration(appUser.companyId)
        ]);
        setData({ 
          stats, 
          aging, 
          critical, 
          analytics, 
          remindersCount: reminders.length,
          concentration 
        });
      }
    } catch (err) {
      console.error("Automation sync error:", err);
      alert("Failed to trigger cloud automation. Please try again.");
    }
  }, [user]);

  const handleCreateCompany = async () => {
    if (!user || !companyName.trim()) return;
    setSavingCompany(true);
    const result = await createCompany(user.uid, user.email ?? '', companyName.trim(), gst.trim() || undefined);
    if ('error' in result) {
      toast.error(result.error);
      setSavingCompany(false);
      return;
    }
    toast.success('Company created! Loading your dashboard...');
    setNeedsOnboarding(false);
    setLoading(true);
    // Re-trigger data fetch
    const appUser = await getUserByFirebaseUid(user.uid);
    if (appUser?.companyId) {
      window.location.reload(); // cleanest way to re-init with new company
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass p-10 rounded-[2rem] border border-border max-w-md w-full space-y-8">
          <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight mb-2">One Last Step</h2>
            <p className="text-sm text-muted-foreground">Set up your company to activate the credit engine.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Company Name *</label>
              <input
                type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Textiles Ltd."
                className="w-full px-4 py-3 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">GSTIN <span className="opacity-40">(optional)</span></label>
              <input
                type="text" value={gst} onChange={e => setGst(e.target.value)}
                placeholder="24AABCA1234B1Z5"
                className="w-full px-4 py-3 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>
          <button
            onClick={handleCreateCompany} disabled={savingCompany || !companyName.trim()}
            className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {savingCompany
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><span>Launch Dashboard</span><ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.stats) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass rounded-[2rem] border border-border">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-xl font-bold">No Data Available</h3>
        <p className="text-muted-foreground text-sm">Create your first customer and invoice to see analytics.</p>
      </div>
    );
  }

  const processedStats = [
    { 
      title: "Total Receivables", 
      value: `₹${(data.stats.receivables / 100000).toFixed(2)}L`, 
      change: "+0%", trend: "up", icon: IndianRupee, color: "text-indigo-400", bg: "bg-indigo-500/10" 
    },
    { 
      title: "Overdue (Total)", 
      value: `₹${(data.stats.overdue / 100000).toFixed(2)}L`, 
      change: "0%", trend: "down", icon: AlertCircle, color: "text-ruby-500", bg: "bg-ruby-500/10" 
    },
    { 
      title: "Collected MTD", 
      value: `₹${(data.stats.collected / 100000).toFixed(2)}L`, 
      change: "0%", trend: "good", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" 
    },
    { 
      title: "Active Customers", 
      value: data.stats.totalCustomers.toString(), 
      change: `Incl. ${data.stats.frozenCustomers} frozen`, trend: "up", icon: Users, color: "text-amber-500", bg: "bg-amber-500/10" 
    },
    { 
      title: "Blocked Capital", 
      value: `₹${(data.analytics.blockedCapital / 100000).toFixed(2)}L`, 
      change: "High Risk", trend: "down", icon: AlertCircle, color: "text-ruby-500", bg: "bg-ruby-500/10" 
    },
    { 
      title: "Interest Loss (Total)", 
      value: `₹${data.analytics.interestLoss.toLocaleString()}`, 
      change: `@${data.analytics.interestRate}%`, trend: "down", icon: TrendingUp, color: "text-ruby-600", bg: "bg-ruby-600/10" 
    },
  ];

  const bucketColors: Record<string, string> = {
    "0-30": "bg-emerald-500",
    "31-60": "bg-indigo-500",
    "61-90": "bg-amber-500",
    "91-180": "bg-ruby-500",
    "180+": "bg-ruby-600",
  };

  const agingChartData = data.aging.map(d => ({
    label: d.name + " Days",
    value: d.value / 100000, // Show in Lakhs
    color: bucketColors[d.name] || "bg-primary"
  }));

  return (
    <DashboardClient 
      stats={processedStats} 
      agingData={agingChartData} 
      criticalBuyers={data.critical as any} 
      remindersCount={data.remindersCount}
      concentrationData={data.concentration}
      onTriggerSync={handleTriggerSync}
    />
  );
}
