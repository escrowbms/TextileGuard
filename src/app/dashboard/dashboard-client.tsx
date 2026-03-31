'use client';

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, LucideIcon, RefreshCw, Zap, TrendingUp, AlertTriangle, Clock } from "lucide-react";
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
  stats, agingData, criticalBuyers, lastSync, remindersCount, concentrationData, analytics, onTriggerSync 
}: { 
  stats: Stat[], 
  agingData: AgingBar[], 
  criticalBuyers: Buyer[],
  lastSync?: string,
  remindersCount?: number,
  concentrationData?: any[],
  analytics?: any,
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
      {/* Stats Grid - Snowy White Aesthetic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-inter">
        {stats.map((stat, i) => {
          const isGood = stat.trend === 'good' || stat.trend === 'up';
          const isCritical = stat.title.includes('Overdue') || stat.title.includes('Blocked') || stat.title.includes('Loss');
          
          return (
            <motion.div 
              key={stat.title} 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              whileHover={{ 
                y: -4, 
                transition: { duration: 0.2, ease: "easeOut" } 
              }}
              transition={{ delay: i * 0.04 }}
              className="relative group cursor-default h-full"
            >
              <div className="relative bg-white/90 backdrop-blur-2xl p-4 lg:p-5 rounded-[1.8rem] border border-slate-200/80 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.05)] h-full flex flex-col justify-between overflow-hidden transition-all group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] group-hover:bg-white">
                <div className={`absolute -right-10 -top-10 w-24 h-24 blur-3xl opacity-[0.03] group-hover:opacity-[0.06] rounded-full transition-opacity ${
                  isCritical ? 'bg-ruby-500' : isGood ? 'bg-emerald-500' : 'bg-primary'
                }`} />

                <div className="relative z-10 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className={`w-10 h-10 ${stat.bg.replace('/10', '/20')} rounded-2xl flex items-center justify-center shadow-sm border border-white`}>
                      <stat.icon className={`w-5 h-5 ${stat.color} drop-shadow-sm`} />
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border ${
                      isGood ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-ruby-500/10 text-ruby-500 border-ruby-500/20'
                    }`}>
                      {stat.change}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 group-hover:text-slate-500 transition-colors leading-none">
                      {stat.title}
                    </p>
                    <h4 className="text-xl lg:text-2xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors">
                      {stat.value}
                    </h4>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Aging Distribution */}
        <div className="glass p-5 lg:p-6 rounded-[1.8rem] border border-border">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-bold mb-0.5 italic">Aging Distribution</h3>
              <p className="text-[9px] text-muted-foreground uppercase font-black opacity-60">Capital distribution</p>
            </div>
          </div>

          <div className="flex items-end gap-2.5 h-32 px-1 mb-2">
            {agingData.map((bar, i) => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-1.5 group">
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${(bar.value / maxAgingValue) * 100}%` }}
                  transition={{ duration: 0.9, delay: i * 0.1, ease: "easeOut" }}
                  className={`w-full ${bar.color} rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity relative shadow-lg`}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-secondary px-2 py-0.5 rounded-md whitespace-nowrap z-10">
                    ₹{bar.value.toFixed(1)}L
                  </span>
                </motion.div>
                <span className="text-[7px] font-black text-muted-foreground text-center uppercase tracking-tighter">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Concentration */}
        <div className="glass p-5 lg:p-6 rounded-[1.8rem] border border-border">
          <div className="flex items-center gap-2 mb-4">
             <TrendingUp className="w-3.5 h-3.5 text-ruby-500" />
             <div>
               <h3 className="text-base font-bold mb-0.5 italic uppercase tracking-tighter">Liquid Capital Concentration</h3>
               <p className="text-[9px] text-muted-foreground font-black opacity-60 uppercase">Rolling risk analysis</p>
             </div>
          </div>
          <div className="h-32">
            {concentrationData && concentrationData.length > 0 ? (
              <BlockedCapitalChart data={concentrationData} />
            ) : (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground italic text-[10px]">
                Analyzing risk patterns...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Health Section (Full Width Now) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Collection Rate", value: `${analytics?.collectionRate || 0}%`, color: "bg-emerald-500", icon: Zap, desc: analytics?.collectionRate > 80 ? "PEAK PERFORMANCE" : "ATTENTION REQ.", progress: analytics?.collectionRate || 0 },
          { label: "Disputed Load", value: criticalBuyers.length.toString(), color: "bg-amber-500", icon: AlertTriangle, desc: "AWAITING ACTION", progress: 60 },
          { label: "Lost Interest", value: `₹${(analytics?.interestLoss / 1000).toFixed(1)}k`, color: "bg-ruby-500", icon: TrendingUp, desc: "ROI LEAKAGE", progress: 40 },
          { label: "DSO INDEX", value: `${analytics?.dso || 0}D`, color: "bg-indigo-500", icon: Clock, desc: analytics?.dso > 30 ? "ABOVE TARGET" : "HEALTHY FLOW", progress: analytics?.dso > 60 ? 90 : 50 },
        ].map((item, i) => (
          <div key={i} className="relative group overflow-hidden">
            <div className={`absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity ${item.color}`} />
            <div className={`relative p-4 bg-white/90 backdrop-blur-xl rounded-[1.5rem] border border-slate-200/60 group-hover:border-primary/30 transition-all h-full shadow-sm group-hover:shadow-md`}>
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-xl ${item.color.replace('bg-', 'bg-')}/10 border border-white shadow-sm`}>
                  <item.icon className={`w-4 h-4 ${item.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 block mb-0.5">{item.label}</span>
                  <span className="text-lg font-black text-slate-900">{item.value}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${item.progress}%` }} 
                    transition={{ duration: 1.5, delay: i * 0.1, ease: "circOut" }}
                    className={`h-full ${item.color} rounded-full`} 
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-[7px] font-black tracking-widest ${item.color.replace('bg-', 'text-')} transition-colors`}>{item.desc}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Critical Buyers */}
      <div className="glass rounded-[1.8rem] border border-border overflow-hidden">
        <div className="flex justify-between items-center p-5 lg:p-6 pb-3">
          <div>
            <h3 className="text-base font-bold">Risk Management</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Prioritized by scoring engine</p>
          </div>
          <button className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            View All <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto hidden lg:block">
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
            </tbody>
          </table>
        </div>

        {/* Mobile-Friendly Risk Cards */}
        <div className="lg:hidden divide-y divide-border border-t border-border">
          {criticalBuyers.map((buyer, i) => (
            <motion.div 
              key={buyer.name} 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: i * 0.05 }}
              className="p-4 active:bg-secondary/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-sm text-foreground">{buyer.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{buyer.city || 'Industrial Region'}</p>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${riskColors[buyer.riskLevel] || riskColors.low}`}>
                  {buyer.isCreditFrozen ? 'FROZEN' : buyer.riskLevel.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Active Exposure</p>
                   <p className="text-sm font-black text-ruby-500 tracking-tight">₹{(Number(buyer.exposure)/100000).toFixed(2)}L</p>
                </div>
                <div className="text-right space-y-1">
                   <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Risk Index</p>
                   <p className="text-sm font-black text-foreground">{buyer.riskScore}/100</p>
                </div>
              </div>
            </motion.div>
          ))}
          {criticalBuyers.length === 0 && (
            <div className="py-12 text-center text-muted-foreground italic text-sm">No critical buyers.</div>
          )}
        </div>
      </div>
    </div>
  );
}
