'use client';

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, LucideIcon, RefreshCw, Zap, TrendingUp } from "lucide-react";
import { useState } from "react";
import { BlockedCapitalChart } from "@/components/dashboard/BlockedCapitalChart";

interface Stat {
  title: string;
  value: string;
  change: string;
  trend: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

interface AgingBar {
  label: string;
  value: number;
  color: string;
}

interface Buyer {
  name: string;
  city: string;
  exposure: string;
  riskScore: number;
  riskLevel: string;
  isCreditFrozen: boolean;
}

const riskColors: Record<string, string> = {
  critical: "bg-ruby-500/10 text-ruby-500 border-ruby-500/20",
  high: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  medium: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export function DashboardClient({ 
  stats, agingData, criticalBuyers, lastSync, remindersCount, concentrationData, onTriggerSync 
}: { 
  stats: Stat[], 
  agingData: AgingBar[], 
  criticalBuyers: Buyer[],
  lastSync?: string,
  remindersCount?: number,
  concentrationData?: any[],
  onTriggerSync?: () => Promise<void>
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const maxAgingValue = Math.max(...agingData.map(d => d.value), 1);

  const handleManualSync = async () => {
    if (!onTriggerSync) return;
    setIsSyncing(true);
    await onTriggerSync();
    setIsSyncing(false);
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Dynamic Status Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <div className="glass px-4 py-2 rounded-full border border-border flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ERP Sync: <span className="text-foreground">{lastSync || 'Just Now'}</span>
        </div>
        {remindersCount && remindersCount > 0 ? (
          <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Queued Reminders: <span className="font-black">{remindersCount}</span>
          </div>
        ) : null}
        
        <button 
          onClick={handleManualSync}
          disabled={isSyncing}
          className="ml-auto glass px-4 py-2 rounded-full border border-primary/20 hover:border-primary/50 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary transition-all disabled:opacity-50 group"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          {isSyncing ? 'Scanning...' : 'Sync Automation'}
        </button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 font-inter">
        {stats.map((stat, i) => {
          const isGood = stat.trend === 'good' || stat.trend === 'up';
          return (
            <motion.div 
              key={stat.title} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              transition={{ delay: i * 0.05 }}
              className="glass p-4 lg:p-5 rounded-[2rem] border border-border group hover:border-primary/40 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden"
            >
              {/* Intentional Glow */}
              <div className={`absolute -right-4 -top-4 w-16 h-16 blur-2xl opacity-20 rounded-full transition-opacity group-hover:opacity-40 ${
                isGood ? 'bg-emerald-500' : 'bg-ruby-500'
              }`} />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center shadow-inner`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className={`text-[10px] lg:text-xs font-bold flex items-center gap-0.5 px-2 py-1 rounded-full ${
                  isGood ? 'bg-emerald-500/10 text-emerald-500' : 'bg-ruby-500/10 text-ruby-500'
                }`}>
                  {isGood ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-[10px] lg:text-xs text-muted-foreground font-semibold mb-1 truncate uppercase tracking-widest">{stat.title}</p>
              <h4 className="text-lg lg:text-2xl font-black tracking-tighter text-foreground">{stat.value}</h4>
            </motion.div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Distribution */}
        <div className="glass p-6 lg:p-8 rounded-[2rem] border border-border">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-bold mb-1 italic">Aging Distribution</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-black opacity-60">Capital distribution by days</p>
            </div>
          </div>

          <div className="flex items-end gap-3 h-40 px-2 mb-4">
            {agingData.map((bar, i) => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-2 group">
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${(bar.value / maxAgingValue) * 100}%` }}
                  transition={{ duration: 0.9, delay: i * 0.1, ease: "easeOut" }}
                  className={`w-full ${bar.color} rounded-t-xl opacity-80 group-hover:opacity-100 transition-opacity relative shadow-lg`}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-secondary px-2 py-0.5 rounded-md whitespace-nowrap z-10">
                    ₹{bar.value.toFixed(1)}L
                  </span>
                </motion.div>
                <span className="text-[8px] font-black text-muted-foreground text-center uppercase tracking-tighter">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Concentration */}
        <div className="glass p-6 lg:p-8 rounded-[2rem] border border-border">
          <div className="flex items-center gap-2 mb-6">
             <TrendingUp className="w-4 h-4 text-ruby-500" />
             <div>
               <h3 className="text-lg font-bold mb-1 italic uppercase tracking-tighter">Liquid Capital Concentration</h3>
               <p className="text-[10px] text-muted-foreground font-black opacity-60 uppercase">Rolling risk analysis (Daily Scan)</p>
             </div>
          </div>
          <div className="h-40">
            {concentrationData && concentrationData.length > 0 ? (
              <BlockedCapitalChart data={concentrationData} />
            ) : (
              <div className="h-[120px] flex items-center justify-center text-muted-foreground italic text-xs">
                Analyzing risk patterns...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Health Section (Full Width Now) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { label: "Collection Rate", value: "92%", color: "bg-emerald-500", desc: "Performance: Stable" },
          { label: "Invoices Under Dispute", value: "3", color: "bg-amber-500", desc: "Awaiting ERP Audit" },
          { label: "Accrued Interest (18%)", value: "₹45.2k", color: "bg-ruby-500", desc: "Total Receivable Loss" },
          { label: "DSO (Sales Outstanding)", value: "48 Days", color: "bg-indigo-500", desc: "Benchmark: 30 Days" },
        ].map((item, i) => (
          <div key={i} className="p-4 glass rounded-2xl border border-border/50 group hover:border-primary/20 transition-all">
            <div className="flex justify-between mb-1.5 pt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
              <span className="text-xs font-black text-foreground">{item.value}</span>
            </div>
            <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden mb-1.5 mt-2">
              <motion.div initial={{ width: 0 }} animate={{ width: i === 0 ? "92%" : "60%" }} className={`h-full ${item.color} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
            </div>
            <p className="text-[9px] font-bold text-muted-foreground italic group-hover:text-primary transition-colors">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Critical Buyers */}
      <div className="glass rounded-[2rem] border border-border overflow-hidden">
        <div className="flex justify-between items-center p-6 lg:p-8 pb-4">
          <div>
            <h3 className="text-lg font-bold">Risk Management</h3>
            <p className="text-xs text-muted-foreground mt-1">High-risk buyers prioritized by scoring engine</p>
          </div>
          <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            View All Customers <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-border bg-secondary/50">
                <th className="text-left px-6 lg:px-8 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Buyer Name</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exposure</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk Score</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {criticalBuyers.map((buyer, i) => (
                <motion.tr key={buyer.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                  className="hover:bg-secondary/40 transition-colors cursor-pointer group">
                  <td className="px-6 lg:px-8 py-4 font-semibold text-sm group-hover:text-primary transition-colors">{buyer.name}</td>
                  <td className="px-4 py-4 font-bold text-right text-ruby-500">₹{(Number(buyer.exposure)/100000).toFixed(2)}L</td>
                  <td className="px-4 py-4 text-right pr-12 font-extrabold">{buyer.riskScore}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${riskColors[buyer.riskLevel] || riskColors.low}`}>
                      {buyer.isCreditFrozen ? 'Frozen' : buyer.riskLevel.toUpperCase()}
                    </span>
                  </td>
                </motion.tr>
              ))}
              {criticalBuyers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground italic">No critical buyers at the moment.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
