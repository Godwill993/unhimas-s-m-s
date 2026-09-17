import { Router } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { supabaseAdmin } from '../config/supabase.js';

export const publicRouter = Router();

// Rate limiter: max 10 attempts per 15 minutes per IP to prevent brute-forcing student PINs
const resultsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many attempts. For security reasons, please try again in 15 minutes.',
  },
});

/**
 * POST /api/public/check-results
 * Body: { matricule, pin }
 * Security-definer execution: checks hashed PIN against students.pin_hash
 * Returns ONLY published grades
 */
publicRouter.post('/check-results', resultsLimiter, async (req, res) => {
  try {
    const rawMatricule = (req.body.matricule || '').trim().toUpperCase();
    const rawPin = (req.body.pin || '').trim();

    if (!rawMatricule || !rawPin) {
      return res.status(400).json({ error: 'Both Matricule and Results PIN are required' });
    }

    // 1. Fetch student by matricule
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        matricule,
        dob,
        level,
        pin_hash,
        user_profiles ( full_name ),
        programs ( code, name, level, departments ( name, faculties ( name ) ) )
      `)
      .ilike('matricule', rawMatricule)
      .maybeSingle();

    if (studentError || !student) {
      // Return generic error to prevent enumeration
      return res.status(401).json({ error: 'Invalid Matricule or Results PIN' });
    }

    // 2. Verify PIN hash (SHA-256 or pgcrypto crypt)
    const computedSha256 = crypto.createHash('sha256').update(rawPin).digest('hex');
    let isValid = student.pin_hash === computedSha256;

    // Fallback: If stored with crypt/bcrypt, verify via database RPC or direct check
    if (!isValid && student.pin_hash.startsWith('$2')) {
      // In case bcrypt hash is used
      const { data: rpcCheck } = await supabaseAdmin.rpc('get_public_results', {
        p_matricule: rawMatricule,
        p_pin: rawPin,
      });
      if (rpcCheck) {
        isValid = true;
      }
    }

    // Also support checking if PIN is the exact match in test/dev
    if (!isValid && student.pin_hash === rawPin) {
      isValid = true;
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid Matricule or Results PIN' });
    }

    // 3. Fetch ONLY PUBLISHED grades for this student
    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        session_id,
        academic_sessions ( name ),
        courses ( code, name, credits, semester ),
        grades ( ca_score, exam_score, total_score, letter_grade, gpa_points, is_published )
      `)
      .eq('student_id', student.id);

    if (enrollError) throw enrollError;

    // Filter to only published grades
    const publishedResults: any[] = [];
    let totalCredits = 0;
    let totalQualityPoints = 0;

    (enrollments || []).forEach((e: any) => {
      const g = e.grades;
      if (g && g.is_published) {
        const credits = Number(e.courses?.credits || 0);
        const pts = Number(g.gpa_points || 0);
        totalCredits += credits;
        totalQualityPoints += pts * credits;

        publishedResults.push({
          sessionName: e.academic_sessions?.name,
          courseCode: e.courses?.code,
          courseName: e.courses?.name,
          credits,
          semester: e.courses?.semester,
          caScore: g.ca_score,
          examScore: g.exam_score,
          totalScore: g.total_score,
          letterGrade: g.letter_grade,
          gpaPoints: g.gpa_points,
        });
      }
    });

    const cgpa = totalCredits > 0 ? (totalQualityPoints / totalCredits).toFixed(2) : '0.00';

    res.json({
      success: true,
      student: {
        fullName: (student as any).user_profiles?.full_name,
        matricule: student.matricule,
        level: student.level,
        programName: (student as any).programs?.name,
        facultyName: (student as any).programs?.departments?.faculties?.name,
      },
      results: publishedResults,
      summary: {
        totalCourses: publishedResults.length,
        totalCredits,
        cgpa,
      },
    });
  } catch (err: any) {
    console.error('Public results check error:', err);
    res.status(500).json({ error: 'An error occurred while retrieving results' });
  }
});

/**
 * GET /api/public/announcements
 * Unauthenticated or authenticated announcements
 */
publicRouter.get('/announcements', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select('*, user_profiles(full_name)')
      .is('target_role', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json({ announcements: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
