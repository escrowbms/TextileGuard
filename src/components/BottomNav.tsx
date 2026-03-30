'use client';

import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Bell, MessageSquare } from "lucide-react";
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border z-50 px-6 pb-[var(--sab,1rem)] pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              to={item.href}
              className="flex flex-col items-center gap-1 relative px-2"
            >
              <div className={`p-2 rounded-xl transition-all duration-300 ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}>
                <item.icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
              </div>
              <span className={`text-[10px] font-bold tracking-tight transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}>
                {item.name}
              </span>
              
              {isActive && (
                <motion.div 
                  layoutId="bottomNavDot"
                  className="absolute -top-1 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
