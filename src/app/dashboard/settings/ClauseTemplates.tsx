'use client';

import { useState, useEffect } from "react";
import { 
  FileText, Plus, Trash2, Edit3, Save, X, 
  Scale, AlertCircle, Info, ChevronRight, CheckCircle2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getClauses, createClause, updateClause, deleteClause, Clause } from "@/services/clauses";
import { toast } from "sonner";

export function ClauseTemplates({ companyId }: { companyId: string }) {
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    title: '',
    content: '',
    category: 'general'
  });

  useEffect(() => {
    loadClauses();
  }, [companyId]);

  async function loadClauses() {
    try {
      const data = await getClauses(companyId);
      setClauses(data);
    } catch (err) {
      toast.error("Failed to load clauses");
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Title and Content are mandatory");
      return;
    }

    try {
      if (editingId) {
        await updateClause(editingId, formData);
        toast.success("Clause updated");
      } else {
        await createClause({ ...formData, company_id: companyId });
        toast.success("New clause strictly enforced");
      }
      resetForm();
      loadClauses();
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this clause? This might weaken future documentation.")) return;
    try {
      await deleteClause(id);
      toast.success("Clause removed");
      loadClauses();
    } catch (err) {
      toast.error("Failed to delete clause");
    }
  };

  const startEdit = (clause: Clause) => {
    setEditingId(clause.id);
    setFormData({
      title: clause.title,
      content: clause.content,
      category: clause.category
    });
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ title: '', content: '', category: 'general' });
  };

  if (loading) return <div className="animate-pulse h-48 bg-secondary/20 rounded-3xl" />;

  return (
    <section className="glass rounded-[32px] p-8 border border-border bg-gradient-to-br from-background to-secondary/20 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Scale className="w-32 h-32 rotate-12" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-ruby-500/10 rounded-2xl flex items-center justify-center text-ruby-500">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold italic">Legal Clause Library</h2>
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mt-1">Invoice Strengthening Module</p>
          </div>
        </div>

        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            New Clause Template
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 bg-secondary/30 p-6 rounded-3xl border border-border relative z-10"
          >
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Clause Title</label>
                <input 
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 ring-primary/20 transition-all outline-none"
                  placeholder="e.g., Late Payment Interest"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Category</label>
                <select 
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold focus:ring-2 ring-primary/20 transition-all outline-none"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="interest">Interest Policy</option>
                  <option value="jurisdiction">Legal Jurisdiction</option>
                  <option value="dispute">Dispute Limitation</option>
                  <option value="general">General Terms</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Legal Content</label>
              <textarea 
                className="w-full bg-background border border-border rounded-xl px-4 py-3 font-medium min-h-[120px] focus:ring-2 ring-primary/20 transition-all outline-none text-sm"
                placeholder="The formal legal language that will appear on the invoice..."
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={resetForm} className="px-6 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-secondary transition-all">Cancel</button>
              <button 
                onClick={handleSave}
                className="bg-primary text-white px-8 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Save className="w-4 h-4" />
                {editingId ? "Update Clause" : "Seal Clause"}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4 relative z-10">
            {clauses.length === 0 ? (
              <div className="py-20 text-center glass border border-dashed border-border rounded-3xl">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-sm font-bold text-muted-foreground">No clauses defined. Your invoices may be legally weak.</p>
                <button onClick={() => setIsAdding(true)} className="mt-4 text-xs text-primary font-black uppercase tracking-widest hover:underline">Add First Clause now</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clauses.map((clause) => (
                  <div key={clause.id} className="glass p-5 rounded-3xl border border-border group hover:border-primary/40 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
                          {clause.category}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(clause)} className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-all">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(clause.id)} className="p-2 hover:bg-ruby-500/10 rounded-lg text-muted-foreground hover:text-ruby-500 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-bold text-sm mb-2">{clause.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed italic">&quot;{clause.content}&quot;</p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
                        <CheckCircle2 className="w-3 h-3" />
                        ACTIVE FOR INVOICES
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AnimatePresence>

      <div className="mt-8 flex gap-3 p-4 bg-primary/5 border border-primary/10 rounded-2xl relative z-10">
        <Info className="w-5 h-5 text-primary flex-shrink-0" />
        <p className="text-[11px] leading-relaxed italic text-muted-foreground">
          **Industrial Truth:** These clauses allow you to legally charge the 18% penal interest you see in the dashboard. Without standardized jurisdiction and interest clauses, your recovery claims might be rejected in commercial disputes.
        </p>
      </div>
    </section>
  );
}
