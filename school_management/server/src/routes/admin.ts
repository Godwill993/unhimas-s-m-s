import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { generateStudentReport, generateClassReports } from '../services/reportService.js';
import { generatePDF, mergePDFs } from '../services/pdfService.js';

export const adminRouter = Router();

// All admin routes require authentication + admin role
adminRouter.use(authenticate, requireRole('admin'));

// ─── USER MANAGEMENT ──────────────────────────────────────

/**
 * GET /api/admin/users
 * List all staff accounts
 */
adminRouter.get('/users', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ users: data });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * POST /api/admin/users
 * Create a new staff account (teacher or discipline)
 * Body: { email, password, full_name, role }
 */
adminRouter.post('/users', async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name || !role) {
      res.status(400).json({ error: 'All fields are required: email, password, full_name, role' });
      return;
    }

    if (!['teacher', 'discipline', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Role must be teacher, discipline, or admin' });
      return;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      res.status(400).json({ error: authError.message });
      return;
    }

    // Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    res.status(201).json({ user: profile });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update a staff account (name, role, active status)
 */
adminRouter.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates: Record<string, unknown> = {};

    if (req.body.full_name) updates.full_name = req.body.full_name;
    if (req.body.role) updates.role = req.body.role;
    if (typeof req.body.active === 'boolean') updates.active = req.body.active;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ user: data });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ─── CLASS MANAGEMENT ─────────────────────────────────────

/**
 * GET /api/admin/classes
 */
adminRouter.get('/classes', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('classes')
      .select(`
        *,
        subjects (id, name, coefficient),
        students:students(count)
      `)
      .order('name');

    if (error) throw error;
    res.json({ classes: data });
  } catch (err) {
    console.error('List classes error:', err);
    res.status(500).json({ error: 'Failed to list classes' });
  }
});

/**
 * POST /api/admin/classes
 * Body: { name, stream? }
 */
adminRouter.post('/classes', async (req, res) => {
  try {
    const { name, stream } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Class name is required' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('classes')
      .insert({ name, stream: stream || null })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: 'This class already exists' });
        return;
      }
      throw error;
    }
    res.status(201).json({ class: data });
  } catch (err) {
    console.error('Create class error:', err);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

/**
 * PATCH /api/admin/classes/:id
 */
adminRouter.patch('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, stream } = req.body;

    const { data, error } = await supabaseAdmin
      .from('classes')
      .update({ name, stream: stream || null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ class: data });
  } catch (err) {
    console.error('Update class error:', err);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

/**
 * DELETE /api/admin/classes/:id
 */
adminRouter.delete('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete class error:', err);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

// ─── SUBJECT MANAGEMENT ───────────────────────────────────

/**
 * GET /api/admin/subjects
 */
adminRouter.get('/subjects', async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('subjects')
      .select(`
        *,
        class:classes(id, name, stream),
        teacher_subjects(teacher_id, profiles:teacher_id(full_name))
      `)
      .order('name');

    if (req.query.class_id) {
      query = query.eq('class_id', req.query.class_id as string);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ subjects: data });
  } catch (err) {
    console.error('List subjects error:', err);
    res.status(500).json({ error: 'Failed to list subjects' });
  }
});

/**
 * POST /api/admin/subjects
 * Body: { name, class_id, coefficient }
 */
adminRouter.post('/subjects', async (req, res) => {
  try {
    const { name, class_id, coefficient } = req.body;

    if (!name || !class_id) {
      res.status(400).json({ error: 'Subject name and class_id are required' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .insert({ name, class_id, coefficient: coefficient || 1 })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: 'This subject already exists for this class' });
        return;
      }
      throw error;
    }
    res.status(201).json({ subject: data });
  } catch (err) {
    console.error('Create subject error:', err);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

/**
 * PATCH /api/admin/subjects/:id
 */
adminRouter.patch('/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, class_id, coefficient } = req.body;

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (class_id) updates.class_id = class_id;
    if (coefficient !== undefined) updates.coefficient = coefficient;

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ subject: data });
  } catch (err) {
    console.error('Update subject error:', err);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

/**
 * DELETE /api/admin/subjects/:id
 */
adminRouter.delete('/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete subject error:', err);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// ─── TEACHER-SUBJECT ASSIGNMENTS ──────────────────────────

/**
 * POST /api/admin/teacher-subjects
 * Body: { teacher_id, subject_id }
 */
adminRouter.post('/teacher-subjects', async (req, res) => {
  try {
    const { teacher_id, subject_id } = req.body;

    if (!teacher_id || !subject_id) {
      res.status(400).json({ error: 'teacher_id and subject_id are required' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('teacher_subjects')
      .insert({ teacher_id, subject_id })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: 'This assignment already exists' });
        return;
      }
      throw error;
    }
    res.status(201).json({ assignment: data });
  } catch (err) {
    console.error('Assign teacher error:', err);
    res.status(500).json({ error: 'Failed to assign teacher' });
  }
});

/**
 * DELETE /api/admin/teacher-subjects
 * Body: { teacher_id, subject_id }
 */
adminRouter.delete('/teacher-subjects', async (req, res) => {
  try {
    const { teacher_id, subject_id } = req.body;

    const { error } = await supabaseAdmin
      .from('teacher_subjects')
      .delete()
      .eq('teacher_id', teacher_id)
      .eq('subject_id', subject_id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Remove teacher assignment error:', err);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
});

// ─── STUDENT MANAGEMENT ──────────────────────────────────

/**
 * GET /api/admin/students
 */
adminRouter.get('/students', async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('students')
      .select(`
        *,
        class:classes(id, name, stream)
      `)
      .order('full_name');

    if (req.query.class_id) {
      query = query.eq('class_id', req.query.class_id as string);
    }

    if (req.query.active !== undefined) {
      query = query.eq('active', req.query.active === 'true');
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ students: data });
  } catch (err) {
    console.error('List students error:', err);
    res.status(500).json({ error: 'Failed to list students' });
  }
});

/**
 * POST /api/admin/students
 * Body: { full_name, class_id, guardian_name?, guardian_contact?, dob?, gender? }
 * Auto-generates student_code
 */
adminRouter.post('/students', async (req, res) => {
  try {
    const { full_name, class_id, guardian_name, guardian_contact, dob, gender } = req.body;

    if (!full_name || !class_id) {
      res.status(400).json({ error: 'full_name and class_id are required' });
      return;
    }

    // Get class name for code generation
    const { data: classData } = await supabaseAdmin
      .from('classes')
      .select('name')
      .eq('id', class_id)
      .single();

    if (!classData) {
      res.status(400).json({ error: 'Invalid class_id' });
      return;
    }

    // Generate student code
    const { data: codeData } = await supabaseAdmin
      .rpc('generate_student_code', {
        p_class_name: classData.name,
      });

    const student_code = codeData || `SCH-${new Date().getFullYear()}-${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from('students')
      .insert({
        student_code,
        full_name,
        class_id,
        guardian_name: guardian_name || null,
        guardian_contact: guardian_contact || null,
        dob: dob || null,
        gender: gender || null,
      })
      .select(`*, class:classes(id, name, stream)`)
      .single();

    if (error) throw error;
    res.status(201).json({ student: data });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

/**
 * PATCH /api/admin/students/:id
 */
adminRouter.patch('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, class_id, guardian_name, guardian_contact, dob, gender, active } = req.body;

    const updates: Record<string, unknown> = {};
    if (full_name) updates.full_name = full_name;
    if (class_id) updates.class_id = class_id;
    if (guardian_name !== undefined) updates.guardian_name = guardian_name;
    if (guardian_contact !== undefined) updates.guardian_contact = guardian_contact;
    if (dob !== undefined) updates.dob = dob;
    if (gender !== undefined) updates.gender = gender;
    if (typeof active === 'boolean') updates.active = active;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('students')
      .update(updates)
      .eq('id', id)
      .select(`*, class:classes(id, name, stream)`)
      .single();

    if (error) throw error;
    res.json({ student: data });
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// ─── ACADEMIC PERIODS ─────────────────────────────────────

/**
 * GET /api/admin/periods
 */
adminRouter.get('/periods', async (_req, res) => {
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

/**
 * POST /api/admin/periods
 * Body: { year, term, sequence }
 */
adminRouter.post('/periods', async (req, res) => {
  try {
    const { year, term, sequence, active } = req.body;

    if (!year || !term || !sequence) {
      res.status(400).json({ error: 'year, term, and sequence are required' });
      return;
    }

    // If setting as active, deactivate all others first
    if (active) {
      await supabaseAdmin
        .from('academic_periods')
        .update({ active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { data, error } = await supabaseAdmin
      .from('academic_periods')
      .insert({ year, term, sequence, active: active || false })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: 'This period already exists' });
        return;
      }
      throw error;
    }
    res.status(201).json({ period: data });
  } catch (err) {
    console.error('Create period error:', err);
    res.status(500).json({ error: 'Failed to create period' });
  }
});

/**
 * PATCH /api/admin/periods/:id
 */
adminRouter.patch('/periods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    // If setting as active, deactivate all others first
    if (active) {
      await supabaseAdmin
        .from('academic_periods')
        .update({ active: false })
        .neq('id', id);
    }

    const { data, error } = await supabaseAdmin
      .from('academic_periods')
      .update({ active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ period: data });
  } catch (err) {
    console.error('Update period error:', err);
    res.status(500).json({ error: 'Failed to update period' });
  }
});

// ─── DASHBOARD ────────────────────────────────────────────

/**
 * GET /api/admin/dashboard
 * Returns aggregate statistics
 */
adminRouter.get('/dashboard', async (_req, res) => {
  try {
    const [
      { count: totalStudents },
      { count: totalTeachers },
      { count: totalClasses },
      { data: activePeriod },
    ] = await Promise.all([
      supabaseAdmin.from('students').select('*', { count: 'exact', head: true }).eq('active', true),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher').eq('active', true),
      supabaseAdmin.from('classes').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('academic_periods').select('*').eq('active', true).maybeSingle(),
    ]);

    // Get class averages for active period
    let classAverages: Array<{ class_name: string; average: number }> = [];
    if (activePeriod) {
      const { data: scores } = await supabaseAdmin
        .from('scores')
        .select(`
          mark,
          subject:subjects(coefficient, class_id),
          student:students(class_id, class:classes(name, stream))
        `)
        .eq('period_id', activePeriod.id);

      if (scores && scores.length > 0) {
        const classMap = new Map<string, { totalWeighted: number; totalCoeff: number; count: number }>();

        for (const score of scores as any[]) {
          const className = score.student?.class?.name + (score.student?.class?.stream ? ` (${score.student.class.stream})` : '');
          const coeff = score.subject?.coefficient || 1;

          if (!classMap.has(className)) {
            classMap.set(className, { totalWeighted: 0, totalCoeff: 0, count: 0 });
          }

          const entry = classMap.get(className)!;
          entry.totalWeighted += score.mark * coeff;
          entry.totalCoeff += coeff;
          entry.count++;
        }

        classAverages = Array.from(classMap.entries()).map(([name, data]) => ({
          class_name: name,
          average: Math.round((data.totalWeighted / data.totalCoeff) * 100) / 100,
        }));
      }
    }

    // Recent discipline records
    const { data: recentDiscipline } = await supabaseAdmin
      .from('discipline_records')
      .select(`
        *,
        student:students(full_name, student_code)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      stats: {
        totalStudents: totalStudents || 0,
        totalTeachers: totalTeachers || 0,
        totalClasses: totalClasses || 0,
        activePeriod,
      },
      classAverages,
      recentDiscipline: recentDiscipline || [],
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// ─── REPORT PDF GENERATION ────────────────────────────────

/**
 * GET /api/admin/reports/student/:id/pdf
 * Query: ?period_id=
 */
adminRouter.get('/reports/student/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const { period_id } = req.query;

    if (!period_id) {
      res.status(400).json({ error: 'period_id is required' });
      return;
    }

    // Import dynamically to avoid circular deps
    const { generateStudentReport } = await import('../services/reportService.js');
    const { generatePDF } = await import('../services/pdfService.js');

    const reportData = await generateStudentReport(id, period_id as string);
    const pdfBuffer = await generatePDF(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report_${reportData.student.student_code}_${reportData.period.label}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Generate student PDF error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/admin/reports/class/:id/pdf
 * Query: ?period_id=&format=merged|zip
 */
adminRouter.get('/reports/class/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const { period_id, format = 'zip' } = req.query;

    if (!period_id) {
      res.status(400).json({ error: 'period_id is required' });
      return;
    }

    const { generateClassReports } = await import('../services/reportService.js');
    const { generatePDF } = await import('../services/pdfService.js');

    const reports = await generateClassReports(id, period_id as string);

    if (format === 'zip') {
      const archiver = (await import('archiver')).default;
      const archive = archiver('zip', { zlib: { level: 9 } });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="class_reports.zip"`);

      archive.pipe(res);

      for (const report of reports) {
        const pdfBuffer = await generatePDF(report);
        archive.append(pdfBuffer, {
          name: `${report.student.student_code}_${report.student.full_name}.pdf`,
        });
      }

      await archive.finalize();
    } else {
      // Merged: concatenate PDFs (simplified — each as separate response for now)
      // For true merge, we'd use pdf-lib to merge
      const { mergePDFs } = await import('../services/pdfService.js');
      const pdfBuffers: Buffer[] = [];

      for (const report of reports) {
        const pdfBuffer = await generatePDF(report);
        pdfBuffers.push(pdfBuffer);
      }

      const mergedPdf = await mergePDFs(pdfBuffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="class_reports_merged.pdf"`);
      res.send(mergedPdf);
    }
  } catch (err) {
    console.error('Generate class PDFs error:', err);
    res.status(500).json({ error: 'Failed to generate class reports' });
  }
});

// ─── SCORES (Admin override) ──────────────────────────────

/**
 * GET /api/admin/scores
 * Query: ?class_id=&period_id=&subject_id=
 */
adminRouter.get('/scores', async (req, res) => {
  try {
    const { class_id, period_id, subject_id } = req.query;

    let query = supabaseAdmin
      .from('scores')
      .select(`
        *,
        student:students(id, full_name, student_code),
        subject:subjects(id, name, coefficient),
        period:academic_periods(id, year, term, sequence, label),
        entered_by_profile:profiles!entered_by(full_name)
      `);

    if (period_id) query = query.eq('period_id', period_id as string);
    if (subject_id) query = query.eq('subject_id', subject_id as string);
    if (class_id) {
      query = query.in('student_id',
        (await supabaseAdmin.from('students').select('id').eq('class_id', class_id as string)).data?.map(s => s.id) || []
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ scores: data });
  } catch (err) {
    console.error('List scores error:', err);
    res.status(500).json({ error: 'Failed to list scores' });
  }
});
