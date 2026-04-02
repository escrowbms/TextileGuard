'use client';

import AuthGuard from "@/components/AuthGuard";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BottomNav } from "@/components/BottomNav";
import { LayoutDashboard, Users, FileText, Settings, LogOut, Bell, ShieldCheck, MessageSquare, TrendingUp, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserByFirebaseUid } from "@/services/user";
import { supabase } from "@/lib/supabase";
import { getAuth, signOut } from "firebase/auth";
import { toast } from "sonner";

export default function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('Your Company');
  const [userInitials, setUserInitials] = useState('ME');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  const SUPER_ADMINS = ['thakur.ashish@escrowpay.com', 'admin@textileguard.com'];
  const isSuperAdmin = user && SUPER_ADMINS.includes(user.email || '');

  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'New Escalation', message: 'Customer "Textile Corp" reached Level 2 escalation.', time: '2 mins ago', type: 'error', read: false },
    { id: 'n2', title: 'Payment Reminder', message: 'Invoice #4521 is due in 3 days.', time: '1 hour ago', type: 'warning', read: false },
    { id: 'n3', title: 'System Synced', message: 'Successfully synced 124 invoices from ERP.', time: '5 hours ago', type: 'success', read: true },
  ]);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsProfileOpen(false);
    }
    if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
      setIsNotificationsOpen(false);
    }
  };

  useEffect(() => {
    if (isProfileOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen, isNotificationsOpen]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch actual escalations for notifications
    const fetchEscalations = async () => {
      try {
        const appUser = await getUserByFirebaseUid(user.uid);
        if (!appUser?.companyId) return;

        const { data: escalations, error } = await supabase
          .from('escalations')
          .select('id, level, triggered_at, status, customers(name)')
          .eq('company_id', appUser.companyId)
          .eq('status', 'pending')
          .order('triggered_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        if (escalations) {
          const mapped = escalations.map(e => ({
            id: e.id,
            title: `Level ${e.level} Escalation`,
            message: `${(e.customers as any)?.name} triggered a high-risk alert.`,
            time: new Date(e.triggered_at).toLocaleDateString(),
            type: e.level === '3' ? 'error' : 'warning',
            read: false
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    
    fetchEscalations();
    
    // Subscribe to new escalations
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'escalations' },
        () => fetchEscalations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllRead = async () => {
    try {
      const appUser = await getUserByFirebaseUid(user!.uid);
      if (!appUser?.companyId) return;

      const { error } = await supabase
        .from('escalations')
        .update({ status: 'resolved' })
        .eq('company_id', appUser.companyId)
        .eq('status', 'pending');

      if (error) throw error;
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch (err) {
      toast.error('Failed to clear notifications');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    // Derive initials from displayName or email
    const name = user.displayName || user.email || '';
    const parts = name.split(/[\s@.]+/).filter(Boolean);
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
    setUserInitials(initials);

    getUserByFirebaseUid(user.uid).then(async (appUser) => {
      if (!appUser?.companyId) return;
      const { data } = await supabase
        .from('companies')
        .select('name')
        .eq('id', appUser.companyId)
        .single();
      if (data?.name) setCompanyName(data.name);
    });
  }, [user]);

  const navItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Customers", icon: Users, href: "/dashboard/customers" },
    { name: "Invoices", icon: FileText, href: "/dashboard/invoices" },
    { name: "Reminders", icon: MessageSquare, href: "/dashboard/reminders" },
    { name: "Interest", icon: TrendingUp, href: "/dashboard/interest" },
    { name: "Escalations", icon: Bell, href: "/dashboard/escalations" },
    { name: "Settings", icon: Settings, href: "/dashboard/settings" },
  ];

  const getPageTitle = (path: string): string => {
    if (path === '/dashboard') return 'Dashboard';
    if (/^\/dashboard\/customers\/[0-9a-f-]{36}$/.test(path)) return 'Customer Detail';
    const segment = path.split('/').pop() || '';
    const map: Record<string, string> = {
      customers: 'Customers', invoices: 'Invoices', reminders: 'Reminders',
      interest: 'Interest Recovery', escalations: 'Escalations',
      settings: 'Settings', import: 'Import Data',
    };
    return map[segment] ?? (segment.charAt(0).toUpperCase() + segment.slice(1));
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldCheck className="text-white w-6 h-6" />
        </div>
        <span className="font-bold text-xl tracking-tight">Textile Guard</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            to={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
              pathname === item.href 
                ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-border space-y-4">
        <div className="flex items-center justify-between px-4">
            <span className="text-sm text-muted-foreground font-medium">Theme</span>
            <ThemeToggle />
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive transition-colors w-full rounded-2xl hover:bg-destructive/5">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <AuthProvider>
      <AuthGuard>
        <div className="flex min-h-screen bg-background text-foreground">
          {/* Desktop Sidebar */}
          <aside className="w-64 glass border-r border-border p-5 hidden lg:flex flex-col sticky top-0 h-screen">
            <SidebarContent />
          </aside>

          {/* Mobile Header (Fixed Top) */}
          <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background/80 backdrop-blur-xl border-b border-border z-40 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <ShieldCheck className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-tight">TextileGuard</span>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center font-bold text-[9px] text-primary border border-primary/20">
                {userInitials}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6 max-w-[1600px] mx-auto w-full pt-18 lg:pt-6 pb-28 lg:pb-6">
            <header className="flex justify-between items-center mb-4 lg:mb-8">
              <div>
                <h1 className="text-xl lg:text-3xl font-extrabold tracking-tight">
                  {getPageTitle(pathname)}
                </h1>
                <p className="text-muted-foreground text-[10px] lg:text-base font-medium mt-1">
                  Enforcement active for <span className="text-foreground">{companyName}</span>
                </p>
              </div>
 
              <div className="hidden lg:flex items-center gap-3">
                <ThemeToggle />
                
                <div className="relative" ref={notificationsRef}>
                  <button 
                    title="Notifications" 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`w-11 h-11 glass rounded-2xl flex items-center justify-center relative hover:scale-105 transition-transform ${isNotificationsOpen ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}
                  >
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {notifications.some(n => !n.read) && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-ruby-500 rounded-full border-2 border-background animate-pulse" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-14 right-0 w-80 glass border border-border rounded-[2rem] p-4 shadow-2xl z-50"
                      >
                        <div className="flex items-center justify-between mb-4 px-2">
                          <h3 className="font-bold text-lg">Notifications</h3>
                          <button 
                            onClick={markAllRead}
                            className="text-[10px] text-primary font-bold uppercase tracking-wider hover:opacity-70 transition-opacity"
                          >
                            Mark all read
                          </button>
                        </div>
                        
                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                          {notifications.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground italic text-sm">
                              No new notifications
                            </div>
                          ) : notifications.map(n => (
                            <div 
                              key={n.id} 
                              className={`p-3 rounded-2xl border transition-all cursor-pointer group ${n.read ? 'bg-transparent border-transparent opacity-60' : 'bg-primary/5 border-primary/10 shadow-sm hover:bg-primary/10'}`}
                            >
                               <div className="flex gap-3">
                                 <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                   n.type === 'error' ? 'bg-ruby-500/10 text-ruby-500' :
                                   n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                                   'bg-emerald-500/10 text-emerald-500'
                                 }`}>
                                   {n.type === 'error' ? <Bell className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <p className="font-bold text-xs truncate">{n.title}</p>
                                   <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                                   <p className="text-[9px] text-muted-foreground/50 mt-1.5 font-medium">{n.time}</p>
                                 </div>
                               </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-border/50 text-center">
                          <Link 
                            to="/dashboard/escalations" 
                            onClick={() => setIsNotificationsOpen(false)} 
                            className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                          >
                            View Efficiency Report
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="relative" ref={dropdownRef}>
                  <div 
                    onClick={() => setIsProfileOpen(!isProfileOpen)} 
                    className={`w-11 h-11 bg-primary border border-primary/20 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 cursor-pointer hover:scale-105 transition-transform ${isProfileOpen ? 'scale-105 ring-2 ring-primary/20' : ''}`} 
                  >
                    {userInitials}
                  </div>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-14 right-0 w-48 glass border border-border rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
                      >
                        <Link 
                          to="/dashboard/settings" 
                          onClick={() => setIsProfileOpen(false)} 
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/10 hover:text-primary rounded-xl transition-all font-medium group"
                        >
                          <UserIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          Profile
                        </Link>
                        {isSuperAdmin && (
                          <Link 
                            to="/admin" 
                            onClick={() => setIsProfileOpen(false)} 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-500/10 hover:text-amber-500 rounded-xl transition-all font-medium group"
                          >
                            <ShieldCheck className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                            Admin Matrix
                          </Link>
                        )}
                        <button 
                          onClick={() => { setIsProfileOpen(false); handleLogout(); }} 
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-destructive/10 text-destructive rounded-xl transition-all font-medium w-full text-left mt-1 overflow-hidden"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </header>
 
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Outlet />
              {children}
            </motion.div>
          </main>
 
          {/* Mobile Bottom Nav */}
          <BottomNav />
        </div>
      </AuthGuard>
    </AuthProvider>
  );
}
