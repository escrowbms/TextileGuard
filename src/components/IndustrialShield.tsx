import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Lock, Mail, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Shared Constants ──────────────────────────────────────────────────────────
export const SLIDES = [
  { animation: "intelligence", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { animation: "automation", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { animation: "discipline", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
];

export const STATIC_DETAILS = {
  title: "Industrial Credit Control Made Absolute.",
  description: "Protect your liquidity with real-time risk intelligence, automated follow-ups, and systematic credit enforcement. Built for the textile giants.",
  features: [
    { title: "Risk Scoring", desc: "Recalculated every 6h using DSO and payment trends.", icon: BarChart3 },
    { title: "Auto-Blocks", desc: "Systematic orders freeze for 90+ day overdue buyers.", icon: Lock },
    { title: "WhatsApp Reminders", desc: "Automated follow-ups that get you paid 3x faster.", icon: Mail },
    { title: "Ledger Clarity", desc: "Professional ledger tracking for every single customer.", icon: Shield }
  ]
};

// ── AnimatedBackground ─────────────────────────────────────────────────────────
// NOTE: Must be placed inside a `relative overflow-hidden` parent.
// All elements use overflow-hidden + inset-0 to prevent bleed outside parent.

export const AnimatedBackground = ({ type }: { type: string }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: "1200px" }}>

      {/* Radial colour glow — theme-safe, very subtle */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className={cn(
          "absolute inset-0",
          type === 'intelligence' && "bg-[radial-gradient(ellipse_at_25%_30%,rgba(59,130,246,0.12),transparent_65%)]",
          type === 'automation'   && "bg-[radial-gradient(ellipse_at_70%_30%,rgba(139,92,246,0.12),transparent_65%)]",
          type === 'discipline'   && "bg-[radial-gradient(ellipse_at_50%_70%,rgba(16,185,129,0.12),transparent_65%)]",
        )}
      />

      {/* ── Intelligence type ── */}
      {type === 'intelligence' && (
        <>
          {/* Subtle dot grid */}
          <div className="absolute inset-0 opacity-[0.12]
            [background-image:radial-gradient(circle,rgba(59,130,246,0.5)_1px,transparent_1px)]
            [background-size:40px_40px]" />

          {/* Orbiting ring — clipped by parent overflow-hidden */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 right-[-160px] -translate-y-1/2 w-[480px] h-[480px] border border-blue-500/15 rounded-full"
          />

          {/* Floating cards that scroll upward out of view */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: -600, opacity: [0, 0.4, 0] }}
              transition={{ duration: 8 + i, repeat: Infinity, delay: i * 1.8, ease: "linear" }}
              className="absolute w-14 h-20 bg-blue-400/5 border border-blue-400/15 rounded-xl"
              style={{ left: `${10 + i * 17}%`, top: '100%' }}
            />
          ))}
        </>
      )}

      {/* ── Automation type ── */}
      {type === 'automation' && (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-150px] right-[-150px] w-[520px] h-[520px] border border-purple-500/15 rounded-full"
          />
          {[...Array(9)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ x: [0, 60, 0], opacity: [0.1, 0.45, 0.1] }}
              transition={{ duration: 3.5 + i * 0.3, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
              className="absolute h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"
              style={{ left: 0, top: `${12 + i * 8.5}%`, width: '100%' }}
            />
          ))}
        </>
      )}

      {/* ── Discipline type ── */}
      {type === 'discipline' && (
        <>
          <motion.div
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-2 border-emerald-500/20 rounded-full shadow-[0_0_60px_rgba(16,185,129,0.1)]"
          />
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ scale: [0, 1.1, 0], opacity: [0, 0.55, 0] }}
              transition={{ duration: 2.5 + (i % 4) * 0.5, repeat: Infinity, delay: i * 0.3 }}
              className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full"
              style={{ left: `${20 + (i * 6) % 60}%`, top: `${20 + (i * 7) % 60}%` }}
            />
          ))}
        </>
      )}

      {/* Bottom vignette — fades into background regardless of theme */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/60 to-transparent" />
    </div>
  );
};
