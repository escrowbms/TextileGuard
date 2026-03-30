import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Building2, CreditCard, AlertTriangle, 
  Clock, IndianRupee, ArrowUpRight, ShieldCheck,
  ShieldAlert, History, UserCheck, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { getCustomerById, checkCreditStatus, CreditStatus } from "@/services/customers";
import { getInvoices } from "@/services/invoices";
import { useAuth } from "@/lib/auth-context";
import { getUserByFirebaseUid } from "@/services/user";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);

  useEffect(() => {
    async function fetchData() {
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

        if (custRes.error || !custRes.data) {
          navigate("/dashboard/customers");
          return;
        }

        setCustomer(custRes.data);
        setInvoices(invList);
        setCreditStatus(statusRes);
      } catch (err) {
        console.error("Error fetching customer details:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, user, navigate]);

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
  
  const overdueInvoices = invoices.filter((i: any) => i.status.toLowerCase() === 'overdue');
  const totalOverdue = overdueInvoices.reduce((sum: number, i: any) => sum + (i.balance_due || 0), 0);

  const getRiskLevel = (score: number) => {
    if (score < 30) return "low";
    if (score < 60) return "medium";
    if (score < 85) return "high";
    return "critical";
  };
  const riskLevel = getRiskLevel(customer.risk_score);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/customers" className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-secondary transition-all group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">{customer.name}</h1>
              {creditStatus?.isFrozen ? (
                <div className="flex flex-col gap-1">
                  <span className="px-3 py-1 bg-ruby-500/10 text-ruby-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-ruby-500/30 shadow-sm animate-pulse flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3" />
                    Credit Frozen
                  </span>
                  <p className="text-[10px] text-ruby-500/80 font-medium lowercase italic ml-1">
                    {creditStatus.reason || "Dispatch enforcement active"}
                  </p>
                </div>
              ) : (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-emerald-500/30 shadow-sm flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" />
                  Dispatch Approved
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              GSTIN: <span className="font-mono text-primary uppercase">{customer.gst_number || "N/A"}</span> · 
              Risk Score: <span className="font-bold text-foreground">{customer.risk_score}/100</span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="px-6 py-2.5 glass border border-border/50 rounded-xl text-xs font-bold hover:bg-secondary transition-all">
            Edit Profile
          </button>
          <button className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg ${
            customer.status === 'frozen'
              ? "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600" 
              : "bg-ruby-500 text-white shadow-ruby-500/20 hover:bg-ruby-600"
          }`}>
            {customer.status === 'frozen' ? "Unfreeze Credit" : "Freeze Credit Manually"}
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Exposure Card */}
        <div className="glass p-6 rounded-[2.5rem] border border-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <IndianRupee className="w-20 h-20" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Current Exposure</p>
          <div className="flex items-end gap-2">
            <h2 className="text-4xl font-black tracking-tighter">₹{(totalExposure / 100000).toFixed(2)}L</h2>
            <p className="text-xs text-muted-foreground font-bold mb-1.5 underline decoration-primary/30">Total O/S</p>
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

        {/* Overdue Card */}
        <div className="glass p-6 rounded-[2.5rem] border border-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle className="w-20 h-20" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Overdue Balance</p>
          <div className="flex items-end gap-2">
            <h2 className={`text-4xl font-black tracking-tighter ${totalOverdue > 0 ? "text-ruby-500" : "text-emerald-500"}`}>
              ₹{(totalOverdue / 100000).toFixed(2)}L
            </h2>
          </div>
          <div className="mt-6 flex gap-2">
            <span className="px-3 py-1 bg-secondary rounded-lg text-[10px] font-bold">
              {overdueInvoices.length} Overdue Bills
            </span>
          </div>
        </div>

        {/* Risk Analysis Card */}
        <div className="glass p-6 rounded-[2.5rem] border border-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-20 h-20" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Risk Intelligence</p>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
              riskLevel === 'low' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
              riskLevel === 'medium' ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-500" :
              "bg-ruby-500/10 border-ruby-500/20 text-ruby-500"
            }`}>
              {riskLevel === 'low' ? <UserCheck className="w-8 h-8" /> : 
               riskLevel === 'medium' ? <ShieldCheck className="w-8 h-8" /> : 
               <ShieldAlert className="w-8 h-8 animate-pulse" />}
            </div>
            <div>
              <p className="text-xl font-black uppercase tracking-tighter">{riskLevel}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Calculated Risk Level</p>
            </div>
          </div>
          <div className="mt-6">
            <button className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline transition-all">
              View Detailed Insight →
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-xl font-bold tracking-tight">Financial Ledger</h3>
          </div>
          <button className="text-xs font-bold text-primary hover:underline">Download Statement</button>
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
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-secondary/40 transition-colors group">
                    <td className="px-6 py-4 font-mono text-[10px] font-bold text-primary">{inv.invoice_number}</td>
                    <td className="px-4 py-4 text-xs font-medium">{format(new Date(inv.due_date), "dd MMM yyyy")}</td>
                    <td className="px-4 py-4 text-right font-semibold">₹{(inv.total_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-right font-black">₹{(inv.balance_due || 0).toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        inv.status === 'paid' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        inv.status === 'overdue' ? "bg-ruby-500/10 text-ruby-500 border-ruby-500/20" :
                        "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                      }`}>
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="w-8 h-8 glass rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
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
    </div>
  );
}
