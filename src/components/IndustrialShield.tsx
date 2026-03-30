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

// ── Shared Components ─────────────────────────────────────────────────────────

export const AnimatedBackground = ({ type }: { type: string }) => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-background" style={{ perspective: "1200px" }}>
      {/* Dynamic Radial Glow */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 90, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className={cn(
          "absolute inset-0 transition-colors duration-1000",
          type === 'intelligence' ? "bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.15),transparent_60%)]" :
          type === 'automation' ? "bg-[radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.15),transparent_60%)]" :
          "bg-[radial-gradient(circle_at_50%_70%,rgba(16,185,129,0.15),transparent_60%)]"
        )}
      />

      {type === 'intelligence' && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] [background-size:60px_60px] translate-z-[-100px]" />
          <motion.div
            animate={{ rotate: 360, rotateX: [60, 45, 60], z: [-50, 50, -50] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -right-20 top-1/2 -translate-y-1/2 w-[700px] h-[700px] border-[1.5px] border-blue-500/20 rounded-full"
            style={{ transformStyle: "preserve-3d" }}
          />
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: 0, opacity: 0, rotateX: -25, z: -150 }}
              animate={{ y: -600, opacity: [0, 0.8, 0], rotateX: [ -30, 0, 30 ], z: [ -200, 150, -200 ], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, delay: i * 0.8 }}
              className="absolute w-24 h-32 bg-gradient-to-br from-blue-400/10 to-blue-600/5 rounded-xl border border-blue-400/30 backdrop-blur-xl shadow-2xl"
              style={{ left: `${10 + i * 12}%`, top: '100%', transformStyle: "preserve-3d" }}
            />
          ))}
        </div>
      )}

      {type === 'automation' && (
        <div className="absolute inset-0">
          <motion.div
            animate={{ rotate: 360, rotateX: [60, 45, 60], z: [-100, 50, -100] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -right-20 -top-20 w-[600px] h-[600px] border-2 border-purple-500/20 rounded-full"
            style={{ transformStyle: "preserve-3d" }}
          />
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ x: [0, 150, 0], opacity: [0.2, 0.6, 0.2], scaleX: [1, 1.5, 1] }}
              transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: i * 0.4 }}
              className="absolute h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent"
              style={{ left: '-10%', top: `${15 + i * 7}%`, width: '120%' }}
            />
          ))}
        </div>
      )}

      {type === 'discipline' && (
        <div className="absolute inset-0">
          <motion.div
            animate={{ rotateY: [0, 360], rotateX: [30, -30, 30], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-[3px] border-emerald-500/30 rounded-full flex items-center justify-center shadow-[0_0_100px_rgba(16,185,129,0.2)]"
            style={{ transformStyle: "preserve-3d" }}
          />
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ scale: [0, 1.5, 0], opacity: [0, 0.8, 0], z: [-50, 50, -50] }}
              transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: i * 0.2 }}
              className="absolute w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)]"
              style={{ left: `${15 + Math.random() * 70}%`, top: `${15 + Math.random() * 70}%`, transformStyle: "preserve-3d" }}
            />
          ))}
        </div>
      )}

      {/* Industrial Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.65%22%20numOctaves=%223%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] contrast-150 brightness-150" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};
