'use client';

import { useState, useEffect } from "react";
import { getEscalations } from "@/services/escalations";
import { getPendingReminders, Reminder } from "@/services/reminders";
import { getUserByFirebaseUid } from "@/services/user";
import { useAuth } from "@/lib/auth-context";
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

        const [escalationsList, remindersList] = await Promise.all([
          getEscalations(appUser.companyId),
          getPendingReminders(appUser.companyId)
        ]);
        setEscalations(escalationsList);
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
