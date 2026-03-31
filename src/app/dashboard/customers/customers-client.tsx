import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, ArrowUpRight, X, UserPlus, Info, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createCustomer, recalculateAllRiskScores } from "@/services/customers";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  city: string | null;
  gst_number: string | null;
  credit_limit: number;
  exposure: number;
  risk_score: number;
}

const riskConfig: Record<string, string> = {
  low:      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  medium:   "bg-amber-500/10 text-amber-500 border-amber-500/20",
  high:     "bg-ruby-500/10 text-ruby-500 border-ruby-500/20",
  critical: "bg-ruby-600/20 text-ruby-600 border-ruby-600/30 font-black",
};

const RISKS = ["All", "Low", "Medium", "High", "Critical"];

export function CustomersClient({ 
  initialCustomers, 
  companyId 
}: { 
  initialCustomers: Customer[], 
  companyId: string 
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = searchParams.get("search") || "";
  const risk = searchParams.get("risk") || "All";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    gstNumber: "",
    creditLimit: "",
  });

  const updateFilters = (s: string, r: string) => {
    const params = new URLSearchParams(searchParams);
    if (s) params.set("search", s); else params.delete("search");
    if (r !== "All") params.set("risk", r); else params.delete("risk");
    setSearchParams(params);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await createCustomer({
      ...formData,
      creditLimit: parseFloat(formData.creditLimit) || 0,
      companyId: companyId,
      phone: formData.phone,
    });

    if (res.error) {
      setError(res.error);
      toast.error(res.error);
      setLoading(false);
    } else {
      toast.success("Customer added successfully!");
      setShowAddModal(false);
      setFormData({ name: "", email: "", phone: "", city: "", gstNumber: "", creditLimit: "" });
      setLoading(false);
      window.location.reload();
    }
  };

  const getRiskLevel = (score: number) => {
    if (score < 30) return "low";
    if (score < 60) return "medium";
    if (score < 85) return "high";
    return "critical";
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-background/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-[101] shadow-2xl p-8 flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                    <UserPlus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">New Customer</h2>
                    <p className="text-xs text-muted-foreground font-medium">Onboard a new retailer/distributor</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-secondary transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-ruby-500/10 border border-ruby-500/20 rounded-2xl flex items-start gap-3 text-ruby-500 text-xs font-bold">
                  <Info className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleCreateCustomer} className="space-y-5 flex-1 overflow-y-auto pr-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 ml-1">Entity Name *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Mahavir Textiles" className="w-full px-5 py-3.5 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 ml-1">GST Number</label>
                    <input type="text" value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })} placeholder="24AAAAA0000A1Z5" className="w-full px-5 py-3.5 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 ml-1">City</label>
                    <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Surat" className="w-full px-5 py-3.5 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 ml-1">Business Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="contact@mahavir.com" className="w-full px-5 py-3.5 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 ml-1">WhatsApp Phone *</label>
                    <input type="tel" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 9876543210" className="w-full px-5 py-3.5 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 ml-1">Initial Credit Limit (INR) *</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                    <input type="number" required value={formData.creditLimit} onChange={e => setFormData({ ...formData, creditLimit: e.target.value })} placeholder="500000" step="1000" className="w-full pl-10 pr-5 py-5 bg-secondary/30 border border-border/60 rounded-3xl text-xl font-black focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all" />
                  </div>
                </div>

                <div className="pt-8 mt-auto sticky bottom-0 bg-background pb-4">
                  <button type="submit" disabled={loading} className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-primary/25 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Onboard Customer <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search customer name, city or GST..." value={search} onChange={e => { updateFilters(e.target.value, risk); }} className="w-full pl-11 pr-4 py-3 glass rounded-2xl border border-border bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {RISKS.map(r => (
            <button key={r} onClick={() => { updateFilters(search, r); }} className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${risk === r ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "border-border text-muted-foreground glass hover:text-foreground"}`}>
              {r}
            </button>
          ))}
        </div>
        <button 
          onClick={async () => {
            const count = await recalculateAllRiskScores(companyId);
            toast.success(`Recalculated risk for ${count} customers.`);
            window.location.reload();
          }}
          className="px-6 py-3 glass rounded-2xl text-[10px] font-black uppercase tracking-widest border border-border hover:bg-secondary transition-all whitespace-nowrap flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          Recalculate Risk
        </button>
        <button onClick={() => setShowAddModal(true)} className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold text-sm rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap">
          <Plus className="w-4 h-4" /> Add Entity
        </button>
      </div>

      {/* Adaptive Layout (Table for Desktop, Cards for Mobile) */}
      <div className="space-y-4 lg:space-y-0">
        {/* Mobile-Friendly Cards (<1024px) */}
        <div className="grid lg:hidden grid-cols-1 gap-4">
          {initialCustomers.map((cus, i) => {
            const exposure = cus.exposure || 0;
            const limit = cus.credit_limit || 0;
            const util = limit > 0 ? (exposure / limit) * 100 : 0;
            const riskLevel = getRiskLevel(cus.risk_score);
            const level = riskConfig[riskLevel] || riskConfig.low;

            return (
              <motion.div 
                key={cus.id} 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/dashboard/customers/${cus.id}`)}
                className="glass p-5 rounded-[2rem] border border-border group active:scale-95 transition-all overflow-hidden relative"
              >
                {/* Visual Risk Glow */}
                <div className={`absolute -right-6 -top-6 w-20 h-20 blur-2xl opacity-10 rounded-full ${
                  util > 80 ? 'bg-ruby-500' : 'bg-emerald-500'
                }`} />

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base tracking-tight leading-none">{cus.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{cus.gst_number || 'UNREGISTERED'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${level}`}>
                    {riskLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 relative z-10 bg-secondary/30 p-3 rounded-2xl border border-border/50">
                  <div>
                    <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-0.5">Exposure</p>
                    <p className="font-black text-ruby-500 text-sm">₹{(exposure / 100000).toFixed(2)}L</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-0.5">Risk Score</p>
                    <p className="font-black text-foreground text-sm">{cus.risk_score}</p>
                  </div>
                </div>

                <div className="space-y-1.5 relative z-10">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Limit Utilization</span>
                    <span>{util.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary/40 rounded-full overflow-hidden border border-border/20">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(util, 100)}%` }} className={`h-full ${util > 80 ? 'bg-ruby-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : util > 50 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'}`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Desktop-Only Table (>=1024px) */}
        <div className="hidden lg:block glass rounded-[2.5rem] border border-border overflow-hidden shadow-xl shadow-black/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entity Detail</th>
                <th className="text-left px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location</th>
                <th className="text-right px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Credit Utilization</th>
                <th className="text-center px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Risk Status</th>
                <th className="px-6 py-5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialCustomers.map((cus, i) => {
                const exposure = cus.exposure || 0;
                const limit = cus.credit_limit || 0;
                const util = limit > 0 ? (exposure / limit) * 100 : 0;
                const riskLevel = getRiskLevel(cus.risk_score);

                return (
                  <motion.tr 
                    key={cus.id} 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} 
                    className="hover:bg-primary/[0.02] transition-colors cursor-pointer group"
                    onClick={() => navigate(`/dashboard/customers/${cus.id}`)}
                  >
                    <td className="px-8 py-6">
                      <p className="font-extrabold text-base group-hover:text-primary transition-colors">{cus.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">{cus.gst_number || 'GST-UNREGISTERED'}</p>
                    </td>
                    <td className="px-6 py-6">
                      <p className="font-bold text-sm tracking-tight">{cus.city || 'N/A'}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{cus.email || '--'}</p>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <p className="font-black text-sm">₹{(exposure / 100000).toFixed(2)}L <span className="text-muted-foreground font-medium text-[10px]">/ ₹{(limit / 100000).toFixed(1)}L</span></p>
                        <div className="w-40 h-2 bg-secondary/50 rounded-full overflow-hidden border border-border/20">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(util, 100)}%` }} className={`h-full ${util > 80 ? 'bg-ruby-500' : util > 50 ? 'bg-amber-500' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(0,0,0,0.05)] transition-all`} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${riskConfig[riskLevel]}`}>
                        {riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center glass group-hover:bg-primary transition-all group-hover:text-white shadow-lg opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {initialCustomers.length === 0 && (
        <div className="py-24 text-center">
          <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-dashed border-border">
            <Search className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="text-muted-foreground font-bold tracking-tight">No entities match your current filters</p>
        </div>
      )}
    </div>
  );
}
