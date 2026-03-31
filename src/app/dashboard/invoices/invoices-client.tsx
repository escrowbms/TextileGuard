import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Download, ArrowUpRight, FileText, X, Receipt, Calendar, User, Info, ArrowRight, Database, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { createInvoice } from "@/services/invoices";
import { checkCreditStatus, CreditStatus } from "@/services/customers";
import { getClauses, Clause } from "@/services/clauses";
import { Shield, Hammer, MapPin, Hash, Check } from "lucide-react";
import { useEffect } from "react";
import { format } from "date-fns";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  balance_due: number;
  due_date: string;
  status: string;
  aging_bucket: string | null;
  customer_name: string;
  customers?: { id: string; name: string; city: string | null };
  po_number?: string;
  jurisdiction?: string;
  delivery_proof_url?: string;
  eway_bill_number?: string;
}

interface Customer {
  id: string;
  name: string;
  creditLimit: string;
  exposure: string;
}

const statusConfig: Record<string, string> = {
  paid:    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  pending: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  partial: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  overdue: "bg-red-500/10 text-red-500 border-red-500/20",
};

const bucketConfig: Record<string, string> = {
  "0-30":   "bg-emerald-500/10 text-emerald-600",
  "31-60":  "bg-indigo-500/10 text-indigo-500",
  "61-90":  "bg-amber-500/10 text-amber-600",
  "91-180": "bg-red-500/10 text-red-500",
  "180+":   "bg-red-600/20 text-red-600 font-extrabold",
};

const FILTERS = ["All", "Overdue", "Partial", "Pending", "Paid"];
const BUCKETS = ["All Buckets", "0-30", "31-60", "61-90", "91-180", "180+"];

export function InvoicesClient({ 
  initialInvoices, 
  customers,
  companyId 
}: { 
  initialInvoices: Invoice[], 
  customers: Customer[],
  companyId: string
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "All";
  const bucket = searchParams.get("bucket") || "All Buckets";

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerId: "",
    invoiceNumber: "",
    totalAmount: "",
    dueDate: new Date().toISOString().split('T')[0],
    poNumber: "",
    jurisdiction: "Local Jurisdiction Only",
    clauseIds: [] as string[],
  });
  const [selectedCustomerStatus, setSelectedCustomerStatus] = useState<CreditStatus | null>(null);
  const [availableClauses, setAvailableClauses] = useState<Clause[]>([]);

  useEffect(() => {
    async function getStatus() {
      if (formData.customerId) {
        const status = await checkCreditStatus(formData.customerId);
        setSelectedCustomerStatus(status);
        if (status.isFrozen) {
          setError(`DISPATCH BLOCKED: ${status.reason}`);
        } else {
          setError("");
        }
      } else {
        setSelectedCustomerStatus(null);
        setError("");
      }
    }
    getStatus();
  }, [formData.customerId]);

  useEffect(() => {
    async function loadClauses() {
      if (companyId) {
        const data = await getClauses(companyId);
        setAvailableClauses(data);
      }
    }
    loadClauses();
  }, [companyId]);

  const updateFilters = (s: string, st: string, b: string) => {
    const params = new URLSearchParams(searchParams);
    if (s) params.set("search", s); else params.delete("search");
    if (st !== "All") params.set("status", st); else params.delete("status");
    if (b !== "All Buckets") params.set("bucket", b); else params.delete("bucket");
    setSearchParams(params);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) { setError("Please select a customer."); return; }
    if (selectedCustomerStatus?.isFrozen) {
      toast.error(`Cannot create invoice: ${selectedCustomerStatus.reason}`);
      return;
    }
    setLoading(true);
    setError("");
    const res = await createInvoice({
      customerId: formData.customerId,
      invoiceNumber: formData.invoiceNumber,
      totalAmount: parseFloat(formData.totalAmount) || 0,
      dueDate: new Date(formData.dueDate),
      companyId: companyId,
      poNumber: formData.poNumber,
      jurisdiction: formData.jurisdiction,
      clauseIds: formData.clauseIds,
    });
    if (res.error) {
      setError(res.error);
      toast.error(res.error);
    } else {
      toast.success("Invoice recorded successfully!");
      setShowAddModal(false);
      setFormData({ 
        customerId: "", invoiceNumber: "", totalAmount: "", 
        dueDate: new Date().toISOString().split('T')[0],
        poNumber: "", jurisdiction: "Local Jurisdiction Only", clauseIds: []
      });
      window.location.reload(); 
    }
    setLoading(false);
  };

  const selectedCustomer = customers.find(c => c.id === formData.customerId);
  const totalOverdue = initialInvoices
    .filter(i => i.status.toLowerCase() === 'overdue')
    .reduce((sum, i) => sum + i.balance_due, 0);

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-background/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-[101] shadow-2xl p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                    <Receipt className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">New Invoice</h2>
                    <p className="text-xs text-muted-foreground font-medium">Record a new receivable</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-secondary transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-500 text-xs font-bold">
                  <Info className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleCreateInvoice} className="space-y-6 flex-1">
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 ml-1">Select Customer *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      required
                      value={formData.customerId}
                      onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                      className="w-full pl-11 pr-4 py-4 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
                    >
                      <option value="">Choose a customer...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {selectedCustomer && (
                    <p className="text-[10px] text-muted-foreground mt-2 ml-1 font-medium">
                      Limit: ₹{(parseFloat(selectedCustomer.creditLimit) / 100000).toFixed(1)}L · Exposure: ₹{(parseFloat(selectedCustomer.exposure) / 100000).toFixed(2)}L
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 ml-1">Invoice # *</label>
                    <input
                      type="text" required
                      value={formData.invoiceNumber}
                      onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      placeholder="TG-2025-001"
                      className="w-full px-5 py-4 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 ml-1">Due Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="date" required
                        value={formData.dueDate}
                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full pl-11 pr-4 py-4 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Strengthening Layer</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 ml-1">PO Linkage</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <input
                          type="text"
                          value={formData.poNumber}
                          onChange={e => setFormData({ ...formData, poNumber: e.target.value })}
                          placeholder="PO-8821"
                          className="w-full pl-9 pr-4 py-3 bg-background border border-border/60 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 ml-1">Jurisdiction</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <input
                          type="text"
                          value={formData.jurisdiction}
                          onChange={e => setFormData({ ...formData, jurisdiction: e.target.value })}
                          placeholder="City Name"
                          className="w-full pl-9 pr-4 py-3 bg-background border border-border/60 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 ml-1">Inject Legal Clauses</label>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                      {availableClauses.map(clause => (
                        <button
                          key={clause.id}
                          type="button"
                          onClick={() => {
                            const ids = formData.clauseIds.includes(clause.id)
                              ? formData.clauseIds.filter(id => id !== clause.id)
                              : [...formData.clauseIds, clause.id];
                            setFormData({ ...formData, clauseIds: ids });
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            formData.clauseIds.includes(clause.id) 
                              ? 'bg-primary/10 border-primary text-primary' 
                              : 'bg-background border-border text-muted-foreground hover:border-primary/40'
                          }`}
                        >
                          <span className="text-[10px] font-bold truncate pr-4">{clause.title}</span>
                          {formData.clauseIds.includes(clause.id) && <Check className="w-3 h-3 flex-shrink-0" />}
                        </button>
                      ))}
                      {availableClauses.length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic p-2 border border-dashed border-border rounded-xl">No templates found. Set them up in Settings.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2 ml-1">Total Amount (INR) *</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                    <input
                      type="number" required
                      value={formData.totalAmount}
                      onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                      placeholder="0.00" step="0.01"
                      className="w-full pl-10 pr-5 py-6 bg-secondary/30 border border-border/60 rounded-3xl text-2xl font-black focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-border">
                  {selectedCustomerStatus?.isFrozen && (
                    <div className="mb-6 p-4 bg-ruby-500/10 border border-ruby-500/20 rounded-2xl flex items-start gap-4 animate-pulse">
                      <ShieldAlert className="w-6 h-6 text-ruby-500 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-tighter text-ruby-500">Enforcement Block Active</p>
                        <p className="text-xs font-bold text-ruby-700/80 mt-0.5">{selectedCustomerStatus.reason}</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit" 
                    disabled={loading || selectedCustomerStatus?.isFrozen}
                    className="w-full py-5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <>Finalize & Save Invoice <ArrowRight className="w-4 h-4" /></>
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Invoices", value: initialInvoices.length.toString(), icon: "📄" },
          { label: "Total Overdue", value: `₹${(totalOverdue / 100000).toFixed(2)}L`, icon: "⚠️" },
          { label: "Pending", value: initialInvoices.filter(i => i.status === 'pending').length.toString(), icon: "⏳" },
          { label: "Paid", value: initialInvoices.filter(i => i.status === 'paid').length.toString(), icon: "✅" },
        ].map(card => (
          <div key={card.label} className="glass p-4 rounded-2xl border border-border">
            <span className="text-2xl mb-2 block">{card.icon}</span>
            <p className="text-xl font-extrabold">{card.value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" placeholder="Search invoices..."
              value={search}
              onChange={e => { updateFilters(e.target.value, status, bucket); }}
              className="w-full pl-11 pr-4 py-3 glass rounded-2xl border border-border bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
            />
          </div>
          <button
            onClick={() => {
              if (initialInvoices.length === 0) { toast.info("No invoices to export"); return; }
              const rows = [
                ["Invoice #", "Customer", "Due Date", "Total Amount", "Balance Due", "Status", "Aging Bucket"],
                ...initialInvoices.map(i => [
                  i.invoice_number,
                  i.customer_name,
                  format(new Date(i.due_date), "dd/MM/yyyy"),
                  i.balance_due,
                  i.balance_due,
                  i.status,
                  i.aging_bucket || "N/A",
                ])
              ];
              const csv = rows.map(r => r.join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
              a.click(); URL.revokeObjectURL(url);
              toast.success("Invoices exported");
            }}
            className="flex items-center gap-2 px-4 py-3 glass rounded-2xl border border-border text-sm text-muted-foreground hover:text-foreground transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-semibold text-sm rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => { updateFilters(search, f, bucket); }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${status === f ? "bg-primary text-white border-primary" : "border-border text-muted-foreground glass hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {BUCKETS.map(b => (
              <button key={b} onClick={() => { updateFilters(search, status, b); }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${bucket === b ? "bg-secondary text-foreground border-foreground/30" : "border-border text-muted-foreground glass hover:text-foreground"}`}>
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {/* Adaptive Layout (Table for Desktop, Cards for Mobile) */}
      <div className="space-y-4 lg:space-y-0">
        {/* Mobile-Friendly Cards (<1024px) */}
        <div className="grid lg:hidden grid-cols-1 gap-4">
          {initialInvoices.map((inv, i) => {
            const isOverdue = inv.status.toLowerCase() === 'overdue';
            const statusStyle = statusConfig[inv.status.toLowerCase()] || 'bg-secondary';
            
            return (
              <motion.div 
                key={inv.id} 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass p-5 rounded-[2rem] border border-border group active:scale-95 transition-all overflow-hidden relative"
              >
                {/* Overdue Alert Glow */}
                {isOverdue && (
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-ruby-500 blur-2xl opacity-10 rounded-full" />
                )}

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-[10px] font-black text-primary tracking-widest uppercase">{inv.invoice_number}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border ${statusStyle}`}>
                        {inv.status}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base tracking-tight leading-none group-hover:text-primary transition-colors">{inv.customer_name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-0.5">Balance</p>
                    <p className="font-black text-sm">₹{inv.balance_due.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/40 relative z-10">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Due {new Date(inv.due_date).toLocaleDateString()}</span>
                  </div>
                  {inv.aging_bucket && (
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full ${bucketConfig[inv.aging_bucket] || 'bg-secondary text-muted-foreground'}`}>
                      {inv.aging_bucket} DAYS
                    </span>
                  )}
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
                <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Invoice Detail</th>
                <th className="text-left px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customer Entity</th>
                <th className="text-right px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Outstanding Amount</th>
                <th className="text-center px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aging / Bucket</th>
                <th className="text-center px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="px-6 py-5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialInvoices.map((inv, i) => (
                <motion.tr 
                  key={inv.id} 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-primary/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="px-8 py-6">
                    <p className="font-mono text-[10px] font-black text-primary tracking-widest uppercase">{inv.invoice_number}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-muted-foreground group-hover:text-primary transition-colors">
                      <Calendar className="w-3 h-3" />
                      <p className="text-[10px] font-medium tracking-tight">Due {new Date(inv.due_date).toLocaleDateString()}</p>
                    </div>
                    {inv.po_number && (
                      <div className="flex items-center gap-1.5 mt-1 text-emerald-500 font-bold">
                        <Check className="w-3 h-3" />
                        <p className="text-[10px] tracking-tight uppercase">PO: {inv.po_number}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-6">
                    <p className="font-extrabold text-sm tracking-tight group-hover:text-primary transition-colors">{inv.customer_name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{inv.customers?.city || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Enforcement</p>
                    <div className="flex flex-col gap-1">
                      <div className={`text-[10px] font-bold ${inv.po_number ? 'text-emerald-500' : 'text-muted-foreground/40'}`}>
                        {inv.po_number ? '✓ PO LINKED' : '○ NO PO'}
                      </div>
                      <div className={`text-[10px] font-bold ${inv.eway_bill_number ? 'text-emerald-500' : 'text-muted-foreground/40'}`}>
                        {inv.eway_bill_number ? '✓ E-WAY READY' : '○ NO POD'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <p className="font-black text-sm">₹{inv.balance_due.toLocaleString('en-IN')}</p>
                    <p className="text-[9px] text-muted-foreground font-medium tracking-widest uppercase mt-0.5">INR</p>
                  </td>
                  <td className="px-6 py-6 text-center">
                    {inv.aging_bucket ? (
                      <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border transition-all ${bucketConfig[inv.aging_bucket] || 'bg-secondary text-muted-foreground border-border'}`}>
                        {inv.aging_bucket} DAYS
                      </span>
                    ) : (
                      <span className="text-muted-foreground/30 text-[10px] font-black">--</span>
                    )}
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`text-[10px] font-black px-4 py-2 rounded-full border transition-all ${statusConfig[inv.status.toLowerCase()] || 'bg-secondary'}`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center glass group-hover:bg-primary transition-all group-hover:text-white shadow-lg opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {initialInvoices.length === 0 && (
        <div className="py-24 text-center">
          <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-dashed border-border text-muted-foreground/20">
            <Receipt className="w-8 h-8" />
          </div>
          <p className="text-muted-foreground font-bold tracking-tight">No invoices found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
