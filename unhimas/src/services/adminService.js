import { supabase } from '../lib/supabase';

/**
 * Fetch comprehensive stats for the Admin Overview Dashboard
 */
export async function getAdminOverviewStats() {
  const [
    studentsRes,
    lecturersRes,
    departmentsRes,
    batchesRes,
    coursesRes,
    pendingMarksRes,
    publishedMarksRes,
    openShiftsRes,
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('lecturers').select('*', { count: 'exact', head: true }),
    supabase.from('departments').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('batches').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('mark_submissions').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('mark_submissions').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('lecturer_shifts').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ]);

  return {
    totalStudents: studentsRes.count ?? 0,
    totalLecturers: lecturersRes.count ?? 0,
    totalDepartments: departmentsRes.count ?? 0,
    totalBatches: batchesRes.count ?? 0,
    totalCourses: coursesRes.count ?? 0,
    pendingMarkSubmissions: pendingMarksRes.count ?? 0,
    publishedResults: publishedMarksRes.count ?? 0,
    activeLecturerShifts: openShiftsRes.count ?? 0,
  };
}

/**
 * Fetch student enrollment breakdown per department for charts
 */
export async function getDepartmentEnrollment() {
  const { data, error } = await supabase
    .from('departments')
    .select(`
      id,
      name,
      abbreviation,
      batches (
        id,
        students (
          id
        )
      )
    `)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching department enrollment:', error);
    return [];
  }

  return (data || []).map((dept) => {
    let studentCount = 0;
    (dept.batches || []).forEach((batch) => {
      studentCount += batch.students?.length || 0;
    });
    return {
      name: dept.abbreviation || dept.name,
      fullName: dept.name,
      students: studentCount,
    };
  });
}

/**
 * Fetch currently clocked-in lecturers
 */
export async function getLiveLecturerPresence() {
  const { data, error } = await supabase
    .from('lecturer_shifts')
    .select(`
      id,
      clock_in,
      status,
      lecturers (
        id,
        staff_id,
        first_name,
        last_name,
        departments (
          name,
          abbreviation
        )
      )
    `)
    .eq('status', 'open')
    .order('clock_in', { ascending: false })
    .limit(8);

  if (error) {
    console.error('Error fetching live shifts:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch pending mark submissions for review
 */
export async function getPendingSubmissionsList() {
  const { data, error } = await supabase
    .from('mark_submissions')
    .select(`
      id,
      status,
      submitted_at,
      batch_courses (
        id,
        courses (
          code,
          name,
          credit_units
        ),
        batches (
          name,
          code
        ),
        semesters (
          name,
          number
        )
      ),
      lecturers (
        id,
        first_name,
        last_name,
        staff_id
      )
    `)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Error fetching pending submissions:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch recent audit log events
 */
export async function getRecentAuditLogs(limit = 10) {
  const { data, error } = await supabase
    .from('audit_log')
    .select(`
      id,
      action,
      table_name,
      record_id,
      created_at,
      profiles:actor_id (
        full_name,
        login_id,
        role
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data || [];
}
