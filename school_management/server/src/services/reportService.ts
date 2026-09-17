import { supabaseAdmin } from '../config/supabase.js';

export interface StudentReportData {
  student: {
    id: string;
    student_code: string;
    full_name: string;
    class_name: string;
    stream: string | null;
    guardian_name: string | null;
    dob: string | null;
    gender: string | null;
  };
  period: {
    year: string;
    term: number;
    sequence: number;
    label: string;
  };
  subjects: Array<{
    name: string;
    coefficient: number;
    mark: number;
    weighted_mark: number;
    grade: string;
    remark: string;
  }>;
  summary: {
    weighted_average: number;
    overall_grade: string;
    overall_remark: string;
    total_coefficient: number;
    class_rank: number | null;
    class_size: number;
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  discipline: Array<{
    date: string;
    type: string;
    notes: string | null;
  }>;
  generatedAt: string;
  generatedBy: string;
}

function getGrade(mark: number): string {
  if (mark >= 16) return 'A';
  if (mark >= 14) return 'B';
  if (mark >= 12) return 'C';
  if (mark >= 10) return 'D';
  return 'F';
}

function getGradeRemark(mark: number): string {
  if (mark >= 16) return 'Excellent';
  if (mark >= 14) return 'Very Good';
  if (mark >= 12) return 'Good';
  if (mark >= 10) return 'Average';
  return 'Below Average';
}

/**
 * Compute a single student's report for a given period
 */
export async function generateStudentReport(
  studentId: string,
  periodId: string,
  generatedBy: string = 'System'
): Promise<StudentReportData> {
  // Get student
  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .select(`
      id, student_code, full_name, guardian_name, dob, gender,
      class:classes(id, name, stream)
    `)
    .eq('id', studentId)
    .single();

  if (studentError || !student) {
    throw new Error('Student not found');
  }

  // Get period
  const { data: period, error: periodError } = await supabaseAdmin
    .from('academic_periods')
    .select('*')
    .eq('id', periodId)
    .single();

  if (periodError || !period) {
    throw new Error('Academic period not found');
  }

  // Get scores with subjects
  const { data: scores } = await supabaseAdmin
    .from('scores')
    .select(`
      mark,
      subject:subjects(name, coefficient)
    `)
    .eq('student_id', studentId)
    .eq('period_id', periodId);

  // Compute subject results
  let totalWeighted = 0;
  let totalCoefficient = 0;
  const subjectResults = (scores || []).map((score: any) => {
    const coeff = score.subject?.coefficient || 1;
    const mark = score.mark;
    totalWeighted += mark * coeff;
    totalCoefficient += coeff;

    return {
      name: score.subject?.name || 'Unknown',
      coefficient: coeff,
      mark,
      weighted_mark: Math.round(mark * coeff * 100) / 100,
      grade: getGrade(mark),
      remark: getGradeRemark(mark),
    };
  });

  const weightedAverage = totalCoefficient > 0
    ? Math.round((totalWeighted / totalCoefficient) * 100) / 100
    : 0;

  // Compute class rank
  const classId = (student as any).class?.id;
  let classRank: number | null = null;
  let classSize = 0;

  if (classId) {
    const rankings = await computeClassRankings(classId, periodId);
    classSize = rankings.length;
    const studentRanking = rankings.find(r => r.studentId === studentId);
    classRank = studentRanking?.rank || null;
  }

  // Get attendance
  const { data: attendance } = await supabaseAdmin
    .from('attendance')
    .select('status')
    .eq('student_id', studentId);

  const attendanceSummary = {
    present: attendance?.filter(a => a.status === 'present').length || 0,
    absent: attendance?.filter(a => a.status === 'absent').length || 0,
    late: attendance?.filter(a => a.status === 'late').length || 0,
    total: attendance?.length || 0,
  };

  // Get discipline records
  const { data: disciplineRecords } = await supabaseAdmin
    .from('discipline_records')
    .select('date, type, notes')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .limit(10);

  return {
    student: {
      id: student.id,
      student_code: student.student_code,
      full_name: student.full_name,
      class_name: (student as any).class?.name || '',
      stream: (student as any).class?.stream || null,
      guardian_name: student.guardian_name,
      dob: student.dob,
      gender: student.gender,
    },
    period: {
      year: period.year,
      term: period.term,
      sequence: period.sequence,
      label: period.label,
    },
    subjects: subjectResults,
    summary: {
      weighted_average: weightedAverage,
      overall_grade: getGrade(weightedAverage),
      overall_remark: getGradeRemark(weightedAverage),
      total_coefficient: totalCoefficient,
      class_rank: classRank,
      class_size: classSize,
    },
    attendance: attendanceSummary,
    discipline: disciplineRecords || [],
    generatedAt: new Date().toISOString(),
    generatedBy,
  };
}

/**
 * Compute class rankings based on weighted averages
 */
export async function computeClassRankings(
  classId: string,
  periodId: string
): Promise<Array<{ studentId: string; average: number; rank: number }>> {
  // Get all students in class
  const { data: students } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('class_id', classId)
    .eq('active', true);

  if (!students || students.length === 0) return [];

  // Get all scores for these students in this period
  const studentIds = students.map(s => s.id);
  const { data: allScores } = await supabaseAdmin
    .from('scores')
    .select(`
      student_id, mark,
      subject:subjects(coefficient)
    `)
    .in('student_id', studentIds)
    .eq('period_id', periodId);

  // Compute weighted average per student
  const studentAverages = new Map<string, { totalWeighted: number; totalCoeff: number }>();

  for (const score of (allScores || []) as any[]) {
    const sid = score.student_id;
    const coeff = score.subject?.coefficient || 1;

    if (!studentAverages.has(sid)) {
      studentAverages.set(sid, { totalWeighted: 0, totalCoeff: 0 });
    }
    const entry = studentAverages.get(sid)!;
    entry.totalWeighted += score.mark * coeff;
    entry.totalCoeff += coeff;
  }

  // Build sorted rankings
  const rankings = Array.from(studentAverages.entries())
    .map(([studentId, data]) => ({
      studentId,
      average: data.totalCoeff > 0
        ? Math.round((data.totalWeighted / data.totalCoeff) * 100) / 100
        : 0,
      rank: 0,
    }))
    .sort((a, b) => b.average - a.average);

  // Assign ranks (handle ties)
  let currentRank = 1;
  for (let i = 0; i < rankings.length; i++) {
    if (i > 0 && rankings[i].average < rankings[i - 1].average) {
      currentRank = i + 1;
    }
    rankings[i].rank = currentRank;
  }

  return rankings;
}

/**
 * Generate reports for all students in a class
 */
export async function generateClassReports(
  classId: string,
  periodId: string,
  generatedBy: string = 'System'
): Promise<StudentReportData[]> {
  const { data: students } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('class_id', classId)
    .eq('active', true)
    .order('full_name');

  if (!students || students.length === 0) return [];

  const reports: StudentReportData[] = [];
  for (const student of students) {
    const report = await generateStudentReport(student.id, periodId, generatedBy);
    reports.push(report);
  }

  return reports;
}
