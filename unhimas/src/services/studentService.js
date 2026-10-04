import { supabase } from '../lib/supabase';

// ============================================================
// STUDENT PROFILE
// ============================================================

export async function getMyStudentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      batches:batch_id (
        id, name, code,
        departments:department_id (id, name, abbreviation),
        academic_years:academic_year_id (id, name, is_current)
      )
    `)
    .eq('profile_id', user.id)
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// MY COURSES (via batch)
// ============================================================

export async function getMyStudentCourses(batchId) {
  const { data, error } = await supabase
    .from('batch_courses')
    .select(`
      id, is_compulsory,
      courses:course_id (id, code, name, credit_units),
      semesters:semester_id (id, name, number, is_current, academic_years:academic_year_id (name)),
      lecturers:lecturer_id (id, first_name, last_name, staff_id)
    `)
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ============================================================
// MY ATTENDANCE
// ============================================================

export async function getMyAttendance(studentId, { batchCourseId = null } = {}) {
  let sessionsQuery = supabase
    .from('class_sessions')
    .select('id, batch_course_id, scheduled_start, scheduled_end, topic');

  if (batchCourseId) {
    sessionsQuery = sessionsQuery.eq('batch_course_id', batchCourseId);
  }

  const { data: sessions, error: sErr } = await sessionsQuery;
  if (sErr) throw sErr;
  if (!sessions?.length) return [];

  const sessionIds = sessions.map((s) => s.id);

  const { data: attendanceRecords, error: aErr } = await supabase
    .from('attendance')
    .select('session_id, status, marked_at')
    .eq('student_id', studentId)
    .in('session_id', sessionIds);

  if (aErr) throw aErr;

  const attendanceMap = {};
  (attendanceRecords || []).forEach((r) => {
    attendanceMap[r.session_id] = r;
  });

  return sessions.map((s) => ({
    ...s,
    attendance: attendanceMap[s.id] || { status: 'absent' },
  }));
}

// ============================================================
// MY ATTENDANCE SUMMARY PER COURSE
// ============================================================

export async function getMyAttendanceSummary(studentId, batchId) {
  // Get all batch_courses for this batch
  const { data: batchCourses, error: bcErr } = await supabase
    .from('batch_courses')
    .select(`
      id,
      courses:course_id (code, name),
      semesters:semester_id (name, number)
    `)
    .eq('batch_id', batchId);
  if (bcErr) throw bcErr;
  if (!batchCourses?.length) return [];

  const summary = await Promise.all(
    batchCourses.map(async (bc) => {
      const { data: sessions } = await supabase
        .from('class_sessions')
        .select('id')
        .eq('batch_course_id', bc.id);

      const sessionIds = (sessions || []).map((s) => s.id);
      if (!sessionIds.length) {
        return { ...bc, totalSessions: 0, present: 0, absent: 0, late: 0, percentage: 0 };
      }

      const { data: records } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentId)
        .in('session_id', sessionIds);

      let present = 0, absent = 0, late = 0;
      (records || []).forEach((r) => {
        if (r.status === 'present') present++;
        else if (r.status === 'absent') absent++;
        else if (r.status === 'late') late++;
      });

      const total = sessionIds.length;
      const attended = present + late;
      return {
        ...bc,
        totalSessions: total,
        present,
        absent,
        late,
        percentage: total > 0 ? Math.round((attended / total) * 100) : 0,
      };
    })
  );

  return summary;
}

// ============================================================
// MY RESULTS (only published)
// ============================================================

export async function getMyResults(studentId) {
  const { data, error } = await supabase
    .from('marks')
    .select(`
      id,
      attendance_score,
      coursework_score,
      exam_score,
      total_score,
      grade,
      grade_point,
      lecturer_comment,
      updated_at,
      mark_submissions:mark_submission_id (
        id,
        status,
        published_at,
        batch_courses:batch_course_id (
          id,
          courses:course_id (id, code, name, credit_units),
          semesters:semester_id (id, name, number, academic_years:academic_year_id (name))
        )
      )
    `)
    .eq('student_id', studentId)
    .eq('mark_submissions.status', 'published');

  if (error) throw error;

  // Filter out marks where submission is not published
  const published = (data || []).filter((m) => m.mark_submissions?.status === 'published');
  return published;
}

// ============================================================
// MY TIMETABLE
// ============================================================

export async function getMyTimetable(batchId) {
  const { data: batchCourses, error: bcErr } = await supabase
    .from('batch_courses')
    .select('id, courses:course_id (code, name), lecturers:lecturer_id (first_name, last_name)')
    .eq('batch_id', batchId);
  if (bcErr) throw bcErr;
  if (!batchCourses?.length) return [];

  const batchCourseIds = batchCourses.map((bc) => bc.id);
  const bcMap = {};
  batchCourses.forEach((bc) => { bcMap[bc.id] = bc; });

  const { data: slots, error: sErr } = await supabase
    .from('timetable_slots')
    .select(`
      id, day_of_week, start_time, end_time, room, batch_course_id
    `)
    .in('batch_course_id', batchCourseIds)
    .order('day_of_week')
    .order('start_time');
  if (sErr) throw sErr;

  return (slots || []).map((slot) => ({
    ...slot,
    batch_course: bcMap[slot.batch_course_id] || null,
  }));
}

// ============================================================
// MY ANNOUNCEMENTS
// ============================================================

export async function getMyAnnouncements(batchId, departmentId) {
  let query = supabase
    .from('announcements')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(20);

  // Get announcements that apply to this student: global (no batch/dept), their batch, or their dept
  // We need to combine: no filters OR batch_id = batchId OR department_id = departmentId
  if (batchId && departmentId) {
    query = query.or(`batch_id.is.null,batch_id.eq.${batchId},department_id.eq.${departmentId}`);
  } else if (batchId) {
    query = query.or(`batch_id.is.null,batch_id.eq.${batchId}`);
  } else {
    query = query.is('batch_id', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ============================================================
// MY NOTIFICATIONS
// ============================================================

export async function getStudentNotifications(profileId, { limit = 30 } = {}) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function markStudentNotificationRead(notificationId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// STUDENT DASHBOARD STATS
// ============================================================

export async function getStudentDashboardStats(studentId, batchId, profileId) {
  const [coursesRes, unreadNotifsRes] = await Promise.all([
    supabase.from('batch_courses').select('*', { count: 'exact', head: true }).eq('batch_id', batchId),
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('recipient_id', profileId).eq('is_read', false),
  ]);

  // Published marks count
  const { data: publishedMarks } = await supabase
    .from('marks')
    .select('id, grade, grade_point, mark_submissions:mark_submission_id (status)')
    .eq('student_id', studentId);

  const published = (publishedMarks || []).filter((m) => m.mark_submissions?.status === 'published');
  const totalPublished = published.length;

  // Compute GPA
  let gpa = null;
  if (published.length > 0) {
    const totalPoints = published.reduce((sum, m) => sum + (m.grade_point || 0), 0);
    gpa = (totalPoints / published.length).toFixed(2);
  }

  // Attendance overall
  const { data: sessions } = await supabase
    .from('class_sessions')
    .select('id');
  const sessionIds = (sessions || []).map((s) => s.id);

  let attendancePct = null;
  if (sessionIds.length > 0) {
    const { data: myAttendance } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId)
      .in('session_id', sessionIds.slice(0, 500));

    const total = myAttendance?.length || 0;
    const present = (myAttendance || []).filter((a) => a.status === 'present' || a.status === 'late').length;
    attendancePct = total > 0 ? Math.round((present / total) * 100) : null;
  }

  return {
    totalCourses: coursesRes.count ?? 0,
    publishedResults: totalPublished,
    gpa,
    attendancePct,
    unreadNotifications: unreadNotifsRes.count ?? 0,
  };
}
