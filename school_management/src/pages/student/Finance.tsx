import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DollarSign, CheckCircle2, Clock, AlertCircle, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Invoice, Payment } from '../../types';

const statusColors: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  partial: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  pending: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
};

export const StudentFinance: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/student/finance');
        setInvoices(res.data.invoices || []);
        setSummary(res.data.summary);
      } catch {
        toast.error('Failed to load finance information');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]"><Spinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Tuition Fees & Invoices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your financial account overview</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Billed', value: fmt(summary.totalBilled ?? 0), icon: DollarSign, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
              { label: 'Amount Paid', value: fmt(summary.totalPaid ?? 0), icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
              { label: 'Outstanding Balance', value: fmt(summary.totalBalance ?? 0), icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 flex items-center space-x-4 shadow-sm">
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{card.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Outstanding Alert */}
        {summary && summary.totalBalance > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 rounded-2xl p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Outstanding Balance: {fmt(summary.totalBalance)}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Please visit the Finance Office to make your payment. Retain your receipt for our records.
              </p>
            </div>
          </div>
        )}

        {/* Invoices */}
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <CreditCard className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">No invoices issued yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => {
              const isExpanded = expandedId === inv.id;
              return (
                <div key={inv.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                  >
                    <div className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2.5 rounded-xl ${inv.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-950/40' : inv.status === 'partial' ? 'bg-amber-50 dark:bg-amber-950/40' : 'bg-rose-50 dark:bg-rose-950/40'}`}>
                          {inv.status === 'paid' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          ) : inv.status === 'partial' ? (
                            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {inv.academic_sessions?.name || 'Academic Session'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Due: {new Date(inv.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-base font-bold text-slate-900 dark:text-slate-50">{fmt(inv.amount)}</p>
                          <p className="text-xs text-slate-500">Balance: {fmt(inv.balance ?? inv.amount)}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColors[inv.status]}`}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded: Payment history */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 bg-slate-50/50 dark:bg-slate-800/30">
                      {inv.payments && inv.payments.length > 0 ? (
                        <>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">Payment History</p>
                          <div className="space-y-2">
                            {inv.payments.map((p: Payment) => (
                              <div key={p.id} className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="font-mono text-xs text-slate-500">{p.receipt_number}</span>
                                  <span className="text-xs text-slate-400">· {new Date(p.payment_date).toLocaleDateString()}</span>
                                </div>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(p.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No payments recorded yet.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
