import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

export const teacherRouter = Router();

// All teacher routes require authentication + teacher role
teacherRouter.use(authenticate, requireRole('teacher', 'admin'));

/**
 * GET /api/teacher/classes
 * Returns classes and subjects assigned to the current teacher
 */
teacherRouter.get('/classes', async (req, res) => {
  try {
    const teacherId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from('teacher_subjects')
      .select(`
        subject:subjects(
          id, name, coefficient,
          class:classes(id, name, stream)
        )
      `)
      .eq('teacher_id', teacherId);

    if (error) throw error;

    // Group subjects by class
    const classMap = new Map<string, { class: any; subjects: any[] }>();

    for (const item of data || []) {
      const subject = (item as any).subject;
      if (!subject?.class) continue;

      const classId = subject.class.id;
      if (!classMap.has(classId)) {
        classMap.set(classId, {
          class: subject.class,
          subjects: [],
        });
      }
      classMap.get(classId)!.subjects.push({
        id: subject.id,
        name: subject.name,
        coefficient: subject.coefficient,
      });
    }

    res.json({ classes: Array.from(classMap.values()) });
  } catch (err) {
    console.error('Teacher classes error:', err);
    res.status(500).json({ error: 'Failed to load classes' });
  }
});

/**
 * GET /api/teacher/students
 * Query: ?class_id=
 * Returns students in a class (for score entry grid)
 */
teacherRouter.get('/students', async (req, res) => {
  try {
    const { class_id } = req.query;

    if (!class_id) {
      res.status(400).json({ error: 'class_id is required' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('students')
      .select('id, student_code, full_name')
      .eq('class_id', class_id as string)
      .eq('active', true)
      .order('full_name');

    if (error) throw error;
    res.json({ students: data });
  } catch (err) {
    console.error('Teacher students error:', err);
    res.status(500).json({ error: 'Failed to load students' });
  }
});

/**
 * GET /api/teacher/scores
 * Query: ?subject_id=&period_id=
 * Returns scores for a subject in a period (for the score entry grid)
 */
teacherRouter.get('/scores', async (req, res) => {
  try {
    const { subject_id, period_id } = req.query;

    if (!subject_id || !period_id) {
      res.status(400).json({ error: 'subject_id and period_id are required' });
      return;
    }

    // Verify teacher has access to this subject
    if (req.user!.role === 'teacher') {
      const { data: assignment } = await supabaseAdmin
        .from('teacher_subjects')
        .select('subject_id')
        .eq('teacher_id', req.user!.id)
        .eq('subject_id', subject_id as string)
        .single();

      if (!assignment) {
        res.status(403).json({ error: 'You are not assigned to this subject' });
        return;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('scores')
      .select(`
        id, mark, student_id, updated_at,
        student:students(id, full_name, student_code)
      `)
      .eq('subject_id', subject_id as string)
      .eq('period_id', period_id as string);

    if (error) throw error;
    res.json({ scores: data });
  } catch (err) {
    console.error('Teacher scores error:', err);
    res.status(500).json({ error: 'Failed to load scores' });
  }
});

/**
 * POST /api/teacher/scores
 * Body: { subject_id, period_id, scores: [{ student_id, mark }] }
 * Batch upsert — the spreadsheet "Save All" endpoint
 */
teacherRouter.post('/scores', async (req, res) => {
  try {
    const { subject_id, period_id, scores } = req.body;

    if (!subject_id || !period_id || !Array.isArray(scores)) {
      res.status(400).json({ error: 'subject_id, period_id, and scores array are required' });
      return;
    }

    // Verify teacher has access to this subject
    if (req.user!.role === 'teacher') {
      const { data: assignment } = await supabaseAdmin
        .from('teacher_subjects')
        .select('subject_id')
        .eq('teacher_id', req.user!.id)
        .eq('subject_id', subject_id)
        .single();

      if (!assignment) {
        res.status(403).json({ error: 'You are not assigned to this subject' });
        return;
      }
    }

    // Validate all marks
    for (const score of scores) {
      if (score.mark < 0 || score.mark > 20) {
        res.status(400).json({
          error: `Invalid mark ${score.mark} for student ${score.student_id}. Must be 0-20.`,
        });
        return;
      }
    }

    // Upsert all scores
    const upsertData = scores.map((s: { student_id: string; mark: number }) => ({
      student_id: s.student_id,
      subject_id,
      period_id,
      mark: s.mark,
      entered_by: req.user!.id,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabaseAdmin
      .from('scores')
      .upsert(upsertData, {
        onConflict: 'student_id,subject_id,period_id',
      })
      .select();

    if (error) throw error;
    res.json({ scores: data, count: data?.length || 0 });
  } catch (err) {
    console.error('Save scores error:', err);
    res.status(500).json({ error: 'Failed to save scores' });
  }
});

/**
 * POST /api/teacher/attendance
 * Body: { class_id, date, records: [{ student_id, status }] }
 * Batch upsert attendance for a class session
 */
teacherRouter.post('/attendance', async (req, res) => {
  try {
    const { date, records } = req.body;

    if (!date || !Array.isArray(records)) {
      res.status(400).json({ error: 'date and records array are required' });
      return;
    }

    const upsertData = records.map((r: { student_id: string; status: string }) => ({
      student_id: r.student_id,
      date,
      status: r.status,
      recorded_by: req.user!.id,
    }));

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .upsert(upsertData, {
        onConflict: 'student_id,date',
      })
      .select();

    if (error) throw error;
    res.json({ attendance: data, count: data?.length || 0 });
  } catch (err) {
    console.error('Save attendance error:', err);
    res.status(500).json({ error: 'Failed to save attendance' });
  }
});

/**
 * GET /api/teacher/attendance
 * Query: ?class_id=&date=
 */
teacherRouter.get('/attendance', async (req, res) => {
  try {
    const { class_id, date } = req.query;

    if (!class_id || !date) {
      res.status(400).json({ error: 'class_id and date are required' });
      return;
    }

    // Get students in class
    const { data: students } = await supabaseAdmin
      .from('students')
      .select('id, full_name, student_code')
      .eq('class_id', class_id as string)
      .eq('active', true)
      .order('full_name');

    // Get attendance records for this date
    const studentIds = students?.map(s => s.id) || [];
    const { data: attendance } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('date', date as string)
      .in('student_id', studentIds);

    res.json({ students, attendance: attendance || [] });
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ error: 'Failed to load attendance' });
  }
});

/**
 * GET /api/teacher/periods
 * Returns all academic periods (for period selector dropdown)
 */
teacherRouter.get('/periods', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('academic_periods')
      .select('*')
      .order('year', { ascending: false })
      .order('term')
      .order('sequence');

    if (error) throw error;
    res.json({ periods: data });
  } catch (err) {
    console.error('List periods error:', err);
    res.status(500).json({ error: 'Failed to list periods' });
  }
});
