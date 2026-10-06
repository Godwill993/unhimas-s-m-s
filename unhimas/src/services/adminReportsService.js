import { supabase } from '../lib/supabase';

const REPORT_LIMIT = 200;

export async function getLecturerHoursReport() {
  const { data, error } = await supabase
    .from('lecturer_hours_monthly')
    .select('*')
    .order('month', { ascending: false })
    .limit(REPORT_LIMIT);

  if (error) throw error;
  return data || [];
}

export async function getAttendanceReport() {
  const { data, error } = await supabase
    .from('attendance_summary')
    .select('*')
    .order('attendance_percentage', { ascending: false })
    .limit(REPORT_LIMIT);

  if (error) throw error;
  return data || [];
}

export async function getCoursePerformanceReport() {
  const { data, error } = await supabase
    .from('course_performance')
    .select('*')
    .order('average_score', { ascending: false })
    .limit(REPORT_LIMIT);

  if (error) throw error;
  return data || [];
}

export async function getResultsReport() {
  const { data, error } = await supabase
    .from('results')
    .select('*')
    .order('academic_year', { ascending: false })
    .order('semester', { ascending: false })
    .limit(REPORT_LIMIT);

  if (error) throw error;
  return data || [];
}
