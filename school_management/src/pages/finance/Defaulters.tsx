import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { AlertCircle, Download, Mail, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface Defaulter {
  student_id: string;
  matricule: string;
  full_name: string;
  program_name: string;
  level: string;
  invoice_id: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  due_date: string;
  status: 'pending' | 'partial';
  session_name: string;
}

export const FinanceDefaulters: React.FC = () => {
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    try {
      const [defRes, ssRes] = await Promise.all([
        api.get('/finance/defaulters', { params: { session_id: selectedSession || undefined } }),
        api.get('/admin/sessions'),
      ]);
      setDefaulters(defRes.data.defaulters || []);
      setSessions(ssRes.data.sessions || []);
    } catch {
      toast.error('Failed to load defaulters');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedSession]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

  const filtered = defaulters.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !search || d.full_name.toLowerCase().includes(q) || d.matricule.toLowerCase().includes(q);
    const matchStatus = !filterStatus || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalOutstanding = filtered.reduce((sum, d) => sum + d.balance, 0);

  const handleExport = () => {
    const headers = ['Matricule', 'Name', 'Program', 'Level', 'Session', 'Total', 'Paid', 'Balance', 'Due Date', 'Status'];
    const rows = filtered.map((d) => [
      d.matricule, d.full_name, d.program_name, d.level, d.session_name,
      d.total_amount, d.amount_paid, d.balance, d.due_date, d.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'defaulters_report.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Defaulter Reports</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Students with outstanding fee balances</p>
          </div>
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
        </div>

        {/* Summary Banner */}
        {!isLoading && filtered.length > 0 && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/60 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <div>
                <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
                  {filtered.length} student{filtered.length !== 1 ? 's' : ''} with outstanding fees
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  Total outstanding: <strong>{fmt(totalOutstanding)}</strong>
                </p>
              </div>
            </div>
            <button className="flex items-center space-x-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 hover:underline">
              <Mail className="w-3.5 h-3.5" />
              <span>Send Reminders</span>
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or matricule…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All sessions</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All statuses</option>
              <option value="pending">No Payment</option>
              <option value="partial">Partial Payment</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <AlertCircle className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">No defaulters found for the selected criteria.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Program</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Session</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Total</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Paid</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Balance</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((d) => (
                  <tr key={d.invoice_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800 dark:text-slate-100">{d.full_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{d.matricule}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{d.program_name} · {d.level}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">{d.session_name}</td>
                    <td className="px-5 py-3.5 text-right text-slate-700 dark:text-slate-200 font-medium">{fmt(d.total_amount)}</td>
                    <td className="px-5 py-3.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">{fmt(d.amount_paid)}</td>
                    <td className="px-5 py-3.5 text-right text-rose-600 dark:text-rose-400 font-bold">{fmt(d.balance)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        d.status === 'partial'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}>
                        {d.status === 'partial' ? 'Partial' : 'No Payment'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(d.due_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50">
                  <td colSpan={5} className="px-5 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Total Outstanding ({filtered.length} students)
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-rose-600 dark:text-rose-400">{fmt(totalOutstanding)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
