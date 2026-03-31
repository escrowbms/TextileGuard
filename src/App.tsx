import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LandingPage from '@/app/LandingPage';
import LoginPage from '@/app/login/page';
import DashboardLayout from '@/app/dashboard/layout';

const DashboardPage = lazy(() => import('@/app/dashboard/page'));
const InvoicesPage = lazy(() => import('@/app/dashboard/invoices/page'));
const CustomersPage = lazy(() => import('@/app/dashboard/customers/page'));
const CustomerDetailPage = lazy(() => import('@/app/dashboard/customers/customer-detail'));
const EscalationsPage = lazy(() => import('@/app/dashboard/escalations/page'));
const SettingsPage = lazy(() => import('@/app/dashboard/settings/page'));
const ImportPage = lazy(() => import('@/app/dashboard/import/page'));
const RemindersPage = lazy(() => import('@/app/dashboard/reminders/page'));
const InterestPage = lazy(() => import('@/app/dashboard/interest/page'));

const LoadingFallback = () => (
  <div className="p-8 text-center text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-[10px]">
    Synchronizing Textile Intelligence...
  </div>
);
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/components/ThemeProvider';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
            
            <Route path="/dashboard" element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
              <Route index element={
                <Suspense fallback={<LoadingFallback />}>
                  <DashboardPage />
                </Suspense>
              } />
              <Route path="invoices" element={
                <Suspense fallback={<LoadingFallback />}>
                  <InvoicesPage />
                </Suspense>
              } />
              <Route path="customers" element={
                <Suspense fallback={<LoadingFallback />}>
                  <CustomersPage />
                </Suspense>
              } />
              <Route path="customers/:id" element={
                <Suspense fallback={<LoadingFallback />}>
                  <CustomerDetailPage />
                </Suspense>
              } />
              <Route path="escalations" element={
                <Suspense fallback={<LoadingFallback />}>
                  <EscalationsPage />
                </Suspense>
              } />
              <Route path="settings" element={
                <Suspense fallback={<LoadingFallback />}>
                  <SettingsPage />
                </Suspense>
              } />
              <Route path="import" element={
                <Suspense fallback={<LoadingFallback />}>
                  <ImportPage />
                </Suspense>
              } />
              <Route path="reminders" element={
                <Suspense fallback={<LoadingFallback />}>
                  <RemindersPage />
                </Suspense>
              } />
              <Route path="interest" element={
                <Suspense fallback={<LoadingFallback />}>
                  <InterestPage />
                </Suspense>
              } />
            </Route>

            <Route path="/" element={<LandingPage />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
