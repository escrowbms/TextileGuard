'use client';

import { useEffect, useState } from 'react';
import { InterestClient } from './interest-client';
import { getInterestRecoveryPotential } from '@/services/analytics';
import { getUserByFirebaseUid } from '@/services/user';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function InterestPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const appUser = await getUserByFirebaseUid(user.uid);
        if (!appUser?.companyId) { setLoading(false); return; }
        const potential = await getInterestRecoveryPotential(appUser.companyId);
        setData(potential || []);
      } catch (error) {
        console.error('Error fetching interest recovery data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <ShieldCheck className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center animate-pulse">
          <p className="text-sm font-black uppercase tracking-widest text-primary">Scanning Ledger</p>
          <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">Calculating Accruals @18% p.a.</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="interest-content"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <InterestClient data={data} />
      </motion.div>
    </AnimatePresence>
  );
}
