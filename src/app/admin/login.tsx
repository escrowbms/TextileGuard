'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/lib/admin-auth-context';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, RefreshCw, Key, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    
    // Quick aesthetic delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const success = await login(password);
    if (success) {
      toast.success('Clearance Verified.');
      navigate('/admin');
    } else {
      toast.error('ACCESS REJECTED.');
      setPassword('');
    }
    setLoading(false);
  };

  if (!mounted) return null;

  const fontStyle = { fontFamily: '"Times New Roman", Times, serif' };

  return (
    <div className="h-screen w-screen relative flex items-center justify-center bg-white dark:bg-black overflow-hidden p-4" style={fontStyle}>
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} 
      />
      
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-3xl shadow-xl overflow-hidden p-8 md:p-10 space-y-10">
          
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-black dark:bg-white rounded-full border-4 border-black dark:border-white shadow-lg">
              <ShieldAlert className="w-8 h-8 text-white dark:text-black" />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tight text-black dark:text-white uppercase leading-none">
                SuperAdmin
              </h1>
              <h2 className="text-2xl font-normal italic text-primary dark:text-primary tracking-[0.2em] uppercase">
                Clearance
              </h2>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[12px] font-black uppercase text-black dark:text-white tracking-[0.1em]">Key Required</label>
                <div className="flex items-center gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-white dark:border-black" />
                   <span className="text-[10px] font-black text-black dark:text-white tracking-widest uppercase">Secured</span>
                </div>
              </div>
              
              <div className="relative group">
                <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-black dark:text-white pointer-events-none transition-opacity" />
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="ENC_INPUT"
                  className={cn(
                    "w-full pl-12 pr-6 py-4 bg-transparent border-2 border-black dark:border-white rounded-2xl",
                    "text-xl font-bold tracking-[0.5em] focus:outline-none focus:bg-slate-50 dark:focus:bg-white/5",
                    "transition-all text-black dark:text-white",
                    "placeholder:text-black/10 dark:placeholder:text-white/10 placeholder:tracking-normal placeholder:font-normal uppercase placeholder:text-xs"
                  )}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !password}
              className={cn(
                "w-full h-16 bg-black dark:bg-white text-white dark:text-black",
                "font-black text-sm uppercase tracking-[0.4em] rounded-2xl",
                "hover:translate-y-[-1px] active:scale-[0.98] transition-all",
                "disabled:opacity-30 border-2 border-transparent"
              )}
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center justify-center gap-3">
                  INITIALIZE SESSION
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          </form>

          <footer className="pt-2 border-t-2 border-black/5 dark:border-white/5">
            <div className="flex items-center justify-between text-[10px] font-black tracking-[0.3em] text-black dark:text-white uppercase transition-none">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4" />
                <span>Secured Uplink</span>
              </div>
              <span>Matrix v4.2</span>
            </div>
          </footer>
        </div>

        {/* Minimal tactical footer */}
        <div className="mt-8 text-center text-[11px] font-black tracking-[0.6em] text-black dark:text-white uppercase">
           TX-GUARD ADMIN PORTAL
        </div>
      </motion.div>
    </div>
  );
}
