import { Router } from 'express';
import { publicRateLimit } from '../middleware/rateLimit.js';
import { supabaseAdmin } from '../config/supabase.js';

export const publicRouter = Router();

// Rate limit all public endpoints
publicRouter.use(publicRateLimit);

/**
 * GET /api/public/periods
 * Returns available academic periods (for dropdown on public page)
 */
publicRouter.get('/periods', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('academic_periods')
      .select('id, year, term, sequence, label')
      .order('year', { ascending: false })
      .order('term')
      .order('sequence');

    if (error) throw error;
    res.json({ periods: data });
  } catch (err) {
    console.error('Public periods error:', err);
    res.status(500).json({ error: 'Failed to load periods' });
  }
});

/**
 * GET /api/public/report
 * Query: ?student_code=&period_id=
 * Public, non-downloadable report lookup
 */
publicRouter.get('/report', async (req, res) => {
  try {
    const { student_code, period_id } = req.query;

    if (!student_code || !period_id) {
      res.status(400).json({ error: 'Student code and period are required' });
      return;
    }

    // Find student by code
    const { data: student } = await supabaseAdmin
      .from('students')
      .select(`
        id, student_code, full_name,
        class:classes(id, name, stream)
      `)
      .eq('student_code', (student_code as string).toUpperCase().trim())
      .eq('active', true)
      .single();

    if (!student) {
      // Generic error — don't leak whether the code exists
      res.status(404).json({
        error: 'No record found. Please check your student code and try again.',
      });
      return;
    }

    // Get period info
    const { data: period } = await supabaseAdmin
      .from('academic_periods')
      .select('*')
      .eq('id', period_id as string)
      .single();

    if (!period) {
      res.status(404).json({ error: 'Invalid academic period' });
      return;
    }

    // Get scores with subjects
    const { data: scores } = await supabaseAdmin
      .from('scores')
      .select(`
        mark,
        subject:subjects(name, coefficient)
      `)
      .eq('student_id', student.id)
      .eq('period_id', period_id as string);

    // Compute weighted average
    let totalWeighted = 0;
    let totalCoefficient = 0;
    const subjectResults = (scores || []).map((score: any) => {
      const coeff = score.subject?.coefficient || 1;
      totalWeighted += score.mark * coeff;
      totalCoefficient += coeff;

      return {
        subject: score.subject?.name,
        coefficient: coeff,
        mark: score.mark,
        weighted_mark: Math.round(score.mark * coeff * 100) / 100,
        grade: getGrade(score.mark),
        remark: getGradeRemark(score.mark),
      };
    });

    const weightedAverage = totalCoefficient > 0
      ? Math.round((totalWeighted / totalCoefficient) * 100) / 100
      : 0;

    // Get attendance summary
    const { data: attendance } = await supabaseAdmin
      .from('attendance')
      .select('status')
      .eq('student_id', student.id);

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
      .eq('student_id', student.id)
      .order('date', { ascending: false })
      .limit(10);

    res.json({
      student: {
        full_name: student.full_name,
        student_code: student.student_code,
        class_name: (student as any).class?.name,
        stream: (student as any).class?.stream,
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
      },
      attendance: attendanceSummary,
      discipline: disciplineRecords?.length
        ? disciplineRecords
        : [{ notes: 'No incidents recorded' }],
    });
  } catch (err) {
    console.error('Public report error:', err);
    res.status(500).json({ error: 'Failed to load report' });
  }
});

// ─── GRADING HELPERS ──────────────────────────────────────

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
