import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

export type AppRole = 'admin' | 'lecturer' | 'student' | 'finance';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: AppRole;
  full_name: string;
  matricule?: string;
  program_id?: string;
  department_id?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      token?: string;
    }
  }
}

/**
 * Middleware: Verifies JWT and attaches user profile to req.user
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Fetch the user's profile from user_profiles
    let profileData: any = null;
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, full_name, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      profileData = profile;
    } else {
      // Fallback check on legacy profiles table if present
      const { data: fallbackProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', user.id)
        .maybeSingle();
      profileData = fallbackProfile;
    }

    if (!profileData) {
      res.status(401).json({ error: 'User profile not found' });
      return;
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email || profileData.email || '',
      role: (profileData.role as AppRole) || 'student',
      full_name: profileData.full_name || 'User',
    };

    // If student, attach student info
    if (authenticatedUser.role === 'student') {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('matricule, program_id, level')
        .eq('id', user.id)
        .maybeSingle();
      if (student) {
        authenticatedUser.matricule = student.matricule;
        authenticatedUser.program_id = student.program_id;
      }
    } else if (authenticatedUser.role === 'lecturer') {
      const { data: lecturer } = await supabaseAdmin
        .from('lecturers')
        .select('department_id, employee_id')
        .eq('id', user.id)
        .maybeSingle();
      if (lecturer) {
        authenticatedUser.department_id = lecturer.department_id;
      }
    }

    req.user = authenticatedUser;
    req.token = token;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware factory: Restricts access to specific roles
 */
export function requireRole(...roles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
