import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

export const authRouter = Router();

/**
 * POST /api/auth/login
 * Body: { identifier, email, password }
 * Accepts either:
 * - 'identifier' (matricule like UNH25-CS-0001 or email)
 * - or 'email'
 */
authRouter.post('/login', async (req, res) => {
  try {
    const rawIdentifier = (req.body.identifier || req.body.email || req.body.matricule || '').trim();
    const password = req.body.password;

    if (!rawIdentifier || !password) {
      res.status(400).json({ error: 'Matricule/Email and password are required' });
      return;
    }

    let authEmail = rawIdentifier;

    // If identifier doesn't contain '@', it's a student matricule
    if (!rawIdentifier.includes('@')) {
      const normalizedMatricule = rawIdentifier.toUpperCase();
      // Look up student by matricule to obtain synthetic email or account ID
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id, matricule')
        .ilike('matricule', normalizedMatricule)
        .maybeSingle();

      if (student) {
        // Fetch user profile email
        const { data: prof } = await supabaseAdmin
          .from('user_profiles')
          .select('email')
          .eq('id', student.id)
          .maybeSingle();
        if (prof?.email) {
          authEmail = prof.email;
        } else {
          authEmail = `${normalizedMatricule.toLowerCase()}@unhimas.local`;
        }
      } else {
        // Default standard synthetic email format
        authEmail = `${normalizedMatricule.toLowerCase()}@unhimas.local`;
      }
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid credentials. Please check your matricule/email and password.' });
      return;
    }

    // Fetch profile from user_profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      res.status(401).json({ error: 'User profile not found. Contact administrator.' });
      return;
    }

    // If student, fetch student details
    let studentInfo = null;
    if (profile.role === 'student') {
      const { data: st } = await supabaseAdmin
        .from('students')
        .select('matricule, level, program_id, entry_year')
        .eq('id', profile.id)
        .maybeSingle();
      studentInfo = st;
    }

    res.json({
      user: {
        id: profile.id,
        email: data.user.email,
        full_name: profile.full_name,
        role: profile.role,
        matricule: studentInfo?.matricule,
        student: studentInfo,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed due to an internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile
 */
authRouter.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});
