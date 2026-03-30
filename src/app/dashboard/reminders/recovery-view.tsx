'use client';

import { motion } from "framer-motion";
import { TrendingUp, FileText, Download, IndianRupee, Clock } from "lucide-react";

interface RecoveryItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  daysOverdue: number;
  suggestedInterest: number;
  rateUsed: number;
}

export function RecoveryView({ items }: { items: RecoveryItem[] }) {
  const totalPotential = items.reduce((sum, item) => sum + item.suggestedInterest, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass p-6 rounded-[2rem] border border-border flex items-center gap-4">
          <div className="w-12 h-12 bg-ruby-500/10 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-ruby-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total Recovery Potential</p>
            <h3 className="text-2xl font-black">₹{totalPotential.toLocaleString()}</h3>
          </div>
        </div>
        <div className="glass p-6 rounded-[2rem] border border-border flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Suggested Debit Notes</p>
            <h3 className="text-2xl font-black">{items.length} Pending</h3>
          </div>
        </div>
      </div>

      <div className="glass rounded-[2rem] border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-500" />
            Interest Recovery Ledger
          </h3>
          <button className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-full hover:bg-black/80 transition-all">
            <Download className="w-3 h-3" /> Export Report
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customer</th>
                <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Invoice</th>
                <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Overdue Days</th>
                <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Suggested Interest</th>
                <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, i) => (
                <motion.tr 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground">{item.customerName}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                    #{item.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                      <Clock className="w-2.5 h-2.5" /> {item.daysOverdue} Days
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-emerald-500">
                    ₹{item.suggestedInterest.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[10px] font-extrabold text-primary hover:underline">
                      CREATE DEBIT NOTE
                    </button>
                  </td>
                </motion.tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    No interest recovery suggested at this time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
