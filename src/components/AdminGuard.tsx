'use client';

import { useAdminAuth } from "@/lib/admin-auth-context";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { isAdminAuthenticated, isInitializing } = useAdminAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isInitializing && !isAdminAuthenticated) {
            navigate("/admin/login");
        }
    }, [isAdminAuthenticated, isInitializing, navigate]);

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Initializing Admin Matrix...</p>
                </div>
            </div>
        );
    }

    return isAdminAuthenticated ? <>{children}</> : null;
}
