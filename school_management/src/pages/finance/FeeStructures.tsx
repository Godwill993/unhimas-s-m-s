import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { DollarSign, Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface FeeStructure {
  id: string;
  program_id: string;
  session_id: string;
  amount: number;
  level?: string;
  programs?: { name: string; code: string };
  academic_sessions?: { name: string };
}

export const FinanceFeeStructures: React.FC = () => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ program_id: '', session_id: '', amount: '', level: '' });
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      const [fsRes, pgRes, ssRes] = await Promise.all([
        api.get('/finance/fee-structures'),
        api.get('/admin/programs'),
        api.get('/admin/sessions'),
      ]);
      setFeeStructures(fsRes.data.feeStructures || []);
      setPrograms(pgRes.data.programs || []);
      setSessions(ssRes.data.sessions || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load fee structures');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/finance/fee-structures/${editingId}`, { amount: Number(form.amount) });
        toast.success('Fee structure updated');
      } else {
        await api.post('/finance/fee-structures', { ...form, amount: Number(form.amount) });
        toast.success('Fee structure created');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ program_id: '', session_id: '', amount: '', level: '' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (fs: FeeStructure) => {
    setForm({ program_id: fs.program_id, session_id: fs.session_id, amount: String(fs.amount), level: fs.level || '' });
    setEditingId(fs.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fee structure?')) return;
    try {
      await api.delete(`/finance/fee-structures/${id}`);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Fee Structures</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Define tuition fees per program and academic session</p>
          </div>
          <Button onClick={() => { setShowForm(true); setEditingId(null); setForm({ program_id: '', session_id: '', amount: '', level: '' }); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Fee Structure
          </Button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
              {editingId ? 'Edit Fee Structure' : 'New Fee Structure'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Program</label>
                <select
                  value={form.program_id}
                  onChange={(e) => setForm({ ...form, program_id: e.target.value })}
                  required
                  disabled={!!editingId}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  <option value="">Select program…</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.code} – {p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Academic Session</label>
                <select
                  value={form.session_id}
                  onChange={(e) => setForm({ ...form, session_id: e.target.value })}
                  required
                  disabled={!!editingId}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
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
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button type="submit" isLoading={isSaving} className="flex-1">Save</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : feeStructures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <DollarSign className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">No fee structures defined yet.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Program</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Session</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Amount</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {feeStructures.map((fs) => (
                  <tr key={fs.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {fs.programs?.code || '–'} – {fs.programs?.name || '–'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{fs.academic_sessions?.name || '–'}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{fmt(fs.amount)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button onClick={() => handleEdit(fs)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(fs.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
