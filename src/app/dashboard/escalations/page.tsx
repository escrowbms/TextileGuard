'use client';

import { useState, useEffect } from "react";
import { getEscalations } from "@/services/escalations";
import { getPendingReminders, Reminder } from "@/services/reminders";
import { getUserByFirebaseUid } from "@/services/user";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { EscalationsClient } from "./escalations-client";

export default function EscalationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [companyId, setCompanyId] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        const appUser = await getUserByFirebaseUid(user.uid);
        if (!appUser?.companyId) return;
        setCompanyId(appUser.companyId);

        // Fetch escalations from DB + enrich with customer data
        const [rawEscalations, remindersList] = await Promise.all([
          getEscalations(appUser.companyId),
          getPendingReminders(appUser.companyId),
        ]);

        // Also fetch high-risk customers as pseudo-escalations (risk_score >= 60)
        const { data: highRiskCustomers } = await supabase
          .from('customers')
          .select('id, name, city, risk_score, risk_level, is_credit_frozen, exposure, overdue_amount')
          .eq('company_id', appUser.companyId)
          .gte('risk_score', 60)
          .order('risk_score', { ascending: false });

        // Transform high-risk customers into escalation member format
        const escalationMembers = (highRiskCustomers || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          city: c.city,
          riskScore: c.risk_score,
          riskLevel: c.risk_level || (c.risk_score >= 85 ? 'critical' : 'high'),
          isCreditFrozen: c.is_credit_frozen || false,
          exposure: String(c.overdue_amount || c.exposure || 0),
        }));

        setEscalations(escalationMembers);
        setReminders(remindersList);
      } catch (err) {
        console.error("Error fetching escalations page data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <EscalationsClient 
      initialEscalations={escalations as any} 
      initialReminders={reminders}
      companyId={companyId}
    />
  );
}
