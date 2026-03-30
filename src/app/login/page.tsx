// ── TextileGuard Authentication Portal ─────────────────────────────────────────
// High-fidelity, industrial-grade login/signup experience inspired by Escrow Bill.
// Features: 3D Animated Backgrounds, Feature Grid, and Secure Form UI.

'use client';

import { useState, useEffect } from 'react';
import {
  signInWithPopup, GoogleAuthProvider,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, ArrowRight, Building2, CheckCircle2,
  AlertCircle, Eye, EyeOff, Mail, BarChart3, Clock,
  TrendingDown, Zap, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { syncUserOnLogin, createCompany } from '@/services/user';
import { cn } from '@/lib/utils';
import { SLIDES, STATIC_DETAILS, AnimatedBackground } from '@/components/IndustrialShield';



// ── Left Panel Slider ─────────────────────────────────────────────────────────
function LeftPanel({ current }: { current: number }) {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, rotateY: 45, scale: 1.1, z: -100 }}
          animate={{ opacity: 1, rotateY: 0, scale: 1, z: 0 }}
          exit={{ opacity: 0, rotateY: -45, scale: 0.9, z: -100 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          <AnimatedBackground type={SLIDES[current].animation} />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 w-full h-full flex flex-col items-center lg:items-start justify-center p-16 xl:p-24">
        <div className="max-w-xl space-y-12">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40">
                <Shield className="text-white w-6 h-6" />
             </div>
             <div>
                <span className="font-black text-2xl tracking-tighter block leading-none text-white">TextileGuard</span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black">Professional Industrial Shield</span>
             </div>
          </div>

          <div className="space-y-6">
            <motion.h2 
              key={`h2-${current}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-black text-white leading-[0.9] tracking-tight text-balance"
            >
              {STATIC_DETAILS.title}
            </motion.h2>
            <motion.p 
              key={`p-${current}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-300 font-bold leading-relaxed max-w-lg"
            >
              {STATIC_DETAILS.description}
            </motion.p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4">
            {STATIC_DETAILS.features.map((feature, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
                className="flex items-start gap-4 bg-white/5 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 group hover:bg-white/10 transition-all hover:translate-y-[-4px]"
              >
                <div className="bg-primary/20 p-2.5 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-black text-slate-100 text-sm tracking-tight">{feature.title}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-bold">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-16 left-16 flex gap-3">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 transition-all duration-500 rounded-full ${
                current === i ? 'w-12 bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const friendlyError = (code?: string): string => {
  const map: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'Email already registered. Sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
    'auth/invalid-credential': 'Email or password is incorrect.',
  };
  return map[code ?? ''] ?? 'Something went wrong. Please try again.';
};

type AuthMode = 'signin' | 'signup';
type Step = 'auth' | 'onboarding' | 'done';
interface FbUser { uid: string; email: string | null; displayName: string | null; }

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [step, setStep] = useState<Step>('auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [gst, setGst] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrent(p => (p + 1) % SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const clearError = () => setError('');

  const handlePostAuth = async (user: FbUser) => {
    const sync = await syncUserOnLogin(user.uid, user.email ?? '');
    if (sync.status === 'existing') { navigate('/dashboard'); return; }
    if (sync.status === 'new_user') { setFbUser(user); setStep('onboarding'); return; }
    // @ts-ignore
    setError(sync.message || 'Verification failed');
  };

  const handleGoogle = async () => {
    setLoading(true); clearError();
    try {
      const gProvider = new GoogleAuthProvider();
      const r = await signInWithPopup(auth, gProvider);
      await handlePostAuth({ uid: r.user.uid, email: r.user.email, displayName: r.user.displayName });
    } catch (e: any) { setError(friendlyError(e?.code)); }
    finally { setLoading(false); }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true); clearError();
    try {
      if (mode === 'signin') {
        const r = await signInWithEmailAndPassword(auth, email, password);
        await handlePostAuth({ uid: r.user.uid, email: r.user.email, displayName: r.user.displayName });
      } else {
        if (!name.trim()) { setError('Full name is required.'); setLoading(false); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters.'); setLoading(false); return; }
        const r = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(r.user, { displayName: name.trim() });
        await handlePostAuth({ uid: r.user.uid, email: r.user.email, displayName: name.trim() });
      }
    } catch (e: any) { setError(friendlyError(e?.code)); }
    finally { setLoading(false); }
  };

  const handleCreateCompany = async () => {
    if (!fbUser || !companyName.trim()) return;
    setLoading(true); clearError();
    const result = await createCompany(fbUser.uid, fbUser.email ?? '', companyName.trim(), gst.trim() || undefined);
    if ('error' in result) { setError(result.error); setLoading(false); return; }
    setStep('done');
    setTimeout(() => navigate('/dashboard'), 1400);
  };

  return (
    <div className="min-h-screen flex bg-background selection:bg-primary selection:text-white">
      {/* LEFT PANEL */}
      <LeftPanel current={current} />

      {/* RIGHT PANEL */}
      <div className="flex-1 lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-y-auto">
        <div className="absolute top-8 right-8">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">

            {/* AUTH */}
            {step === 'auth' && (
              <motion.div key="auth" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: 10 }}>
                {/* Mobile logo */}
                <div className="flex lg:hidden items-center gap-2 mb-10">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <Shield className="text-white w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-xl tracking-tight">TextileGuard</span>
                </div>

                <h1 className="text-3xl font-black tracking-tighter mb-2">
                  {mode === 'signin' ? 'Welcome back' : 'Start for free'}
                </h1>
                <p className="text-sm text-muted-foreground font-medium mb-8">
                  {mode === 'signin' ? "Your financial discipline dashboard awaits." : "Automate your credit control today."}
                </p>

                {/* Tab toggle */}
                <div className="flex p-1.5 bg-secondary/50 border border-border/50 rounded-2xl mb-8">
                  {(['signin', 'signup'] as AuthMode[]).map(m => (
                    <button key={m} onClick={() => { setMode(m); clearError(); }}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${mode === m ? 'bg-background shadow-lg text-foreground border border-border/20' : 'text-muted-foreground hover:text-foreground'}`}>
                      {m === 'signin' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6 p-4 bg-ruby-500/10 border border-ruby-500/20 rounded-2xl flex items-start gap-3 text-ruby-500 text-xs font-bold shadow-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                  </motion.div>
                )}

                {/* Google */}
                <button onClick={handleGoogle} disabled={loading}
                  className="w-full py-3.5 glass border border-border/60 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 hover:bg-secondary active:scale-95 disabled:opacity-50 mb-6 group">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    : <><img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all" alt="" /> Continue with Google</>
                  }
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">or email</span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <AnimatePresence>
                    {mode === 'signup' && (
                      <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5 ml-1">Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Rajesh Sharma" autoComplete="name"
                          className="w-full px-4 py-3.5 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/40" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5 ml-1">Business Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" autoComplete="email"
                        className="w-full pl-11 pr-4 py-3.5 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/40" required />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5 ml-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Password</label>
                      {mode === 'signin' && (
                        <button type="button" className="text-[10px] text-primary hover:text-primary/80 font-black uppercase tracking-widest transition-colors">Forgot?</button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                        autoComplete={mode === 'signin' ? "current-password" : "new-password"}
                        className="w-full pl-11 pr-11 py-3.5 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/40" required />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {mode === 'signup' && password && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex gap-1 h-1.5">
                          <div className={cn("flex-1 rounded-full transition-colors", password.length >= 8 ? "bg-emerald-500" : "bg-muted")} />
                          <div className={cn("flex-1 rounded-full transition-colors", /[A-Z]/.test(password) ? "bg-emerald-500" : "bg-muted")} />
                          <div className={cn("flex-1 rounded-full transition-colors", /[0-9]/.test(password) ? "bg-emerald-500" : "bg-muted")} />
                          <div className={cn("flex-1 rounded-full transition-colors", /[^A-Za-z0-9]/.test(password) ? "bg-emerald-500" : "bg-muted")} />
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          <span>Security Strength</span>
                          <span className={cn(
                            password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? "text-emerald-500" : "text-amber-500"
                          )}>
                             {password.length < 8 ? "Weak" : (/[A-Z]/.test(password) && /[0-9]/.test(password) ? "Strong" : "Medium")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={loading || !email || !password}
                    className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-primary/25 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <>{mode === 'signin' ? 'Sign In Securely' : 'Create My Account'} <ArrowRight className="w-4 h-4" /></>
                    }
                  </button>
                </form>

                <p className="text-center text-[11px] font-bold text-muted-foreground mt-8">
                  {mode === 'signin' ? "New to the platform?" : "Joined us before?"}
                  {' '}
                  <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); clearError(); }} className="text-primary font-black uppercase tracking-wider hover:underline underline-offset-4">
                    {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </motion.div>
            )}

            {/* ONBOARDING */}
            {step === 'onboarding' && (
              <motion.div key="onboarding" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="w-16 h-16 bg-emerald-500 shadow-xl shadow-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tighter mb-2">Final Step, {fbUser?.displayName?.split(' ')[0]}</h2>
                  <p className="text-sm text-muted-foreground font-medium">Verify your business identity to launch.</p>
                </div>

                {error && (
                  <div className="p-4 bg-ruby-500/10 border border-ruby-500/20 rounded-2xl flex items-center gap-3 text-ruby-500 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5 ml-1">Company Name *</label>
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Acme Textiles Ltd."
                      className="w-full px-5 py-3.5 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/30" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5 ml-1">Tax ID / GSTIN <span className="font-normal text-muted-foreground/40">(optional)</span></label>
                    <input type="text" value={gst} onChange={e => setGst(e.target.value)} placeholder="24AABCA1234B1Z5"
                      className="w-full px-5 py-3.5 bg-secondary/30 border border-border/60 rounded-2xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/30" />
                  </div>
                </div>

                <button onClick={handleCreateCompany} disabled={loading || !companyName.trim()}
                  className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-primary/25 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <>Initialize Dashboard <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </motion.div>
            )}

            {/* DONE */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}
                  className="w-20 h-20 bg-emerald-500/10 border-4 border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </motion.div>
                <h2 className="text-3xl font-black tracking-tighter mb-2">Welcome Aboard</h2>
                <p className="text-muted-foreground text-sm font-medium">Securing your financial perimeter…</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <p className="absolute bottom-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
          © 2025 TextileGuard · <a href="/" className="hover:text-primary transition-colors">Privacy</a> · <a href="/" className="hover:text-primary transition-colors">Legal</a>
        </p>
      </div>
    </div>
  );
}
