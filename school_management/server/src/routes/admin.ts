import { Router } from 'express';
import crypto from 'crypto';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

export const adminRouter = Router();

// All admin routes require authentication + admin role
adminRouter.use(authenticate, requireRole('admin'));

// Helper: Log audit trail
async function logAudit(tableName: string, recordId: string | null, action: string, performedBy?: string, payload?: any) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      table_name: tableName,
      record_id: recordId,
      action,
      performed_by: performedBy,
      payload,
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// 1. DASHBOARD OVERVIEW STATS
// ─────────────────────────────────────────────────────────────
adminRouter.get('/dashboard/stats', async (_req, res) => {
  try {
    const [
      { count: studentsCount },
      { count: lecturersCount },
      { count: facultiesCount },
      { count: programsCount },
      { count: coursesCount },
      { data: activeSession },
    ] = await Promise.all([
      supabaseAdmin.from('students').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('lecturers').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('faculties').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('programs').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('courses').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('academic_sessions').select('*').eq('is_active', true).maybeSingle(),
    ]);

    // Financial summaries
    const { data: invoices } = await supabaseAdmin.from('invoices').select('amount, status');
    const { data: payments } = await supabaseAdmin.from('payments').select('amount');

    const totalInvoiced = invoices?.reduce((sum, inv) => sum + Number(inv.amount || 0), 0) || 0;
    const totalCollected = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
    const outstanding = totalInvoiced - totalCollected;

    // Recent registrations
    const { data: recentStudents } = await supabaseAdmin
      .from('students')
      .select('id, matricule, level, entry_year, user_profiles(full_name, email), programs(code, name)')
      .order('entry_year', { ascending: false })
      .limit(6);

    res.json({
      stats: {
        totalStudents: studentsCount || 0,
        totalLecturers: lecturersCount || 0,
        totalFaculties: facultiesCount || 0,
        totalPrograms: programsCount || 0,
        totalCourses: coursesCount || 0,
        activeSession: activeSession?.name || 'None Active',
        totalInvoiced,
        totalCollected,
        outstanding,
      },
      recentStudents: recentStudents || [],
    });
  } catch (err: any) {
    console.error('Admin dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. ACADEMIC STRUCTURE (Faculties, Depts, Programs, Courses, Sessions)
// ─────────────────────────────────────────────────────────────

// --- Faculties ---
adminRouter.get('/faculties', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('faculties').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ faculties: data });
});

adminRouter.post('/faculties', async (req, res) => {
  const { code, name, description } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'Faculty code and name are required' });

  const { data, error } = await supabaseAdmin
    .from('faculties')
    .insert({ code: code.toUpperCase(), name, description })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit('faculties', data.id, 'INSERT', req.user?.id, data);
  res.status(201).json({ faculty: data });
});

adminRouter.put('/faculties/:id', async (req, res) => {
  const { code, name, description } = req.body;
  const { data, error } = await supabaseAdmin
    .from('faculties')
    .update({ code: code?.toUpperCase(), name, description })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit('faculties', data.id, 'UPDATE', req.user?.id, data);
  res.json({ faculty: data });
});

adminRouter.delete('/faculties/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('faculties').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  await logAudit('faculties', req.params.id, 'DELETE', req.user?.id);
  res.json({ success: true });
});

// --- Departments ---
adminRouter.get('/departments', async (req, res) => {
  let query = supabaseAdmin.from('departments').select('*, faculties(id, code, name)').order('name');
  if (req.query.faculty_id) {
    query = query.eq('faculty_id', req.query.faculty_id);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ departments: data });
});

adminRouter.post('/departments', async (req, res) => {
  const { faculty_id, code, name } = req.body;
  if (!faculty_id || !code || !name) return res.status(400).json({ error: 'Faculty, code, and name are required' });

  const { data, error } = await supabaseAdmin
    .from('departments')
    .insert({ faculty_id, code: code.toUpperCase(), name })
    .select('*, faculties(id, code, name)')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit('departments', data.id, 'INSERT', req.user?.id, data);
  res.status(201).json({ department: data });
});

adminRouter.put('/departments/:id', async (req, res) => {
  const { faculty_id, code, name } = req.body;
  const { data, error } = await supabaseAdmin
    .from('departments')
    .update({ faculty_id, code: code?.toUpperCase(), name })
    .eq('id', req.params.id)
    .select('*, faculties(id, code, name)')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit('departments', data.id, 'UPDATE', req.user?.id, data);
  res.json({ department: data });
});

adminRouter.delete('/departments/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('departments').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  await logAudit('departments', req.params.id, 'DELETE', req.user?.id);
  res.json({ success: true });
});

// --- Programs (HND, BTS, Bachelor's, Master's) ---
adminRouter.get('/programs', async (req, res) => {
  let query = supabaseAdmin.from('programs').select('*, departments(id, code, name, faculties(id, code, name))').order('name');
  if (req.query.department_id) {
    query = query.eq('department_id', req.query.department_id);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ programs: data });
});

adminRouter.post('/programs', async (req, res) => {
  const { department_id, code, name, level } = req.body;
  if (!department_id || !code || !name || !level) {
    return res.status(400).json({ error: 'Department, code, name, and level (HND, BTS, Bachelor''s, Master''s) are required' });
  }

  const { data, error } = await supabaseAdmin
    .from('programs')
    .insert({ department_id, code: code.toUpperCase(), name, level })
    .select('*, departments(id, code, name)')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit('programs', data.id, 'INSERT', req.user?.id, data);
  res.status(201).json({ program: data });
});

adminRouter.put('/programs/:id', async (req, res) => {
  const { department_id, code, name, level } = req.body;
  const { data, error } = await supabaseAdmin
    .from('programs')
    .update({ department_id, code: code?.toUpperCase(), name, level })
    .eq('id', req.params.id)
    .select('*, departments(id, code, name)')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit('programs', data.id, 'UPDATE', req.user?.id, data);
  res.json({ program: data });
});

adminRouter.delete('/programs/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('programs').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  await logAudit('programs', req.params.id, 'DELETE', req.user?.id);
  res.json({ success: true });
});

// --- Courses ---
adminRouter.get('/courses', async (req, res) => {
  let query = supabaseAdmin.from('courses').select('*, programs(id, code, name, level)').order('code');
  if (req.query.program_id) {
    query = query.eq('program_id', req.query.program_id);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ courses: data });
});

adminRouter.post('/courses', async (req, res) => {
  const { program_id, code, name, credits, semester } = req.body;
  if (!program_id || !code || !name || credits === undefined || semester === undefined) {
    return res.status(400).json({ error: 'Program, code, name, credits, and semester are required' });
  }

  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert({
      program_id,
      code: code.toUpperCase(),
      name,
      credits: Number(credits),
      semester: Number(semester),
    })
    .select('*, programs(id, code, name)')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit('courses', data.id, 'INSERT', req.user?.id, data);
  res.status(201).json({ course: data });
});

adminRouter.put('/courses/:id', async (req, res) => {
  const { program_id, code, name, credits, semester } = req.body;
  const { data, error } = await supabaseAdmin
    .from('courses')
    .update({
      program_id,
      code: code?.toUpperCase(),
      name,
      credits: Number(credits),
      semester: Number(semester),
    })
    .eq('id', req.params.id)
    .select('*, programs(id, code, name)')
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit('courses', data.id, 'UPDATE', req.user?.id, data);
  res.json({ course: data });
});

adminRouter.delete('/courses/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('courses').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  await logAudit('courses', req.params.id, 'DELETE', req.user?.id);
  res.json({ success: true });
});

// --- Academic Sessions (e.g. 2025/2026) ---
adminRouter.get('/sessions', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('academic_sessions').select('*').order('name', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ sessions: data });
});

adminRouter.post('/sessions', async (req, res) => {
  const { name, is_active } = req.body;
  if (!name) return res.status(400).json({ error: 'Session name (e.g. 2025/2026) is required' });

  // If activating this session, deactivate others
  if (is_active) {
    await supabaseAdmin.from('academic_sessions').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
  }

  const { data, error } = await supabaseAdmin
    .from('academic_sessions')
    .insert({ name, is_active: Boolean(is_active) })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit('academic_sessions', data.id, 'INSERT', req.user?.id, data);
  res.status(201).json({ session: data });
});

adminRouter.put('/sessions/:id/activate', async (req, res) => {
  const { id } = req.params;
  // Deactivate all first
  await supabaseAdmin.from('academic_sessions').update({ is_active: false }).neq('id', id);
  // Activate selected
  const { data, error } = await supabaseAdmin
    .from('academic_sessions')
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  await logAudit('academic_sessions', id, 'ACTIVATE', req.user?.id);
  res.json({ session: data });
});

// ─────────────────────────────────────────────────────────────
// 3. STUDENT REGISTRATION FLOW (Admin-only, One-by-One Form)
// ─────────────────────────────────────────────────────────────
/**
 * POST /api/admin/students/register
 * Admin fills: name, DOB, gender, contact, program, level, entry year
 * Auto-generates:
 * - Matricule: UNH{YY}-{PROGRAM_CODE}-{sequential number} (e.g. UNH24-CS-0042)
 * - Temporary portal password (8 alphanumeric characters)
 * - Results PIN (e.g. 6-digit PIN derived/generated, stored hashed with sha256 or bcrypt)
 * - Supabase Auth User with synthetic email: {matricule.toLowerCase()}@unhimas.local
 * - Returns printable credentials slip
 */
adminRouter.post('/students/register', async (req, res) => {
  try {
    const { full_name, dob, gender, contact, program_id, level, entry_year } = req.body;

    if (!full_name || !dob || !gender || !program_id || !level || !entry_year) {
      return res.status(400).json({
        error: 'Missing required fields: full_name, dob, gender, program_id, level, entry_year',
      });
    }

    // 1. Fetch program code
    const { data: program, error: progError } = await supabaseAdmin
      .from('programs')
      .select('code, name')
      .eq('id', program_id)
      .single();

    if (progError || !program) {
      return res.status(400).json({ error: 'Selected program not found' });
    }

    const progCode = program.code.toUpperCase();
    const entryYearNum = Number(entry_year);
    const yy = entryYearNum.toString().slice(-2);

    // 2. Compute sequential number for this program & year
    const { count, error: countError } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', program_id)
      .eq('entry_year', entryYearNum);

    if (countError) throw countError;
    const nextSeq = ((count || 0) + 1).toString().padStart(4, '0');
    const matricule = `UNH${yy}-${progCode}-${nextSeq}`;

    // 3. Generate credentials
    const syntheticEmail = `${matricule.toLowerCase()}@unhimas.local`;
    const tempPassword = 'P@' + crypto.randomBytes(3).toString('hex') + '9'; // e.g. P@3a8f129
    // PIN: 6-digit numeric PIN for results
    const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
    const pinHash = crypto.createHash('sha256').update(rawPin).digest('hex');

    // 4. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: syntheticEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        matricule,
        role: 'student',
      },
    });

    if (authError) {
      return res.status(400).json({ error: `Auth account creation failed: ${authError.message}` });
    }

    const userId = authData.user.id;

    // 5. Insert profile in user_profiles
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      id: userId,
      email: syntheticEmail,
      full_name,
      role: 'student',
    });

    if (profileError) {
      // rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw profileError;
    }

    // 6. Insert student record
    const { data: studentRecord, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        id: userId,
        matricule,
        dob,
        gender,
        contact: contact || null,
        program_id,
        level,
        entry_year: entryYearNum,
        pin_hash: pinHash,
      })
      .select('*, programs(id, code, name, level)')
      .single();

    if (studentError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from('user_profiles').delete().eq('id', userId);
      throw studentError;
    }

    await logAudit('students', userId, 'REGISTER_STUDENT', req.user?.id, { matricule, program_id });

    // 7. Return printable credentials slip payload
    res.status(201).json({
      success: true,
      credentialsSlip: {
        institution: 'UNHIMAS Bilingual University (Yaoundé, Cameroon)',
        studentName: full_name,
        matricule,
        programName: program.name,
        programCode: progCode,
        level,
        entryYear: entryYearNum,
        syntheticEmail,
        portalPassword: tempPassword,
        resultsPin: rawPin,
        portalUrl: 'https://unhimas.edu.cm/login',
        resultsUrl: 'https://unhimas.edu.cm/check-results',
        registeredAt: new Date().toISOString(),
      },
      student: studentRecord,
    });
  } catch (err: any) {
    console.error('Student registration error:', err);
    res.status(500).json({ error: err.message || 'Failed to register student' });
  }
});

// List all students
adminRouter.get('/students', async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('students')
      .select('*, user_profiles(id, full_name, email), programs(id, code, name, level, departments(id, name, faculties(id, name)))')
      .order('matricule', { ascending: false });

    if (req.query.program_id) {
      query = query.eq('program_id', req.query.program_id);
    }
    if (req.query.level) {
      query = query.eq('level', req.query.level);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ students: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. LECTURER MANAGEMENT & COURSE ASSIGNMENTS
// ─────────────────────────────────────────────────────────────

// List all lecturers
adminRouter.get('/lecturers', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lecturers')
      .select('*, user_profiles(id, full_name, email), departments(id, code, name)')
      .order('employee_id');

    if (error) throw error;
    res.json({ lecturers: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new lecturer
adminRouter.post('/lecturers', async (req, res) => {
  try {
    const { email, password, full_name, department_id, employee_id } = req.body;
    if (!email || !password || !full_name || !department_id || !employee_id) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: 'lecturer' },
    });

    if (authError) return res.status(400).json({ error: authError.message });
    const userId = authData.user.id;

    await supabaseAdmin.from('user_profiles').insert({
      id: userId,
      email,
      full_name,
      role: 'lecturer',
    });

    const { data: lecturer, error: lectError } = await supabaseAdmin
      .from('lecturers')
      .insert({
        id: userId,
        department_id,
        employee_id: employee_id.toUpperCase(),
      })
      .select('*, user_profiles(full_name, email), departments(name)')
      .single();

    if (lectError) throw lectError;
    await logAudit('lecturers', userId, 'INSERT', req.user?.id, { employee_id });
    res.status(201).json({ lecturer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Course assignments
adminRouter.get('/course-assignments', async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('course_assignments')
      .select('*, courses(*, programs(name, code)), lecturers(*, user_profiles(full_name, email)), academic_sessions(name)');

    if (req.query.session_id) {
      query = query.eq('session_id', req.query.session_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ assignments: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/course-assignments', async (req, res) => {
  try {
    const { course_id, lecturer_id, session_id } = req.body;
    if (!course_id || !lecturer_id || !session_id) {
      return res.status(400).json({ error: 'Course, Lecturer, and Session are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('course_assignments')
      .insert({ course_id, lecturer_id, session_id })
      .select('*, courses(name, code), lecturers(employee_id, user_profiles(full_name)), academic_sessions(name)')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    await logAudit('course_assignments', data.id, 'ASSIGN_COURSE', req.user?.id, data);
    res.status(201).json({ assignment: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.delete('/course-assignments/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('course_assignments').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────
// 5. GRADE PUBLISHING CONTROLS
// ─────────────────────────────────────────────────────────────
/**
 * PUT /api/admin/grades/publish
 * Body: { course_id, session_id, is_published }
 * Allows admin to publish or unpublish grades
 */
adminRouter.put('/grades/publish', async (req, res) => {
  try {
    const { course_id, session_id, is_published } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    // Find matching enrollments
    let enrollQuery = supabaseAdmin.from('enrollments').select('id').eq('session_id', session_id);
    if (course_id) {
      enrollQuery = enrollQuery.eq('course_id', course_id);
    }

    const { data: enrollments } = await enrollQuery;
    const enrollmentIds = enrollments?.map((e) => e.id) || [];

    if (enrollmentIds.length === 0) {
      return res.json({ updated: 0, message: 'No enrollments found for this criteria' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('grades')
      .update({ is_published: Boolean(is_published) })
      .in('enrollment_id', enrollmentIds);

    if (updateError) throw updateError;
    await logAudit('grades', null, is_published ? 'PUBLISH_GRADES' : 'UNPUBLISH_GRADES', req.user?.id, {
      course_id,
      session_id,
      count: enrollmentIds.length,
    });

    res.json({ success: true, count: enrollmentIds.length, is_published });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. AUDIT LOGS
// ─────────────────────────────────────────────────────────────
adminRouter.get('/audit-logs', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*, user_profiles(full_name, email, role)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ auditLogs: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
