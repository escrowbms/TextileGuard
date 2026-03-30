'use client';

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getCustomers } from "@/services/customers";
import { getUserByFirebaseUid } from "@/services/user";
import { useAuth } from "@/lib/auth-context";
import { CustomersClient } from "./customers-client";

export default function CustomersPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string>("");
  const [customers, setCustomers] = useState<any[]>([]);

  const search = searchParams.get('search') || undefined;
  const risk = searchParams.get('risk') || undefined;

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        const appUser = await getUserByFirebaseUid(user.uid);
        if (!appUser?.companyId) return;
        setCompanyId(appUser.companyId);

        const customersList = await getCustomers(appUser.companyId, search, risk);
        setCustomers(customersList);
      } catch (err) {
        console.error("Error fetching customers page data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, search, risk]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-xs">Synchronizing Entities...</div>;
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-xs">Synchronizing Entities...</div>}>
      <CustomersClient initialCustomers={customers as any} companyId={companyId} />
    </Suspense>
  );
}
