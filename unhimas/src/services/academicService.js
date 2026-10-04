import { supabase } from '../lib/supabase';

// ============================================================
// DEPARTMENTS
// ============================================================

export async function getDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select(`
      *,
      batches:batches(count),
      courses:courses(count),
      lecturers:lecturers(count)
    `)
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function createDepartment({ name, abbreviation, description }) {
  const { data, error } = await supabase
    .from('departments')
    .insert([{ name, abbreviation, description }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDepartment(id, updates) {
  const { data, error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// ACADEMIC YEARS & SEMESTERS
// ============================================================

export async function getAcademicYears() {
  const { data, error } = await supabase
    .from('academic_years')
    .select(`
      *,
      semesters:semesters(*)
    `)
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createAcademicYear({ name, start_date, end_date, is_current }) {
  if (is_current) {
    // Unset current on others first
    await supabase.from('academic_years').update({ is_current: false }).neq('id', '00000000-0000-0000-0000-000000000000');
  }
  const { data, error } = await supabase
    .from('academic_years')
    .insert([{ name, start_date, end_date, is_current: Boolean(is_current) }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setCurrentAcademicYear(id) {
  await supabase.from('academic_years').update({ is_current: false }).neq('id', id);
  const { data, error } = await supabase
    .from('academic_years')
    .update({ is_current: true })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSemesters(academicYearId = null) {
  let query = supabase
    .from('semesters')
    .select(`
      *,
      academic_years:academic_year_id(id, name, is_current)
    `)
    .order('number');

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createSemester({ academic_year_id, name, number, start_date, end_date, is_current }) {
  if (is_current) {
    await supabase.from('semesters').update({ is_current: false }).neq('id', '00000000-0000-0000-0000-000000000000');
  }
  const { data, error } = await supabase
    .from('semesters')
    .insert([{ academic_year_id, name, number: Number(number), start_date, end_date, is_current: Boolean(is_current) }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setCurrentSemester(id) {
  await supabase.from('semesters').update({ is_current: false }).neq('id', id);
  const { data, error } = await supabase
    .from('semesters')
    .update({ is_current: true })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// BATCHES
// ============================================================

export async function getBatches(departmentId = null) {
  let query = supabase
    .from('batches')
    .select(`
      *,
      departments:department_id(id, name, abbreviation),
      academic_years:academic_year_id(id, name),
      students:students(count)
    `)
    .order('created_at', { ascending: false });

  if (departmentId) {
    query = query.eq('department_id', departmentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createBatch({ department_id, academic_year_id, name, level_name, batch_number }) {
  const { data, error } = await supabase
    .from('batches')
    .insert([{ department_id, academic_year_id, name, level_name, batch_number }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBatch(id, updates) {
  const { data, error } = await supabase
    .from('batches')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// COURSES
// ============================================================

export async function getCourses(departmentId = null) {
  let query = supabase
    .from('courses')
    .select(`
      *,
      departments:department_id(id, name, abbreviation)
    `)
    .order('code');

  if (departmentId) {
    query = query.eq('department_id', departmentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createCourse({ department_id, code, name, credit_units }) {
  const { data, error } = await supabase
    .from('courses')
    .insert([{ department_id, code: code.toUpperCase().trim(), name, credit_units: Number(credit_units) || 3 }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCourse(id, updates) {
  if (updates.code) updates.code = updates.code.toUpperCase().trim();
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// BATCH COURSES (Course Allocations)
// ============================================================

export async function getBatchCourses({ batchId = null, semesterId = null } = {}) {
  let query = supabase
    .from('batch_courses')
    .select(`
      *,
      batches:batch_id(id, name, code, department_id, departments(name, abbreviation)),
      courses:course_id(id, code, name, credit_units),
      semesters:semester_id(id, name, number, academic_years(name)),
      lecturers:lecturer_id(id, staff_id, first_name, last_name)
    `)
    .order('created_at', { ascending: false });

  if (batchId) query = query.eq('batch_id', batchId);
  if (semesterId) query = query.eq('semester_id', semesterId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function assignBatchCourse({ batch_id, course_id, semester_id, lecturer_id, is_compulsory = true }) {
  const { data, error } = await supabase
    .from('batch_courses')
    .insert([{ batch_id, course_id, semester_id, lecturer_id: lecturer_id || null, is_compulsory }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBatchCourse(id) {
  const { error } = await supabase
    .from('batch_courses')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
