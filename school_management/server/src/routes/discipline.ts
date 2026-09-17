import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

export const disciplineRouter = Router();

// All discipline routes require authentication + discipline (or admin) role
disciplineRouter.use(authenticate, requireRole('discipline', 'admin'));

/**
 * GET /api/discipline/students
 * Query: ?class_id=&search=
 * Search students by name or code, optionally filter by class
 */
disciplineRouter.get('/students', async (req, res) => {
  try {
    const { class_id, search } = req.query;

    let query = supabaseAdmin
      .from('students')
      .select(`
        id, student_code, full_name, active,
        class:classes(id, name, stream)
      `)
      .eq('active', true)
      .order('full_name');

    if (class_id) {
      query = query.eq('class_id', class_id as string);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`full_name.ilike.${searchTerm},student_code.ilike.${searchTerm}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ students: data });
  } catch (err) {
    console.error('Search students error:', err);
    res.status(500).json({ error: 'Failed to search students' });
  }
});

/**
 * POST /api/discipline/records
 * Body: { student_id, date, type, notes }
 * Log a discipline incident
 */
disciplineRouter.post('/records', async (req, res) => {
  try {
    const { student_id, date, type, notes } = req.body;

    if (!student_id || !date || !type) {
      res.status(400).json({ error: 'student_id, date, and type are required' });
      return;
    }

    if (!['absence', 'lateness', 'misconduct', 'sanction'].includes(type)) {
      res.status(400).json({ error: 'type must be one of: absence, lateness, misconduct, sanction' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('discipline_records')
      .insert({
        student_id,
        date,
        type,
        notes: notes || null,
        recorded_by: req.user!.id,
      })
      .select(`
        *,
        student:students(full_name, student_code),
        recorded_by_profile:profiles!recorded_by(full_name)
      `)
      .single();

    if (error) throw error;
    res.status(201).json({ record: data });
  } catch (err) {
    console.error('Create discipline record error:', err);
    res.status(500).json({ error: 'Failed to create discipline record' });
  }
});

/**
 * GET /api/discipline/records
 * Query: ?student_id=&class_id=&type=&start_date=&end_date=
 * View discipline history
 */
disciplineRouter.get('/records', async (req, res) => {
  try {
    const { student_id, class_id, type, start_date, end_date } = req.query;

    let query = supabaseAdmin
      .from('discipline_records')
      .select(`
        *,
        student:students(id, full_name, student_code, class:classes(name, stream)),
        recorded_by_profile:profiles!recorded_by(full_name)
      `)
      .order('date', { ascending: false });

    if (student_id) {
      query = query.eq('student_id', student_id as string);
    }

    if (class_id) {
      // Filter by class: get student IDs in this class first
      const { data: students } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('class_id', class_id as string);

      const studentIds = students?.map(s => s.id) || [];
      if (studentIds.length > 0) {
        query = query.in('student_id', studentIds);
      } else {
        res.json({ records: [] });
        return;
      }
    }

    if (type) {
      query = query.eq('type', type as string);
    }

    if (start_date) {
      query = query.gte('date', start_date as string);
    }

    if (end_date) {
      query = query.lte('date', end_date as string);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ records: data });
  } catch (err) {
    console.error('List discipline records error:', err);
    res.status(500).json({ error: 'Failed to list discipline records' });
  }
});

/**
 * GET /api/discipline/classes
 * Returns all classes (for filtering)
 */
disciplineRouter.get('/classes', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('classes')
      .select('id, name, stream')
      .order('name');

    if (error) throw error;
    res.json({ classes: data });
  } catch (err) {
    console.error('List classes error:', err);
    res.status(500).json({ error: 'Failed to list classes' });
  }
});
