import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '@/app/LandingPage';
import LoginPage from '@/app/login/page';
import DashboardLayout from '@/app/dashboard/layout';
import DashboardPage from '@/app/dashboard/page';
import InvoicesPage from '@/app/dashboard/invoices/page';
import CustomersPage from '@/app/dashboard/customers/page';
import CustomerDetailPage from '@/app/dashboard/customers/customer-detail';
import EscalationsPage from '@/app/dashboard/escalations/page';
import SettingsPage from '@/app/dashboard/settings/page';
import ImportPage from '@/app/dashboard/import/page';
import RemindersPage from '@/app/dashboard/reminders/page';
import InterestPage from '@/app/dashboard/interest/page';
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
              <Route index element={<DashboardPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="escalations" element={<EscalationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="import" element={<ImportPage />} />
              <Route path="reminders" element={<RemindersPage />} />
              <Route path="interest" element={<InterestPage />} />
            </Route>

            <Route path="/" element={<LandingPage />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
