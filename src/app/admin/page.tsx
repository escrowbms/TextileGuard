'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Building2, TrendingUp, ShieldCheck, Search, Trash2, 
  Ban, CheckCircle, AlertTriangle, Activity, BarChart3, 
  ArrowUpRight, IndianRupee, LayoutDashboard, Database, Cpu,
  RefreshCw, History, ShieldAlert, LogOut, Edit2, UserCog,
  Lock, Unlock, Eye, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/lib/admin-auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';

interface AdminUser {
  id: string;
  email: string;
  company_name: string;
  created_at: string;
  role: string;
  company_id: string;
  is_blocked: boolean;
}

interface Stats {
  totalUsers: number;
  totalCompanies: number;
  totalInvoices: number;
  totalReceivables: number;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminPage() {
  const { adminUser, logout } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalInvoices: 0,
    totalReceivables: 0
  });
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system'>('overview');
  const [chartData, setChartData] = useState<{name: string, value: number}[]>([]);
  const [settings, setSettings] = useState<Record<string, boolean>>({
    maintenance_mode: false,
    public_signups: true,
    trial_extension: false
  });
  const [adminLogs, setAdminLogs] = useState<{id: string, action: string, created_at: string}[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  useEffect(() => {
    fetchAdminData();
    fetchAdminLogs();
  }, [adminUser]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users joined with Companies
      const { data: users, error: uError } = await supabase
        .from('users')
        .select(`
          id, email, created_at, role, company_id,
          is_blocked,
          companies (name)
        `);

      if (uError) throw uError;

      const mappedUsers = (users || []).map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        role: u.role,
        company_id: u.company_id,
        is_blocked: u.is_blocked || false,
        company_name: (u.companies as any)?.name || 'N/A'
      }));
      setUsersList(mappedUsers);

      // 2. Process Chart Data (User signups by month)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date().getFullYear();
      const signupCounts: Record<string, number> = {};
      mappedUsers.forEach(u => {
        const date = new Date(u.created_at);
        if (date.getFullYear() === currentYear) {
          const month = months[date.getMonth()];
          signupCounts[month] = (signupCounts[month] || 0) + 1;
        }
      });
      const dynamicChartData = months.map(m => ({
        name: m,
        value: signupCounts[m] || 0
      })).filter((_, i) => i <= new Date().getMonth());
      setChartData(dynamicChartData);

      // 3. Fetch Settings
      const { data: sData } = await supabase.from('system_settings').select('*');
      if (sData) {
        const sObj: Record<string, boolean> = {};
        sData.forEach(s => sObj[s.key] = s.value === 'true' || s.value === true);
        setSettings(prev => ({ ...prev, ...sObj }));
      }

      // 4. Fetch Stats
      const { data: companies } = await supabase.from('companies').select('id', { count: 'exact' });
      const { data: invoices } = await supabase.from('invoices').select('balance_due');
      const totalReceivables = invoices?.reduce((acc, inv) => acc + Number(inv.balance_due), 0) || 0;

      setStats({
        totalUsers: users?.length || 0,
        totalCompanies: companies?.length || 0,
        totalInvoices: invoices?.length || 0,
        totalReceivables
      });

    } catch (err) {
      console.error('Admin data fetch error:', err);
      toast.error('Failed to synchronize admin intelligence');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminLogs = async () => {
    const { data } = await supabase
      .from('admin_logs')
      .select('id, action, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setAdminLogs(data);
  };

  const logAdminAction = async (action: string, details?: string) => {
    await supabase.from('admin_logs').insert({
      action,
      details,
      admin_id: adminUser?.id
    });
    fetchAdminLogs();
  };

  const handleToggleSetting = async (key: string) => {
    const newValue = !settings[key];
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ key, value: newValue, updated_at: new Date().toISOString() });
      if (error) throw error;
      setSettings(prev => ({ ...prev, [key]: newValue }));
      toast.success(`${key.replace('_', ' ').toUpperCase()} updated`);
      logAdminAction(`Updated ${key}`, `Set to ${newValue}`);
    } catch (err) {
      toast.error('Protocol failed to deploy setting');
    }
  };

  const handleDeployBroadcast = async (priority: 'normal' | 'emergency' = 'normal') => {
    if (!broadcastMessage.trim()) return;
    try {
      const { error } = await supabase.from('broadcasts').insert({
        message: broadcastMessage,
        priority,
        created_by: adminUser?.id
      });
      if (error) throw error;
      toast.success(`Broadcasting ${priority.toUpperCase()} frequency...`);
      setBroadcastMessage('');
      logAdminAction(`Deployed ${priority} broadcast`, broadcastMessage);
    } catch (err) {
      toast.error('Broadcast uplink failed');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this user? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      toast.success('User protocol terminated successfully');
      logAdminAction('User Deleted', `User ID: ${userId}`);
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to terminate user protocol');
    }
  };

  const handleEditRole = async (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to change clearance level to ${newRole.toUpperCase()}?`)) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', user.id);
      
      if (error) throw error;
      toast.success(`Clearance adjusted to ${newRole.toUpperCase()}`);
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to adjust clearance protocol');
    }
  };

  const handleToggleBlock = async (user: AdminUser) => {
    const newStatus = !user.is_blocked;
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_blocked: newStatus })
        .eq('id', user.id);
      
      if (error) throw error;
      toast.success(newStatus ? 'PROTOCOL: ACCESS SUSPENDED' : 'PROTOCOL: ACCESS RESTORED');
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to update security status');
    }
  };

  const handleImpersonate = (user: AdminUser) => {
    toast.info(`Initializing impersonation session for ${user.email}...`);
    // Note: This would typically involve setting a temporary token or session flag
    // For now, we simulate the action
    setTimeout(() => {
      window.open(`/?as=${user.id}`, '_blank');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Initializing Admin Matrix...</p>
        </div>
      </div>
    );
  }


  // The rest of your existing logic for isSuperAdmin check is now handled by AdminGuard
  // We can skip the inline check and just render.
  
  const filteredUsers = usersList.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statsCards = [
    { label: 'Total Operators', value: stats.totalUsers, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Registered Entities', value: stats.totalCompanies, icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Enforcement', value: stats.totalInvoices, icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Capital Surveillance', value: `₹${(stats.totalReceivables / 100000).toFixed(1)}L`, icon: IndianRupee, color: 'text-ruby-400', bg: 'bg-ruby-500/10' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 pt-12 md:p-12">
      <div className="max-w-[1400px] mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-4">
              <ShieldCheck className="w-10 h-10 text-primary" />
              SuperAdmin Command
            </h1>
            <p className="text-muted-foreground font-medium mt-2">Platform-wide oversight and entity management</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={logout}
              className="p-3 bg-ruby-500/10 text-ruby-500 rounded-xl hover:bg-ruby-500/20 transition-all"
              title="Logout from Command Center"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="flex bg-secondary/50 p-1.5 rounded-[1.5rem] border border-border/50 backdrop-blur-md">
              {['overview', 'users', 'system'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-8 rounded-[2.5rem] border border-border relative overflow-hidden group"
            >
              <div className={`p-4 ${stat.bg} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">{stat.label}</p>
              <p className="text-3xl font-black tracking-tight">{stat.value}</p>
              <ArrowUpRight className="absolute top-8 right-8 w-6 h-6 text-muted-foreground/20 group-hover:text-primary transition-colors" />
            </motion.div>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass rounded-[3rem] border border-border p-8 md:p-12 overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black tracking-tight">Growth Intelligence</h3>
                 <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-primary" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">User Adoption</span>
                 </div>
               </div>
               <div className="h-[400px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                     <defs>
                       <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} dx={-10} />
                     <Tooltip 
                       contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '16px', color: 'white' }}
                       itemStyle={{ color: 'white', fontWeight: 700, fontSize: '12px' }}
                     />
                     <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>
            
            <div className="space-y-6">
              {[
                { label: 'Engine Health', value: '99.9%', status: 'Optimal', icon: Database, color: 'text-emerald-500' },
                { label: 'Sync Latency', value: '42ms', status: 'Optimal', icon: RefreshCw, color: 'text-indigo-500' },
                { label: 'Compute Load', value: '14%', status: 'Low', icon: Cpu, color: 'text-amber-500' },
              ].map((comp, i) => (
                <div key={i} className="glass p-6 rounded-[2rem] border border-border flex items-center gap-6">
                  <div className="p-4 bg-secondary/50 rounded-2xl">
                    <comp.icon className={`w-6 h-6 ${comp.color}`} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{comp.label}</p>
                    <p className="text-xl font-black">{comp.value}</p>
                    <p className="text-[9px] font-bold text-emerald-500 uppercase mt-1 tracking-wider">{comp.status}</p>
                  </div>
                </div>
              ))}
              
              <div className="glass p-8 rounded-[2.5rem] border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                     <History className="w-6 h-6 text-white" />
                   </div>
                   <h4 className="font-black text-sm uppercase tracking-widest">Audit Trail</h4>
                </div>
                <div className="space-y-4">
                  {adminLogs.map(log => (
                    <div key={log.id} className="flex gap-4 group">
                      <div className="w-1 h-10 bg-border rounded-full group-hover:bg-primary transition-colors mt-1" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-black dark:text-white">{log.action}</p>
                        <p className="text-[9px] text-muted-foreground mt-1 font-medium italic">
                          {new Date(log.created_at).toLocaleTimeString()} • Verified Security
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search operators or entities..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-secondary/30 border border-border/60 rounded-[1.5rem] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            <div className="glass rounded-[3rem] border border-border overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-border bg-secondary/30">
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entity</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clearance</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Commission Date</th>
                       <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Protocol</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-border/50">
                     {filteredUsers.map((user) => (
                       <tr key={user.id} className="hover:bg-secondary/20 transition-colors group">
                         <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-white text-xs">
                               {user.email.slice(0, 2).toUpperCase()}
                             </div>
                             <div>
                               <p className="font-black text-sm">{user.company_name}</p>
                               <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{user.email}</p>
                             </div>
                           </div>
                         </td>
                         <td className="px-8 py-6">
                           <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                             user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-secondary text-muted-foreground border-border'
                           }`}>
                             {user.role}
                           </span>
                         </td>
                         <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                             {user.is_blocked ? (
                               <>
                                 <div className="w-2 h-2 rounded-full bg-ruby-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                 <span className="text-[10px] font-black uppercase tracking-wider text-ruby-500">Suspended</span>
                               </>
                             ) : (
                               <>
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                 <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Active</span>
                               </>
                             )}
                           </div>
                         </td>
                         <td className="px-8 py-6">
                           <p className="text-[10px] font-bold text-muted-foreground">
                             {new Date(user.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                           </p>
                         </td>
                         <td className="px-8 py-6 text-right">
                           <div className="flex justify-end gap-1.5">
                             <button 
                               onClick={() => handleImpersonate(user)}
                               className="p-2.5 bg-black/[0.03] dark:bg-white/[0.05] hover:bg-primary/10 rounded-xl transition-all text-black/40 dark:text-white/40 hover:text-primary"
                               title="Login As User"
                             >
                               <Eye className="w-4 h-4" />
                             </button>
                               <button 
                                onClick={() => handleEditRole(user)}
                                className="p-2.5 bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-all text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                                title="Edit Clearance"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                             <button 
                               onClick={() => handleToggleBlock(user)}
                               className={cn(
                                 "p-2.5 rounded-xl transition-all",
                                 user.is_blocked 
                                   ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" 
                                   : "bg-ruby-500/10 text-ruby-500 hover:bg-ruby-500/20"
                               )}
                               title={user.is_blocked ? "Unblock Access" : "Suspend Access"}
                             >
                               {user.is_blocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                             </button>
                             <button 
                               onClick={() => handleDeleteUser(user.id)}
                               className="p-2.5 bg-black/[0.03] dark:bg-white/[0.05] hover:bg-ruby-500/10 rounded-xl transition-all text-black/40 dark:text-white/40 hover:text-ruby-500"
                               title="Terminate Protocol"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               
               {filteredUsers.length === 0 && (
                 <div className="py-20 text-center space-y-4">
                   <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mx-auto grayscale opacity-20">
                     <Users className="w-8 h-8" />
                   </div>
                   <p className="text-sm text-muted-foreground font-medium italic">No entities match your search criteria</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass p-8 rounded-[3rem] border border-border">
              <h3 className="text-xl font-black mb-8 tracking-tight flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-primary" />
                System Protocols
              </h3>
              <div className="space-y-6">
                {[
                  { id: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Prevent user access for system upgrades' },
                  { id: 'public_signups', label: 'Public Signups', desc: 'Enable/Disable new entity registrations' },
                  { id: 'trial_extension', label: 'Trial Extension', desc: 'Automatically extend new trial periods' },
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-secondary/30 rounded-[2rem] border border-border/50">
                    <div>
                      <p className="text-sm font-black tracking-tight">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">{p.desc}</p>
                    </div>
                    <div 
                      onClick={() => handleToggleSetting(p.id)}
                      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${settings[p.id] ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings[p.id] ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="glass p-8 rounded-[3rem] border border-border flex flex-col">
              <h3 className="text-xl font-black mb-8 tracking-tight flex items-center gap-3">
                <Radio className="w-6 h-6 text-primary animate-pulse" />
                System Broadcast
              </h3>
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-3 flex-1 flex flex-col">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-black dark:text-white px-2">Broadcast Message</label>
                  <textarea 
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full flex-1 min-h-[120px] p-6 bg-secondary/30 border-2 border-border rounded-[2rem] text-sm font-bold focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 uppercase tracking-widest leading-relaxed resize-none"
                    placeholder="ENTER MISSION DIRECTIVE..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleDeployBroadcast('normal')}
                    className="py-4 bg-black dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:translate-y-[-2px] active:scale-[0.98] transition-all shadow-lg border-2 border-transparent"
                  >
                    Deploy Normal
                  </button>
                  <button 
                    onClick={() => handleDeployBroadcast('emergency')}
                    className="py-4 bg-ruby-600 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-ruby-700 active:scale-[0.98] transition-all shadow-lg shadow-ruby-500/20 border-2 border-ruby-400/20"
                  >
                    Emergency Alert
                  </button>
                </div>
                
                <div className="pt-4 border-t-2 border-black/5 dark:border-white/5">
                   <div className="flex items-center justify-between px-2 text-[10px] font-black tracking-[0.2em] text-black dark:text-white uppercase">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Uplink Ready</span>
                      </div>
                      <span>Target: All Operators</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
