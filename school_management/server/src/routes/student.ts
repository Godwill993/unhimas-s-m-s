import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

export const studentRouter = Router();

// Require student role or admin
studentRouter.use(authenticate, requireRole('student', 'admin'));

// ─────────────────────────────────────────────────────────────
// 1. STUDENT PROFILE & DASHBOARD SUMMARY
// ─────────────────────────────────────────────────────────────
studentRouter.get('/profile', async (req, res) => {
  try {
    const studentId = req.user!.id;

    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('*, user_profiles(full_name, email), programs(id, code, name, level, departments(name, faculties(name)))')
      .eq('id', studentId)
      .single();

    if (error) throw error;
    res.json({ student });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. COURSE REGISTRATION
// ─────────────────────────────────────────────────────────────
/**
 * GET /api/student/available-courses
 * Returns courses for the student's program and level in the active session
 */
studentRouter.get('/available-courses', async (req, res) => {
  try {
    const studentId = req.user!.id;

    // Get student program
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('program_id, level')
      .eq('id', studentId)
      .single();

    if (!student) return res.status(404).json({ error: 'Student record not found' });

    // Get active session
    const { data: activeSession } = await supabaseAdmin
      .from('academic_sessions')
      .select('id, name')
      .eq('is_active', true)
      .maybeSingle();

    // Get courses for student's program
    const { data: courses, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*, programs(code, name)')
      .eq('program_id', student.program_id)
      .order('semester');

    if (courseError) throw courseError;

    // Get current enrollments
    const { data: currentEnrollments } = await supabaseAdmin
      .from('enrollments')
      .select('course_id, id, status')
      .eq('student_id', studentId)
      .eq('session_id', activeSession?.id || '00000000-0000-0000-0000-000000000000');

    const enrolledCourseIds = new Set(currentEnrollments?.map((e) => e.course_id));

    res.json({
      activeSession,
      courses: (courses || []).map((c) => ({
        ...c,
        isEnrolled: enrolledCourseIds.has(c.id),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/student/register-courses
 * Body: { course_ids: string[] }
 */
studentRouter.post('/register-courses', async (req, res) => {
  try {
    const studentId = req.user!.id;
    const { course_ids } = req.body;

    if (!course_ids || !Array.isArray(course_ids) || course_ids.length === 0) {
      return res.status(400).json({ error: 'Please select at least one course' });
    }

    const { data: activeSession } = await supabaseAdmin
      .from('academic_sessions')
      .select('id')
      .eq('is_active', true)
      .single();

    if (!activeSession) {
      return res.status(400).json({ error: 'No active academic session for registration' });
    }

    const toInsert = course_ids.map((cId: string) => ({
      student_id: studentId,
      course_id: cId,
      session_id: activeSession.id,
      status: 'active',
    }));

    // Upsert or insert ignore
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .upsert(toInsert, { onConflict: 'student_id,course_id,session_id' })
      .select('*, courses(code, name, credits)');

    if (error) throw error;
    res.json({ success: true, enrollments: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. GRADES & GPA TRACKER
// ─────────────────────────────────────────────────────────────
studentRouter.get('/grades', async (req, res) => {
  try {
    const studentId = req.user!.id;

    // Query enrollments with grades and course info
    const { data: enrollments, error } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        session_id,
        status,
        courses ( id, code, name, credits, semester ),
        academic_sessions ( id, name ),
        grades ( id, ca_score, exam_score, total_score, letter_grade, gpa_points, is_published )
      `)
      .eq('student_id', studentId);

    if (error) throw error;

    // Filter to only PUBLISHED grades for student viewing
    let totalCredits = 0;
    let totalQualityPoints = 0;

    const formattedGrades = (enrollments || []).map((e: any) => {
      const g = e.grades;
      const isPublished = g && g.is_published;
      const credits = Number(e.courses?.credits || 0);

      if (isPublished && g.gpa_points !== null && g.gpa_points !== undefined) {
        const pts = Number(g.gpa_points);
        totalCredits += credits;
        totalQualityPoints += pts * credits;
      }

      return {
        enrollmentId: e.id,
        sessionName: e.academic_sessions?.name,
        courseCode: e.courses?.code,
        courseName: e.courses?.name,
        credits,
        semester: e.courses?.semester,
        isPublished: Boolean(isPublished),
        caScore: isPublished ? g.ca_score : null,
        examScore: isPublished ? g.exam_score : null,
        totalScore: isPublished ? g.total_score : null,
        letterGrade: isPublished ? g.letter_grade : 'Pending',
        gpaPoints: isPublished ? g.gpa_points : null,
      };
    });

    const cgpa = totalCredits > 0 ? (totalQualityPoints / totalCredits).toFixed(2) : '0.00';

    res.json({
      grades: formattedGrades,
      summary: {
        totalCredits,
        totalQualityPoints: totalQualityPoints.toFixed(2),
        cgpa,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. ATTENDANCE HISTORY
// ─────────────────────────────────────────────────────────────
studentRouter.get('/attendance', async (req, res) => {
  try {
    const studentId = req.user!.id;

    const { data: records, error } = await supabaseAdmin
      .from('attendance_records')
      .select(`
        id,
        status,
        attendance_sessions (
          date,
          courses ( code, name )
        )
      `)
      .eq('student_id', studentId)
      .order('id', { ascending: false });

    if (error) throw error;

    let present = 0;
    let absent = 0;
    let late = 0;

    const history = (records || []).map((r: any) => {
      if (r.status === 'present') present++;
      if (r.status === 'absent') absent++;
      if (r.status === 'late') late++;

      return {
        id: r.id,
        date: r.attendance_sessions?.date,
        courseCode: r.attendance_sessions?.courses?.code,
        courseName: r.attendance_sessions?.courses?.name,
        status: r.status,
      };
    });

    const total = history.length;
    const rate = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;

    res.json({
      history,
      stats: { present, absent, late, total, attendanceRate: `${rate}%` },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. INVOICES & PAYMENTS (Read-only for student)
// ─────────────────────────────────────────────────────────────
studentRouter.get('/finance', async (req, res) => {
  try {
    const studentId = req.user!.id;

    const { data: invoices, error } = await supabaseAdmin
      .from('invoices')
      .select('*, academic_sessions(name), payments(*)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    let totalBilled = 0;
    let totalPaid = 0;

    (invoices || []).forEach((inv: any) => {
      totalBilled += Number(inv.amount || 0);
      inv.payments?.forEach((p: any) => {
        totalPaid += Number(p.amount || 0);
      });
    });

    res.json({
      invoices: invoices || [],
      summary: {
        totalBilled,
        totalPaid,
        balance: totalBilled - totalPaid,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. RESOURCES (Scoped to student's program + general)
// ─────────────────────────────────────────────────────────────
studentRouter.get('/resources', async (req, res) => {
  try {
    const studentId = req.user!.id;

    const { data: student } = await supabaseAdmin
      .from('students')
      .select('program_id')
      .eq('id', studentId)
      .single();

    let query = supabaseAdmin
      .from('resources')
      .select('*, courses(code, name), programs(code, name), user_profiles(full_name)')
      .order('created_at', { ascending: false });

    if (student?.program_id) {
      // Return program-specific resources OR general resources (program_id IS NULL)
      query = query.or(`program_id.eq.${student.program_id},program_id.is.null`);
    }

    const { data: resources, error } = await query;
    if (error) throw error;
    res.json({ resources: resources || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
