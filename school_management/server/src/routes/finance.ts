import { Router } from 'express';
import crypto from 'crypto';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

export const financeRouter = Router();

// Only finance role or admin
financeRouter.use(authenticate, requireRole('finance', 'admin'));

// ─────────────────────────────────────────────────────────────
// 1. FINANCE DASHBOARD STATS
// ─────────────────────────────────────────────────────────────
financeRouter.get('/dashboard', async (_req, res) => {
  try {
    const { data: invoices } = await supabaseAdmin.from('invoices').select('amount, status');
    const { data: payments } = await supabaseAdmin.from('payments').select('amount');

    const totalInvoiced = invoices?.reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;
    const totalCollected = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    const outstanding = totalInvoiced - totalCollected;

    const paidInvoices = invoices?.filter((i) => i.status === 'paid').length || 0;
    const pendingInvoices = invoices?.filter((i) => i.status === 'pending').length || 0;
    const partialInvoices = invoices?.filter((i) => i.status === 'partial').length || 0;

    // Recent payments
    const { data: recentPayments } = await supabaseAdmin
      .from('payments')
      .select('*, invoices(student_id, students(matricule, user_profiles(full_name)))')
      .order('payment_date', { ascending: false })
      .limit(10);

    res.json({
      metrics: {
        totalInvoiced,
        totalCollected,
        outstanding,
        paidInvoices,
        pendingInvoices,
        partialInvoices,
      },
      recentPayments: recentPayments || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. FEE STRUCTURES
// ─────────────────────────────────────────────────────────────
financeRouter.get('/fee-structures', async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('fee_structures')
      .select('*, programs(code, name, level), academic_sessions(name)');

    if (req.query.session_id) query = query.eq('session_id', req.query.session_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ feeStructures: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

financeRouter.post('/fee-structures', async (req, res) => {
  try {
    const { program_id, session_id, level, amount } = req.body;
    if (!program_id || !session_id || !level || amount === undefined) {
      return res.status(400).json({ error: 'Program, session, level, and amount are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('fee_structures')
      .upsert({ program_id, session_id, level, amount: Number(amount) }, { onConflict: 'program_id,session_id,level' })
      .select('*, programs(code, name), academic_sessions(name)')
      .single();

    if (error) throw error;
    res.status(201).json({ feeStructure: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. INVOICES
// ─────────────────────────────────────────────────────────────
financeRouter.get('/invoices', async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('invoices')
      .select('*, students(matricule, user_profiles(full_name)), academic_sessions(name), payments(*)')
      .order('created_at', { ascending: false });

    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.student_id) query = query.eq('student_id', req.query.student_id);

    const { data, error } = await query;
    if (error) throw error;

    // Compute balance on each invoice
    const computed = (data || []).map((inv: any) => {
      const paid = inv.payments?.reduce((s: number, p: any) => s + Number(p.amount || 0), 0) || 0;
      return {
        ...inv,
        amountPaid: paid,
        balance: Math.max(0, Number(inv.amount) - paid),
      };
    });

    res.json({ invoices: computed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

financeRouter.post('/invoices', async (req, res) => {
  try {
    const { student_id, session_id, amount, due_date } = req.body;
    if (!student_id || !session_id || !amount || !due_date) {
      return res.status(400).json({ error: 'Student, session, amount, and due_date are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('invoices')
      .insert({
        student_id,
        session_id,
        amount: Number(amount),
        due_date,
        status: 'pending',
      })
      .select('*, students(matricule, user_profiles(full_name)), academic_sessions(name)')
      .single();

    if (error) throw error;
    res.status(201).json({ invoice: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. PAYMENTS & RECEIPT ISSUANCE
// ─────────────────────────────────────────────────────────────
financeRouter.post('/payments', async (req, res) => {
  try {
    const { invoice_id, amount, payment_date } = req.body;
    const recordedBy = req.user!.id;

    if (!invoice_id || !amount) {
      return res.status(400).json({ error: 'Invoice ID and amount are required' });
    }

    // Generate unique receipt number: RCPT-{YEAR}-{RANDOM}
    const currentYear = new Date().getFullYear();
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    const receiptNumber = `RCPT-${currentYear}-${rand}`;

    const { data: payment, error: payError } = await supabaseAdmin
      .from('payments')
      .insert({
        invoice_id,
        amount: Number(amount),
        payment_date: payment_date || new Date().toISOString(),
        receipt_number: receiptNumber,
        recorded_by: recordedBy,
      })
      .select('*, user_profiles(full_name)')
      .single();

    if (payError) throw payError;

    // Check invoice total and update status
    const { data: allPayments } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('invoice_id', invoice_id);

    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('amount, student_id, students(matricule, user_profiles(full_name))')
      .eq('id', invoice_id)
      .single();

    const totalPaid = (allPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const invoiceAmount = Number(invoice?.amount || 0);

    let newStatus = 'pending';
    if (totalPaid >= invoiceAmount) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partial';
    }

    await supabaseAdmin.from('invoices').update({ status: newStatus }).eq('id', invoice_id);

    res.status(201).json({
      success: true,
      payment,
      receipt: {
        receiptNumber,
        amount: Number(amount),
        paymentDate: payment.payment_date,
        studentName: (invoice as any)?.students?.user_profiles?.full_name,
        matricule: (invoice as any)?.students?.matricule,
        invoiceAmount,
        totalPaidToDate: totalPaid,
        balanceRemaining: Math.max(0, invoiceAmount - totalPaid),
        status: newStatus,
        recordedBy: req.user!.full_name,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. DEFAULTER REPORTS
// ─────────────────────────────────────────────────────────────
financeRouter.get('/defaulters', async (_req, res) => {
  try {
    const { data: invoices, error } = await supabaseAdmin
      .from('invoices')
      .select('*, students(matricule, level, user_profiles(full_name, email, contact:id)), academic_sessions(name), payments(amount)')
      .neq('status', 'paid');

    if (error) throw error;

    const defaulters = (invoices || [])
      .map((inv: any) => {
        const paid = (inv.payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
        const bal = Number(inv.amount) - paid;
        return {
          invoiceId: inv.id,
          matricule: inv.students?.matricule,
          studentName: inv.students?.user_profiles?.full_name,
          level: inv.students?.level,
          sessionName: inv.academic_sessions?.name,
          dueDate: inv.due_date,
          invoicedAmount: Number(inv.amount),
          paidAmount: paid,
          balanceDue: bal,
          status: inv.status,
        };
      })
      .filter((d) => d.balanceDue > 0);

    res.json({ defaulters });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
