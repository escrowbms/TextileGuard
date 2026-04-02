import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, AlertTriangle, IndianRupee, ArrowUpRight, ShieldCheck,
  ShieldAlert, History, UserCheck, Loader2, X, Save, Download, TrendingUp, Cpu, Sparkles, Lightbulb
} from "lucide-react";
import { format } from "date-fns";
import { getCustomerById, checkCreditStatus, CreditStatus } from "@/services/customers";
import { getInvoices } from "@/services/invoices";
import { useAuth } from "@/lib/auth-context";
import { getUserByFirebaseUid } from "@/services/user";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { getCustomerRiskAudit, RiskAudit } from "@/services/intelligence";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);

  // Edit Profile Modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", city: "", gst_number: "", credit_limit: "" });
  const [saving, setSaving] = useState(false);

  // Freeze/Unfreeze
  const [freezing, setFreezing] = useState(false);

  // AI Risk Audit
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<RiskAudit | null>(null);

  const loadData = async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      const appUser = await getUserByFirebaseUid(user.uid);
      if (!appUser?.companyId) return;

      const [custRes, invList, statusRes] = await Promise.all([
        getCustomerById(id),
        getInvoices(appUser.companyId, undefined, undefined, undefined, id),
        checkCreditStatus(id)
      ]);

      if (custRes.error || !custRes.data) { navigate("/dashboard/customers"); return; }

      setCustomer(custRes.data);
      setInvoices(invList);
      setCreditStatus(statusRes);
      setEditForm({
        name: custRes.data.name || "",
        email: custRes.data.email || "",
        phone: custRes.data.phone || "",
        city: custRes.data.city || "",
        gst_number: custRes.data.gst_number || "",
        credit_limit: String(custRes.data.credit_limit || 0),
      });
    } catch (err) {
      console.error("Error fetching customer details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id, user]);

  const handleSaveProfile = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase.from("customers").update({
      name: editForm.name,
      email: editForm.email || null,
      phone: editForm.phone || null,
      city: editForm.city || null,
      gst_number: editForm.gst_number || null,
      credit_limit: parseFloat(editForm.credit_limit) || 0,
    }).eq("id", id);

    if (error) { toast.error("Failed to update profile"); }
    else {
      toast.success("Profile updated successfully");
      setShowEdit(false);
      loadData();
    }
    setSaving(false);
  };

  const handleToggleFreeze = async () => {
    if (!id || !customer) return;
    setFreezing(true);
    const newStatus = customer.is_credit_frozen ? false : true;
    const newStatusText = newStatus ? "frozen" : "active";
    const { error } = await supabase.from("customers")
      .update({ is_credit_frozen: newStatus, status: newStatusText })
      .eq("id", id);

    if (error) { toast.error("Failed to update credit status"); }
    else {
      toast.success(newStatus ? "⚠️ Credit frozen — dispatches blocked" : "✅ Credit restored — dispatches allowed");
      loadData();
    }
    setFreezing(false);
  };

  const handleRunAiAudit = async () => {
    if (!id) return;
    setIsAuditing(true);
    try {
      const result = await getCustomerRiskAudit(id);
      setAuditResult(result);
      toast.success("Intelligence Audit Completed");
    } catch (err) {
      toast.error("AI Uplink Failed");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleDownloadStatement = () => {
    if (invoices.length === 0) { toast.info("No invoices to export"); return; }
    const rows = [
      ["Invoice #", "Due Date", "Total Amount", "Balance Due", "Status", "Aging Bucket"],
      ...invoices.map(i => [
        i.invoice_number,
        format(new Date(i.due_date), "dd/MM/yyyy"),
        i.total_amount || 0,
        i.balance_due || 0,
        i.status,
        i.aging_bucket || "N/A",
      ])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${customer.name}-statement.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Statement downloaded");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-xs">
        <Loader2 className="w-8 h-8 animate-spin" />
        Synchronizing Ledger...
      </div>
    );
  }

  if (!customer) return null;

  const totalExposure = customer.exposure || 0;
  const limit = customer.credit_limit || 0;
  const utilization = limit > 0 ? Math.min((totalExposure / limit) * 100, 100) : 0;
  const overdueInvoices = invoices.filter((i: any) => i.status.toLowerCase() === "overdue");
  const totalOverdue = overdueInvoices.reduce((sum: number, i: any) => sum + (i.balance_due || 0), 0);
  const isFrozen = customer.is_credit_frozen || customer.status === "frozen";

  const rawScore = customer.risk_score || 0;
  const hasHistory = invoices.length > 0;

  const getRiskLevel = (score: number) => {
    if (!hasHistory || score === 0) return "unrated";
    if (score < 30) return "low";
    if (score < 60) return "medium";
    if (score < 85) return "high";
    return "critical";
  };
  const riskLevel = getRiskLevel(rawScore);

  const riskColors: Record<string, string> = {
    unrated: "bg-secondary border-border text-muted-foreground",
    low: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
    medium: "bg-indigo-500/10 border-indigo-500/20 text-indigo-500",
    high: "bg-amber-500/10 border-amber-500/20 text-amber-500",
    critical: "bg-ruby-500/10 border-ruby-500/20 text-ruby-500",
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/customers" className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-secondary transition-all group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black tracking-tight">{customer.name}</h1>
              {isFrozen ? (
                <span className="px-3 py-1 bg-ruby-500/10 text-ruby-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-ruby-500/30 shadow-sm animate-pulse flex items-center gap-2">
                  <ShieldAlert className="w-3 h-3" /> Credit Frozen
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-emerald-500/30 shadow-sm flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" /> Dispatch Approved
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              GSTIN: <span className="font-mono text-primary uppercase">{customer.gst_number || "N/A"}</span> ·{" "}
              Risk Score: <span className="font-bold text-foreground">{customer.risk_score || 0}/100</span>
              {customer.city && <> · <span>{customer.city}</span></>}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowEdit(true)}
            className="px-6 py-2.5 glass border border-border/50 rounded-xl text-xs font-bold hover:bg-secondary transition-all"
          >
            Edit Profile
          </button>
          <button
            onClick={handleToggleFreeze}
            disabled={freezing}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg disabled:opacity-50 flex items-center gap-2 ${
              isFrozen
                ? "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600"
                : "bg-ruby-500 text-white shadow-ruby-500/20 hover:bg-ruby-600"
            }`}
          >
            {freezing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {isFrozen ? "Unfreeze Credit" : "Freeze Credit Manually"}
          </button>
        </div>
      </div>

      {/* AI Intelligence Audit Layer (Conditional) */}
      <AnimatePresence>
        {auditResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative glass p-8 rounded-[3rem] border border-primary/20 bg-primary/5 overflow-hidden group mb-8"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all">
              <Cpu className="w-40 h-40 text-primary animate-spin-slow" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic">Grok AI Forensic Analysis</h3>
                </div>
                <button 
                  onClick={() => setAuditResult(null)}
                  className="w-10 h-10 rounded-full glass hover:bg-ruby-500/10 hover:text-ruby-500 transition-all flex items-center justify-center border border-border/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center border-4 ${
                      auditResult.verdict === 'RED' ? 'border-ruby-500/40 bg-ruby-500/10 text-ruby-500' :
                      auditResult.verdict === 'YELLOW' ? 'border-amber-500/40 bg-amber-500/10 text-amber-500' :
                      'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                    }`}>
                      <span className="text-3xl font-black">{auditResult.score}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Forensic Risk Score</p>
                      <p className={`text-xl font-black uppercase tracking-tight ${
                        auditResult.verdict === 'RED' ? 'text-ruby-500' :
                        auditResult.verdict === 'YELLOW' ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        Decision: {auditResult.verdict === 'RED' ? 'TERMINATE CREDIT' : auditResult.verdict === 'YELLOW' ? 'PROCEED WITH CAUTION' : 'MAXIMUM LIQUIDITY'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-foreground leading-relaxed italic border-l-4 border-primary/20 pl-4 py-2">
                    "{auditResult.analysis}"
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Mission Directives</p>
                  </div>
                  <ul className="space-y-3">
                    {auditResult.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-3 text-sm font-medium">
                        <span className="w-5 h-5 bg-primary/20 text-primary rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col justify-center gap-4">
                  <button 
                    onClick={() => toast.info("Preparing Executive Risk Report...")}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Export Intelligence Pack
                  </button>
                  <p className="text-[9px] text-center font-black uppercase tracking-widest text-muted-foreground/60 px-4">
                    Analytical model updated in real-time based on sector liquidity patterns.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Exposure Card (Reduced col-span to make room for AI button) */}
        <div className="md:col-span-1 glass p-6 rounded-[2.5rem] border border-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <IndianRupee className="w-16 h-16" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Current Exposure</p>
          <div className="flex items-end gap-2">
            <h2 className="text-3xl font-black tracking-tighter">₹{(totalExposure / 100000).toFixed(2)}L</h2>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex-1 mr-4">
              <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${utilization > 90 ? "bg-ruby-500" : utilization > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${utilization}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-black">{Math.round(utilization)}%</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase tracking-tighter">
            Limit: ₹{(limit / 100000).toFixed(1)}L
          </p>
        </div>

        {/* AI Forensic Trigger Card (Premium Row) */}
        <div className="md:col-span-1 glass p-6 rounded-[2.5rem] border-2 border-primary/20 bg-primary/[0.02] relative overflow-hidden group cursor-pointer" onClick={handleRunAiAudit}>
           <div className={`absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
           <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
             <Sparkles className="w-3 h-3" /> Predictive Intel
           </p>
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                {isAuditing ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Cpu className="w-6 h-6 text-white" />}
              </div>
              <div>
                <p className="text-lg font-black tracking-tight leading-none mb-1">Risk Audit</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Execute AI Profile</p>
              </div>
           </div>
           <div className="mt-8 flex items-center justify-between">
             <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Quantum Accuracy: 94%</span>
             <ArrowUpRight className="w-4 h-4 text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
           </div>
        </div>

        {/* Overdue Card */}
        <div className="md:col-span-1 glass p-6 rounded-[2.5rem] border border-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle className="w-16 h-16" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Overdue Balance</p>
          <div className="flex items-end gap-2">
            <h2 className={`text-3xl font-black tracking-tighter ${totalOverdue > 0 ? "text-ruby-500" : "text-emerald-500"}`}>
              ₹{(totalOverdue / 100000).toFixed(2)}L
            </h2>
          </div>
          <div className="mt-6 flex gap-2">
            <span className="px-3 py-1 bg-secondary rounded-lg text-[10px] font-bold">
              {overdueInvoices.length} Overdue Bills
            </span>
          </div>
        </div>

        {/* Risk Card */}
        <div className="md:col-span-1 glass p-6 rounded-[2.5rem] border border-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-16 h-16" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Integrity Score</p>
          {riskLevel === 'unrated' ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-secondary border-border text-muted-foreground">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-tighter text-muted-foreground">Unrated</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${riskColors[riskLevel]}`}>
                {riskLevel === "low" ? <UserCheck className="w-6 h-6" /> :
                 riskLevel === "critical" ? <ShieldAlert className="w-6 h-6 animate-pulse" /> :
                 <ShieldCheck className="w-6 h-6" />}
              </div>
              <p className="text-xl font-black uppercase tracking-tighter">{riskLevel}</p>
            </div>
          )}
          <div className="mt-4 space-y-1">
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  rawScore >= 85 ? "bg-ruby-500" :
                  rawScore >= 60 ? "bg-amber-500" :
                  rawScore >= 30 ? "bg-indigo-500" : "bg-emerald-500"
                }`}
                style={{ width: riskLevel === 'unrated' ? '0%' : `${rawScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xl font-bold tracking-tight">Financial Ledger</h3>
            <span className="px-2 py-0.5 bg-secondary rounded-md text-[10px] font-bold">{invoices.length} entries</span>
          </div>
          <button
            onClick={handleDownloadStatement}
            className="flex items-center gap-2 text-xs font-bold text-primary hover:underline transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download Statement
          </button>
        </div>

        <div className="glass rounded-[2rem] border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Invoice #</th>
                  <th className="text-left px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Due Date</th>
                  <th className="text-right px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                  <th className="text-right px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Balance</th>
                  <th className="text-left px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aging</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-secondary/40 transition-colors group">
                    <td className="px-6 py-4 font-mono text-[10px] font-bold text-primary">{inv.invoice_number}</td>
                    <td className="px-4 py-4 text-xs font-medium">{format(new Date(inv.due_date), "dd MMM yyyy")}</td>
                    <td className="px-4 py-4 text-right font-semibold">₹{(inv.total_amount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-4 text-right font-black">₹{(inv.balance_due || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        inv.status === "paid" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        inv.status === "overdue" ? "bg-ruby-500/10 text-ruby-500 border-ruby-500/20" :
                        "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                      }`}>
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-secondary">
                        {inv.aging_bucket || "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-muted-foreground font-medium italic">
                      No transaction history found for this buyer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-[2rem] p-8 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight">Edit Profile</h2>
              <button onClick={() => setShowEdit(false)} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Company Name *", key: "name", type: "text", placeholder: "Acme Textiles" },
                { label: "Email", key: "email", type: "email", placeholder: "buyer@example.com" },
                { label: "Phone", key: "phone", type: "tel", placeholder: "+91 9876543210" },
                { label: "City", key: "city", type: "text", placeholder: "Mumbai" },
                { label: "GSTIN", key: "gst_number", type: "text", placeholder: "27AABCA1234B1Z5" },
                { label: "Credit Limit (₹)", key: "credit_limit", type: "number", placeholder: "500000" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
                  <input
                    type={type}
                    value={editForm[key as keyof typeof editForm]}
                    onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 bg-secondary/30 border border-border/60 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowEdit(false)} className="flex-1 py-3 glass border border-border/50 rounded-xl text-sm font-bold hover:bg-secondary transition-all">
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving || !editForm.name.trim()}
                className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
