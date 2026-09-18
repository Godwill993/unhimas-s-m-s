import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Invoice } from '../../types';

const statusColors: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
  partial: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60',
  pending: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60',
};

const statusIcons = { paid: CheckCircle2, partial: Clock, pending: AlertCircle };

export const FinanceInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student_id: '', session_id: '', amount: '', due_date: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const load = async () => {
    try {
      const [invRes, stRes, ssRes] = await Promise.all([
        api.get('/finance/invoices'),
        api.get('/finance/students-list'),
        api.get('/admin/sessions'),
      ]);
      setInvoices(invRes.data.invoices || []);
      setStudents(stRes.data.students || []);
      setSessions(ssRes.data.sessions || []);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/finance/invoices', { ...form, amount: Number(form.amount) });
      toast.success('Invoice created successfully');
      setShowForm(false);
      setForm({ student_id: '', session_id: '', amount: '', due_date: '' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

  const filtered = invoices.filter((inv) => {
    const name = inv.students?.user_profiles?.full_name?.toLowerCase() || '';
    const mat = inv.students?.matricule?.toLowerCase() || '';
    const q = search.toLowerCase();
    const matchSearch = !search || name.includes(q) || mat.includes(q);
    const matchStatus = !filterStatus || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Invoices & Billing</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage student fee invoices</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> New Invoice
          </Button>
        </div>

        {/* Create Invoice Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Create New Invoice</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Student</label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select student…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.matricule} – {s.user_profiles?.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Session</label>
                <select
                  value={form.session_id}
                  onChange={(e) => setForm({ ...form, session_id: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select session…</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Amount (XAF)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  min="0"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex space-x-3">
                <Button type="submit" isLoading={isSaving}>Create Invoice</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <CreditCard className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">No invoices found.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Session</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Amount</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Paid</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Balance</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Due Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((inv) => {
                  const StatusIcon = statusIcons[inv.status] || AlertCircle;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          {inv.students?.user_profiles?.full_name || '—'}
                        </p>
                        <p className="text-xs text-slate-400 font-mono">{inv.students?.matricule}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        {inv.academic_sessions?.name || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-slate-800 dark:text-slate-100">{fmt(inv.amount)}</td>
                      <td className="px-5 py-3.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">{fmt(inv.amountPaid ?? 0)}</td>
                      <td className="px-5 py-3.5 text-right text-rose-600 dark:text-rose-400 font-medium">{fmt(inv.balance ?? inv.amount)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColors[inv.status]}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="capitalize">{inv.status}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                        {new Date(inv.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Invoice Detail Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Invoice Details</h3>
                <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl font-bold">×</button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Student</span><span className="font-medium">{selectedInvoice.students?.user_profiles?.full_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Matricule</span><span className="font-mono">{selectedInvoice.students?.matricule}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Session</span><span>{selectedInvoice.academic_sessions?.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total Amount</span><span className="font-bold">{fmt(selectedInvoice.amount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Amount Paid</span><span className="text-emerald-600 font-bold">{fmt(selectedInvoice.amountPaid ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Balance</span><span className="text-rose-600 font-bold">{fmt(selectedInvoice.balance ?? selectedInvoice.amount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Due Date</span><span>{new Date(selectedInvoice.due_date).toLocaleDateString()}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status</span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColors[selectedInvoice.status]}`}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">Payment History</p>
                  <div className="space-y-2">
                    {selectedInvoice.payments.map((p) => (
                      <div key={p.id} className="flex justify-between text-xs">
                        <span className="text-slate-500">{new Date(p.payment_date).toLocaleDateString()} · {p.receipt_number}</span>
                        <span className="font-semibold text-emerald-600">{fmt(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
