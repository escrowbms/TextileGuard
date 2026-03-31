'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Database, 
  Loader2,
  Table as TableIcon,
  Search,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getUserByFirebaseUid } from '@/services/user';
import { syncErpData, parseTallyXml, parseErpCsv, SyncResult, ErpCustomer, ErpInvoice } from '@/services/erp';
import { toast } from 'sonner';

export default function ImportClient() {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview, 3: Result
  const [xmlContent, setXmlContent] = useState('');
  const [parsedData, setParsedData] = useState<{ customers: ErpCustomer[], invoices: ErpInvoice[] } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setXmlContent(content);
      try {
        let data;
        if (file.name.endsWith('.csv')) {
          data = parseErpCsv(content);
        } else {
          data = parseTallyXml(content);
        }
        
        if (data.customers.length === 0 && data.invoices.length === 0) {
          throw new Error("No valid data found in file");
        }

        setParsedData(data);
        setStep(2);
        toast.success(`Parsed ${data.invoices.length} invoices from ${file.name}`);
      } catch (err: any) {
        toast.error(err.message || "Failed to parse file. Check format.");
      }
    };
    reader.readAsText(file);
  };

  const downloadSampleCsv = () => {
    const headers = "Customer Name,Phone,GST,Invoice #,Invoice Date (YYYY-MM-DD),Amount\n";
    const sample = "Acme Textiles,+919876543210,27AABCA1234B1Z5,INV-001,2025-04-10,50000\nGlobal Fabrics,,27BBCDE5678F2Z1,INV-002,2025-03-15,120000";
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'textileguard_import_sample.csv';
    a.click();
    toast.info("Sample CSV downloaded");
  };

  const startSync = async () => {
    if (!user || !parsedData) return;
    setIsSyncing(true);
    try {
      const profile = await getUserByFirebaseUid(user.uid);
      if (!profile?.companyId) {
        toast.error("Company profile not found");
        return;
      }

      const result = await syncErpData(profile.companyId, parsedData.customers, parsedData.invoices);
      setSyncResult(result);
      setStep(3);
      toast.success("Sync completed successfully");
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">ERP Import Center</h1>
          <p className="text-muted-foreground mt-1">Ingest data from Tally, Busy, or JSON exports</p>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
          <span className={step >= 1 ? 'text-primary' : ''}>Upload</span>
          <ChevronRight className="w-4 h-4" />
          <span className={step >= 2 ? 'text-primary' : ''}>Preview</span>
          <ChevronRight className="w-4 h-4" />
          <span className={step >= 3 ? 'text-primary' : ''}>Sync</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Upload Zone */}
            <div className="glass rounded-3xl p-10 flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 transition-colors group relative overflow-hidden">
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-primary/5">
                 <Upload className="w-10 h-10 text-primary" />
               </div>
               <h3 className="text-xl font-bold mb-2">Upload Tally XML</h3>
               <p className="text-muted-foreground text-center max-w-xs mb-8">
                 Export your 'Ledgers' or 'Vouchers' from Tally and drop the XML file here.
               </p>
               <label className="bg-primary text-white px-8 py-3 rounded-2xl font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                 Select File
                 <input type="file" className="hidden" accept=".xml,.json" onChange={handleFileUpload} />
               </label>
            </div>

            {/* Manual Paste */}
            <div className="glass rounded-3xl p-8 flex flex-col border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold">Paste Raw XML/JSON</h3>
                </div>
                <button 
                  onClick={downloadSampleCsv}
                  className="text-[10px] font-black uppercase text-primary hover:underline"
                >
                  Download Sample CSV
                </button>
              </div>
              <textarea 
                className="flex-1 bg-secondary/50 rounded-2xl p-4 text-sm font-mono border border-border focus:ring-2 ring-primary/20 outline-none resize-none min-h-[200px]"
                placeholder="<ENVELOPE> or CSV: Name,Phone,GST,Inv#,Date,Amount"
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
              />
              <button 
                onClick={() => {
                   try {
                     const data = xmlContent.trim().startsWith('<') ? parseTallyXml(xmlContent) : parseErpCsv(xmlContent);
                     setParsedData(data);
                     setStep(2);
                     toast.success("Content parsed successfully");
                   } catch (err) {
                     toast.error("Invalid format");
                   }
                }}
                disabled={!xmlContent}
                className="mt-4 bg-secondary py-3 rounded-2xl font-bold hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-50"
              >
                Analyze Content
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && parsedData && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Customers Found" value={parsedData.customers.length} icon={Database} />
              <StatCard label="Invoices Found" value={parsedData.invoices.length} icon={FileText} />
              <StatCard label="Detected Source" value="Tally XML" icon={TableIcon} />
              <StatCard label="Sync Mode" value="Upsert" icon={CheckCircle2} />
            </div>

            {/* Preview Tables */}
            <div className="glass rounded-3xl border border-border overflow-hidden">
               <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between">
                 <h3 className="font-bold flex items-center gap-2">
                   <Search className="w-4 h-4 text-primary" />
                   Data Preview
                 </h3>
                 <div className="text-xs font-bold text-muted-foreground">Confirm data before syncing</div>
               </div>
               <div className="max-h-[400px] overflow-y-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
                     <tr>
                       <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Entity</th>
                       <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Voucher #</th>
                       <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Amount</th>
                       <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider text-right">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                     {parsedData.invoices.slice(0, 10).map((inv, i) => (
                       <tr key={i} className="hover:bg-secondary/20 transition-colors">
                         <td className="px-6 py-4 font-bold">{inv.customerName}</td>
                         <td className="px-6 py-4 font-mono text-muted-foreground">{inv.invoiceNumber}</td>
                         <td className="px-6 py-4 font-bold">₹{inv.totalAmount.toLocaleString()}</td>
                         <td className="px-6 py-4 text-right">
                           <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-md text-[10px] uppercase font-black border border-emerald-500/20">Valid</span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {parsedData.invoices.length > 10 && (
                   <div className="p-4 text-center text-xs text-muted-foreground border-t border-border italic">
                     + {parsedData.invoices.length - 10} more records...
                   </div>
                 )}
               </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 bg-secondary py-4 rounded-2xl font-bold hover:bg-border transition-all"
              >
                Go Back
              </button>
              <button 
                onClick={startSync}
                disabled={isSyncing}
                className="flex-[2] bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Syncing Intelligence...
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5" />
                    Finalize Data Sync
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && syncResult && (
          <motion.div
            key="step3"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-xl mx-auto glass rounded-[40px] p-12 flex flex-col items-center text-center shadow-2xl"
          >
            <div className="w-24 h-24 bg-emerald-500/10 rounded-[32px] flex items-center justify-center mb-8 pulse-slow ring-8 ring-emerald-500/5">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-black mb-2 tracking-tight">Sync Complete!</h2>
            <p className="text-muted-foreground mb-10">Your credit intelligence engine has been updated with fresh ERP data.</p>
            
            <div className="grid grid-cols-2 gap-4 w-full mb-10">
               <ResultItem label="Entities Sync" value={syncResult.customersAdded + syncResult.customersUpdated} />
               <ResultItem label="Invoices Sync" value={syncResult.invoicesAdded + syncResult.invoicesUpdated} />
            </div>

            {syncResult.errors.length > 0 && (
              <div className="w-full bg-ruby-500/5 border border-ruby-500/10 rounded-2xl p-4 mb-10 text-left">
                <div className="flex items-center gap-2 text-ruby-500 font-bold text-xs uppercase mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Minor Discrepancies
                </div>
                <div className="text-[11px] text-muted-foreground max-h-24 overflow-y-auto space-y-1">
                  {syncResult.errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: any) {
  return (
    <div className="glass rounded-2xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-black tracking-tight">{value}</div>
    </div>
  );
}

function ResultItem({ label, value }: any) {
  return (
    <div className="bg-secondary/50 rounded-2xl p-4 border border-border">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
      <div className="text-xl font-black text-primary">{value}</div>
    </div>
  );
}
