import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ArrowRight, BarChart3, Lock, Mail,
  CheckCircle2, Globe, Zap, Cpu, Activity,
  ChevronRight, Building2, Users, Menu, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatedBackground, STATIC_DETAILS } from '@/components/IndustrialShield';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white overflow-x-hidden">
      {/* ── Navbar ────────────────────────────────────────────────────────────── */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-[60] transition-all duration-500 border-b",
        scrolled || mobileMenuOpen
          ? "py-4 bg-background/80 backdrop-blur-xl border-border"
          : "py-6 bg-transparent border-transparent"
      )}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Shield className="text-white w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tighter block leading-none text-foreground">TextileGuard</span>
              <span className="text-[8px] uppercase tracking-[0.3em] text-primary/60 font-black">Industrial Shield</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Enterprise</a>
            <div className="w-px h-4 bg-border" />
            <ThemeToggle />
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 border border-border rounded-xl text-sm font-bold transition-all hover:translate-y-[-2px] active:scale-95 text-foreground"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/login?mode=signup')}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:translate-y-[-2px] active:scale-95"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background border-t border-border overflow-hidden"
            >
              <div className="p-6 space-y-6">
                <div className="flex flex-col gap-4">
                  <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-foreground">Features</a>
                  <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-foreground">Enterprise</a>
                </div>
                <div className="h-px bg-border" />
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                    className="w-full py-4 bg-secondary border border-border rounded-xl text-foreground font-bold"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { navigate('/login?mode=signup'); setMobileMenuOpen(false); }}
                    className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <AnimatedBackground type="intelligence" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                v2.0 Deploying Real-time Risk Engine
              </div>

              <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] md:leading-[0.85] mb-8 text-balance">
                Absolute Control <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-emerald-400">
                  Over Your Liquidity.
                </span>
              </h1>

              <p className="text-lg md:text-2xl text-muted-foreground font-bold leading-relaxed max-w-2xl mb-12">
                {STATIC_DETAILS.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                <button
                  onClick={() => navigate('/login')}
                  className="group w-full sm:w-auto justify-center px-8 py-5 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all hover:translate-y-[-4px] active:scale-95"
                >
                  Launch Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="w-full sm:w-auto px-8 py-5 bg-secondary/50 backdrop-blur-xl border border-border rounded-2xl font-black text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary transition-all hover:translate-y-[-4px] active:scale-95">
                  View Case Studies
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Floating Credit Cards Mockup (Animated) */}
        <div className="hidden xl:block absolute top-1/2 right-[-10%] -translate-y-1/2 w-[50%] h-[800px] pointer-events-none">
          <motion.div
            initial={{ opacity: 0, x: 100, rotate: 20 }}
            animate={{ opacity: 1, x: 0, rotate: -15 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative w-full h-full"
          >
            {/* Main Card */}
            <div className="absolute top-[10%] left-[10%] w-[500px] h-[300px] bg-gradient-to-br from-background to-secondary border border-border rounded-[2.5rem] shadow-2xl backdrop-blur-2xl p-10 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 blur-[80px] rounded-full" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/40">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Index</p>
                    <p className="text-4xl font-black text-emerald-400">98.4</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 mb-1">TextileGuard Platinum</p>
                  <p className="text-xl font-black text-white tracking-widest">4829 •••• •••• 9201</p>
                </div>
              </div>
            </div>

            {/* Secondary Card (Overdue) */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[45%] left-[25%] w-[450px] h-[280px] bg-slate-950/60 border border-ruby-500/30 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl p-10"
            >
              <div className="flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-ruby-500 rounded-2xl shadow-lg shadow-ruby-500/40">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-ruby-400 uppercase tracking-widest">Enforcement</p>
                    <p className="text-2xl font-black text-ruby-500">BLOCKED</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 mb-1">Overdue Days</p>
                  <p className="text-3xl font-black text-white tracking-tighter">114 Days Clear</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Section ─────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-background relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 sm:gap-8">
            {[
              { val: "₹1,240Cr+", label: "Capital Protected" },
              { val: "14.2 Days", label: "Avg. DSO Improvement" },
              { val: "3,200+", label: "Textile Mills Active" },
              { val: "99.9%", label: "System Uptime" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center sm:text-left md:text-center p-6 bg-white/[0.02] border border-white/5 rounded-3xl md:bg-transparent md:border-0 md:p-0"
              >
                <h3 className="text-4xl md:text-5xl font-black text-foreground mb-2 tracking-tighter">{stat.val}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────────────────────────── */}
      <section id="features" className="py-32 bg-muted/30 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-24">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">Built for the Heavy Industry.</h2>
            <p className="text-xl text-muted-foreground font-bold leading-relaxed">
              We don't just track invoices. We enforce payment discipline using systematic algorithms designed specifically for the complex textile supply chain.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STATIC_DETAILS.features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 hover:border-primary/30 transition-all hover:translate-y-[-8px] cursor-default"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary transition-all">
                  <feature.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-black text-foreground mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-sm font-bold text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Visual Proof Section ─────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-tight">
              Real-time Awareness. <br />
              Zero Human Error.
            </h2>
            <div className="space-y-8">
              {[
                { icon: Zap, title: "Automated Escalations", desc: "System auto-generates legal notices and WhatsApp alerts when bills remain unpaid beyond the grace period." },
                { icon: Activity, title: "Heatmapping", desc: "Identify which cities, agents, or buyer groups carry the highest risk profile for your business." },
                { icon: Cpu, title: "ERP Integration", desc: "Seamlessly syncs with your existing billing software to pull data and push blocks automatically." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="shrink-0 w-12 h-12 bg-secondary border border-border rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-foreground mb-2 tracking-tight">{item.title}</h4>
                    <p className="text-sm font-bold text-muted-foreground max-w-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="relative p-1 bg-gradient-to-br from-primary/50 to-blue-500/50 rounded-[3rem] shadow-2xl"
            >
              <div className="bg-slate-950 rounded-[2.9rem] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&q=80&w=1200"
                  alt="Industrial Dashboard"
                  className="w-full h-full object-cover mix-blend-luminosity opacity-50 hover:mix-blend-normal hover:opacity-100 transition-all duration-700 hover:scale-105"
                />
              </div>

              {/* Floating Overlay Info */}
              <div className="absolute -bottom-10 -right-10 p-8 glass border border-white/20 rounded-3xl shadow-2xl max-w-[280px]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operational Pulse</span>
                </div>
                <p className="text-xs font-bold text-muted-foreground leading-relaxed font-mono">
                  Current Market Risk: <span className="text-emerald-400 font-black">LOW</span> <br />
                  System Integrity: <span className="text-emerald-400 font-black">OPTIMAL</span> <br />
                  Last Scan: 2 mins ago
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-40 relative z-10">
        <div className="container mx-auto px-6">
          <div className="relative p-8 sm:p-12 md:p-24 bg-gradient-to-br from-primary to-blue-600 rounded-[3rem] md:rounded-[4rem] text-center overflow-hidden shadow-2xl shadow-primary/30 group">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-[100px] group-hover:scale-110 transition-transform duration-1000" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-[1] md:leading-[0.9]">
                Stop chasing payments. <br />
                Start building empires.
              </h2>
              <p className="text-xl md:text-2xl text-blue-100 font-bold mb-12 opaciy-90">
                Join 3,000+ businesses who have eliminated payment uncertainty from their operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => navigate('/login?mode=signup')}
                  className="px-12 py-6 bg-white text-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl"
                >
                  Create Your Free Account
                </button>
                <button className="px-12 py-6 bg-primary/20 backdrop-blur-xl border border-white/20 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                  Talk to a Specialist <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="py-20 border-t border-border bg-background relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Shield className="text-white w-5 h-5" />
                </div>
                <span className="font-black text-xl tracking-tighter text-foreground">TextileGuard</span>
              </div>
              <p className="text-sm font-bold text-muted-foreground max-w-sm leading-relaxed">
                The definitive credit control platform for the modern textile manufacturing sector. Protecting liquidity through systematic discipline.
              </p>
              <div className="flex gap-4">
                {['Twitter', 'LinkedIn', 'Instagram'].map(social => (
                  <a key={social} href="#" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-primary transition-all">
                    <span className="sr-only">{social}</span>
                    <Globe className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="text-[10px] font-black uppercase tracking-widest text-white mb-6">Platform</h5>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><a href="#" className="hover:text-primary transition-colors">Risk Intelligence</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Automated Ledgers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Legal Enforcement</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Enterprise API</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-[10px] font-black uppercase tracking-widest text-white mb-6">Company</h5>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Case Studies</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security Audit</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-white/5 gap-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
              © 2025 TextileGuard Professional Systems. All Rights Reserved.
            </p>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-600">
              <a href="#" className="hover:text-white transition-colors">System Status: Normal</a>
              <a href="#" className="hover:text-white transition-colors">Certifications: ISO 27001</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
