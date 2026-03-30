'use client';

import AuthGuard from "@/components/AuthGuard";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BottomNav } from "@/components/BottomNav";
import { LayoutDashboard, Users, FileText, Settings, LogOut, Bell, ShieldCheck, Search, Plus, MessageSquare, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserByFirebaseUid } from "@/services/user";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('Your Company');

  useEffect(() => {
    if (!user) return;
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
        <button className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive transition-colors w-full rounded-2xl hover:bg-destructive/5">
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
          <aside className="w-72 glass border-r border-border p-6 hidden lg:flex flex-col sticky top-0 h-screen">
            <SidebarContent />
          </aside>

          {/* Mobile Header (Fixed Top) */}
          <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border z-40 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ShieldCheck className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-base tracking-tight">TextileGuard</span>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center font-bold text-[10px] text-primary border border-primary/20">
                JD
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-10 max-w-7xl mx-auto w-full pt-20 lg:pt-10 pb-32 lg:pb-10">
            <header className="flex justify-between items-center mb-6 lg:mb-12">
              <div>
                <h1 className="text-xl lg:text-3xl font-extrabold tracking-tight capitalize">
                  {pathname === "/dashboard" ? "Dashboard" : pathname.split("/").pop()}
                </h1>
                <p className="text-muted-foreground text-[10px] lg:text-base font-medium mt-1">
                  Enforcement active for <span className="text-foreground">{companyName}</span>
                </p>
              </div>
 
              <div className="hidden lg:flex items-center gap-3">
                <ThemeToggle />
                <button className="w-11 h-11 glass rounded-2xl flex items-center justify-center relative hover:scale-105 transition-transform">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-ruby-500 rounded-full border-2 border-background" />
                </button>
                <div className="w-11 h-11 bg-primary border border-primary/20 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 cursor-pointer hover:scale-105 transition-transform">
                  JD
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
