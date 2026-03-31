'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-14 h-8 rounded-full glass animate-pulse" />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <div 
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative w-14 h-8 glass rounded-full flex items-center p-1 cursor-pointer group border border-white/5 overflow-hidden transition-all duration-500 hover:border-primary/40 shadow-inner"
    >
      {/* Animated Sliding Background */}
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`absolute h-6 w-6 rounded-full flex items-center justify-center shadow-lg transition-colors duration-500 ${
          isDark 
            ? "translate-x-6 bg-indigo-500 shadow-indigo-500/40" 
            : "translate-x-0 bg-amber-400 shadow-amber-400/40"
        }`}
      >
        <AnimatePresence mode='wait'>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ scale: 0, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="w-3.5 h-3.5 text-white fill-white" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ scale: 0, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="w-3.5 h-3.5 text-white fill-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Background Icons (Hidden Behind Switch) */}
      <div className="flex justify-between w-full px-1.5 opacity-30 group-hover:opacity-100 transition-opacity">
        <Sun className="w-3 h-3 text-amber-500" />
        <Moon className="w-3 h-3 text-indigo-400" />
      </div>
    </div>
  );
}

