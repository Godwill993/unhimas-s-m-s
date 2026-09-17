import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

export const lecturerRouter = Router();

// Require authenticated lecturer or admin
lecturerRouter.use(authenticate, requireRole('lecturer', 'admin'));

// Helper: compute grading standard
function computeGradeDetails(ca: number, exam: number) {
  const total = Math.min(100, Math.max(0, Number(ca) + Number(exam)));
  let letter = 'F';
  let points = 0.0;

  if (total >= 80) {
    letter = 'A';
    points = 4.0;
  } else if (total >= 75) {
    letter = 'B+';
    points = 3.5;
  } else if (total >= 70) {
    letter = 'B';
    points = 3.0;
  } else if (total >= 65) {
    letter = 'C+';
    points = 2.5;
  } else if (total >= 60) {
    letter = 'C';
    points = 2.0;
  } else if (total >= 50) {
    letter = 'D';
    points = 1.0;
  } else {
    letter = 'F';
    points = 0.0;
  }

  return { total, letter, points };
}

// ─────────────────────────────────────────────────────────────
// 1. LECTURER ASSIGNED COURSES
// ─────────────────────────────────────────────────────────────
lecturerRouter.get('/my-courses', async (req, res) => {
  try {
    const lecturerId = req.user!.id;

    // Fetch assigned courses
    const { data: assignments, error } = await supabaseAdmin
      .from('course_assignments')
      .select('*, courses(*, programs(code, name, level)), academic_sessions(id, name, is_active)')
      .eq('lecturer_id', lecturerId);

    if (error) throw error;
    res.json({ assignments: assignments || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. COURSE STUDENTS & GRADES
// ─────────────────────────────────────────────────────────────
lecturerRouter.get('/courses/:courseId/students', async (req, res) => {
  try {
    const { courseId } = req.params;
    const lecturerId = req.user!.id;
    const sessionId = req.query.session_id as string;

    // Verify lecturer is assigned (if not admin)
    if (req.user!.role !== 'admin') {
      const { data: assignment } = await supabaseAdmin
        .from('course_assignments')
        .select('id')
        .eq('course_id', courseId)
        .eq('lecturer_id', lecturerId)
        .maybeSingle();

      if (!assignment) {
        return res.status(403).json({ error: 'You are not assigned to teach this course' });
      }
    }

    // Get enrollments for this course
    let enrollQuery = supabaseAdmin
      .from('enrollments')
      .select('id, student_id, status, students(id, matricule, level, user_profiles(full_name, email)), grades(*)')
      .eq('course_id', courseId);

    if (sessionId) {
      enrollQuery = enrollQuery.eq('session_id', sessionId);
    }

    const { data: enrollments, error } = await enrollQuery;
    if (error) throw error;

    res.json({ enrollments: enrollments || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/lecturer/grades/submit
 * Batch or single score submission
 * Body: { enrollment_id, ca_score, exam_score }
 */
lecturerRouter.post('/grades/submit', async (req, res) => {
  try {
    const { enrollment_id, ca_score, exam_score } = req.body;
    const lecturerId = req.user!.id;

    if (!enrollment_id) {
      return res.status(400).json({ error: 'enrollment_id is required' });
    }

    // Verify permission via enrollment -> course_assignment
    if (req.user!.role !== 'admin') {
      const { data: enrollment } = await supabaseAdmin
        .from('enrollments')
        .select('course_id, session_id')
        .eq('id', enrollment_id)
        .single();

      if (!enrollment) return res.status(404).json({ error: 'Enrollment record not found' });

      const { data: assignment } = await supabaseAdmin
        .from('course_assignments')
        .select('id')
        .eq('course_id', enrollment.course_id)
        .eq('session_id', enrollment.session_id)
        .eq('lecturer_id', lecturerId)
        .maybeSingle();

      if (!assignment) {
        return res.status(403).json({ error: 'You do not have permission to grade this course' });
      }
    }

    const ca = Number(ca_score || 0);
    const exam = Number(exam_score || 0);
    const { total, letter, points } = computeGradeDetails(ca, exam);

    const { data: existingGrade } = await supabaseAdmin
      .from('grades')
      .select('id')
      .eq('enrollment_id', enrollment_id)
      .maybeSingle();

    let result;
    if (existingGrade) {
      const { data, error } = await supabaseAdmin
        .from('grades')
        .update({
          ca_score: ca,
          exam_score: exam,
          total_score: total,
          letter_grade: letter,
          gpa_points: points,
          updated_by: lecturerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingGrade.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('grades')
        .insert({
          enrollment_id,
          ca_score: ca,
          exam_score: exam,
          total_score: total,
          letter_grade: letter,
          gpa_points: points,
          is_published: false, // published controlled by lecturer/admin
          updated_by: lecturerId,
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    res.json({ success: true, grade: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle publication for a course's grades (lecturer control)
lecturerRouter.put('/courses/:courseId/toggle-publish', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { session_id, is_published } = req.body;
    const lecturerId = req.user!.id;

    if (req.user!.role !== 'admin') {
      const { data: assignment } = await supabaseAdmin
        .from('course_assignments')
        .select('id')
        .eq('course_id', courseId)
        .eq('lecturer_id', lecturerId)
        .maybeSingle();

      if (!assignment) return res.status(403).json({ error: 'Unauthorized course' });
    }

    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('session_id', session_id);

    const enrollmentIds = enrollments?.map((e) => e.id) || [];
    if (enrollmentIds.length > 0) {
      await supabaseAdmin
        .from('grades')
        .update({ is_published: Boolean(is_published) })
        .in('enrollment_id', enrollmentIds);
    }

    res.json({ success: true, count: enrollmentIds.length, is_published });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. ATTENDANCE SESSIONS & RECORDS
// ─────────────────────────────────────────────────────────────
lecturerRouter.post('/attendance/session', async (req, res) => {
  try {
    const { course_id, session_id, date, records } = req.body;
    const lecturerId = req.user!.id;

    if (!course_id || !session_id || !date) {
      return res.status(400).json({ error: 'course_id, session_id, and date are required' });
    }

    // Create attendance session
    const { data: attSession, error: sessionErr } = await supabaseAdmin
      .from('attendance_sessions')
      .insert({
        course_id,
        session_id,
        date,
        lecturer_id: lecturerId,
      })
      .select()
      .single();

    if (sessionErr) throw sessionErr;

    // Insert student records
    if (records && Array.isArray(records) && records.length > 0) {
      const toInsert = records.map((r: { student_id: string; status: string }) => ({
        attendance_session_id: attSession.id,
        student_id: r.student_id,
        status: r.status || 'present',
      }));

      await supabaseAdmin.from('attendance_records').insert(toInsert);
    }

    res.status(201).json({ success: true, attendanceSession: attSession });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

lecturerRouter.get('/attendance/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('attendance_sessions')
      .select('*, attendance_records(*, students(matricule, user_profiles(full_name)))')
      .eq('course_id', courseId)
      .order('date', { ascending: false });

    if (error) throw error;
    res.json({ sessions: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. RESOURCES (Scoped to lecturer's assigned courses)
// ─────────────────────────────────────────────────────────────
lecturerRouter.get('/resources', async (req, res) => {
  try {
    const lecturerId = req.user!.id;
    const { data, error } = await supabaseAdmin
      .from('resources')
      .select('*, courses(name, code), programs(code, name)')
      .eq('uploader_id', lecturerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ resources: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

lecturerRouter.post('/resources', async (req, res) => {
  try {
    const { title, category, file_path, course_id, program_id, session_id } = req.body;
    const lecturerId = req.user!.id;

    if (!title || !category || !file_path) {
      return res.status(400).json({ error: 'Title, category, and file_path are required' });
    }

    // If course specified, verify lecturer teaches it
    if (course_id && req.user!.role !== 'admin') {
      const { data: assignment } = await supabaseAdmin
        .from('course_assignments')
        .select('id')
        .eq('course_id', course_id)
        .eq('lecturer_id', lecturerId)
        .maybeSingle();

      if (!assignment) {
        return res.status(403).json({ error: 'You can only upload resources for courses you teach' });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('resources')
      .insert({
        title,
        category,
        file_path,
        course_id: course_id || null,
        program_id: program_id || null,
        session_id: session_id || null,
        uploader_id: lecturerId,
      })
      .select('*, courses(name, code)')
      .single();

    if (error) throw error;
    res.status(201).json({ resource: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

lecturerRouter.delete('/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lecturerId = req.user!.id;

    let query = supabaseAdmin.from('resources').delete().eq('id', id);
    if (req.user!.role !== 'admin') {
      query = query.eq('uploader_id', lecturerId);
    }

    const { error } = await query;
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
