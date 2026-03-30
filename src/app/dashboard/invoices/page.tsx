'use client';

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getInvoices } from "@/services/invoices";
import { getCustomers } from "@/services/customers";
import { getUserByFirebaseUid } from "@/services/user";
import { useAuth } from "@/lib/auth-context";
import { InvoicesClient } from "./invoices-client";

export default function InvoicesPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string>("");
  const [data, setData] = useState<{
    invoices: any[];
    customers: any[];
  }>({ invoices: [], customers: [] });

  const search = searchParams.get('search') || undefined;
  const status = searchParams.get('status') || undefined;
  const bucket = searchParams.get('bucket') || undefined;

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        const appUser = await getUserByFirebaseUid(user.uid);
        if (!appUser?.companyId) return;
        setCompanyId(appUser.companyId);

        const [invoicesList, customersList] = await Promise.all([
          getInvoices(appUser.companyId, search, status, bucket),
          getCustomers(appUser.companyId),
        ]);

        setData({ invoices: invoicesList, customers: customersList });
      } catch (err) {
        console.error("Error fetching invoices page data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, search, status, bucket]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-xs">Synchronizing Invoices...</div>;
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-xs">Synchronizing Invoices...</div>}>
      <InvoicesClient 
        initialInvoices={data.invoices as any} 
        customers={data.customers as any} 
        companyId={companyId}
      />
    </Suspense>
  );
}
