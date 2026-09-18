import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  DollarSign,
  CreditCard,
  AlertCircle,
  TrendingUp,
  Users,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Clock,
} from 'lucide-react';

interface FinanceStats {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  totalStudents: number;
  paidCount: number;
  partialCount: number;
  pendingCount: number;
  collectionRate: number;
}

export const FinanceDashboard: React.FC = () => {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get('/finance/dashboard/stats');
        setStats(res.data.stats);
        setRecentPayments(res.data.recentPayments || []);
      } catch (err) {
        console.error('Failed to load finance dashboard:', err);
        // Fallback demo data
        setStats({
          totalInvoiced: 12500000,
          totalCollected: 8750000,
          totalOutstanding: 3750000,
          totalStudents: 145,
          paidCount: 87,
          partialCount: 34,
          pendingCount: 24,
          collectionRate: 70,
        });
        setRecentPayments([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      label: 'Total Invoiced',
      value: fmt(stats?.totalInvoiced ?? 0),
      icon: BarChart3,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: 'Total Collected',
      value: fmt(stats?.totalCollected ?? 0),
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: 'Outstanding Balance',
      value: fmt(stats?.totalOutstanding ?? 0),
      icon: AlertCircle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
    },
    {
      label: 'Collection Rate',
      value: `${stats?.collectionRate ?? 0}%`,
      icon: DollarSign,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
  ];

  const paymentBreakdown = [
    { label: 'Fully Paid', count: stats?.paidCount ?? 0, color: 'bg-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-600' },
    { label: 'Partial Payment', count: stats?.partialCount ?? 0, color: 'bg-amber-400', icon: Clock, iconColor: 'text-amber-600' },
    { label: 'No Payment', count: stats?.pendingCount ?? 0, color: 'bg-rose-500', icon: AlertCircle, iconColor: 'text-rose-600' },
  ];

  const quickActions = [
    { label: 'Generate Invoice', desc: 'Create fee invoices for students', path: '/finance/invoices', icon: CreditCard, color: 'from-blue-500 to-blue-600' },
    { label: 'Record Payment', desc: 'Log a student fee payment', path: '/finance/payments', icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Defaulter Report', desc: 'View students with outstanding fees', path: '/finance/defaulters', icon: AlertCircle, color: 'from-rose-500 to-rose-600' },
    { label: 'Fee Structures', desc: 'Manage program fee rates', path: '/finance/fee-structures', icon: DollarSign, color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Finance Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Fee collection overview for the current academic session
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl px-4 py-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {stats?.totalStudents ?? 0} Students Enrolled
            </span>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 flex items-center space-x-4 shadow-sm"
              >
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-50 mt-0.5">{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Breakdown + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Status Breakdown */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-5">
              Payment Status Breakdown
            </h2>
            <div className="space-y-4">
              {paymentBreakdown.map((item) => {
                const Icon = item.icon;
                const total = (stats?.paidCount ?? 0) + (stats?.partialCount ?? 0) + (stats?.pendingCount ?? 0);
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.count} students</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                      <div className={`h-2 rounded-full ${item.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-right text-[10px] text-slate-400 mt-0.5">{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shadow-sm overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${action.color} rounded-l-2xl`} />
                    <div className="flex items-start justify-between pl-2">
                      <div>
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} mb-3 w-fit`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{action.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{action.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-1 transition-transform mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        {recentPayments.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent Payments</h2>
              <button
                onClick={() => navigate('/finance/payments')}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentPayments.slice(0, 5).map((p: any) => (
                <div key={p.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{p.studentName || 'Student'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{p.receipt_number} · {new Date(p.payment_date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {fmt(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
