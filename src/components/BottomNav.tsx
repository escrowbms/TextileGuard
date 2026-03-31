'use client';

import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Bell, MessageSquare, Plus } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { name: "Home", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Buyers", icon: Users, href: "/dashboard/customers" },
  { name: "Bills", icon: FileText, href: "/dashboard/invoices" },
  { name: "Nudge", icon: MessageSquare, href: "/dashboard/reminders" },
  { name: "Alerts", icon: Bell, href: "/dashboard/escalations" },
];

export function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-2xl border-t border-border z-[100] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      <div className="flex justify-between items-center max-w-lg mx-auto relative h-12">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              to={item.href}
              className="flex-1 flex flex-col items-center justify-center relative touch-none active:scale-90 transition-transform"
            >
              <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                isActive ? "text-primary bg-primary/5" : "text-slate-400"
              }`}>
                <item.icon className={`w-5.5 h-5.5 ${isActive ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
                
                {isActive && (
                  <motion.div 
                    layoutId="activePill"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.8)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 transition-colors ${
                isActive ? "text-primary" : "text-slate-400"
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

