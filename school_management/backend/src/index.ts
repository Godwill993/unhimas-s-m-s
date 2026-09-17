import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Supabase admin client (requires service role key for bypassing RLS in admin routes)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'UNHIMAS Management System API' });
});

// Admin Route: Register Student
app.post('/api/admin/students/register', async (req, res) => {
  try {
    const { fullName, dob, gender, contact, programId, level, entryYear, programCode } = req.body;
    
    // 1. Generate Matricule: UNH{YY}-{PROGRAM_CODE}-{sequential number}
    const yy = entryYear.toString().slice(-2);
    
    // Get count of students in this program/year to generate sequential number
    const { count, error: countError } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', programId)
      .eq('entry_year', entryYear);
      
    if (countError) throw countError;
    
    const seq = ((count || 0) + 1).toString().padStart(4, '0');
    const matricule = `UNH${yy}-${programCode}-${seq}`;
    
    // 2. Generate temp password and synthetic email
    const email = `${matricule.toLowerCase()}@unhimas.local`;
    const tempPassword = Math.random().toString(36).slice(-8); // Random 8 chars
    const pin = dob.replace(/-/g, '').slice(-4) + Math.random().toString(36).slice(-4).toUpperCase(); // e.g. MMDDXXXX
    
    // Create User in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true
    });
    
    if (authError) throw authError;
    const userId = authUser.user.id;
    
    // 3. Create User Profile
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      id: userId,
      email,
      full_name: fullName,
      role: 'student'
    });
    if (profileError) throw profileError;
    
    // 4. Hash PIN and Create Student Record
    // (For this mock we assume a simple hash or doing it here, but bcrypt in Express is better)
    const crypto = require('crypto');
    // Simple mock hash just for demonstration until we add bcrypt
    const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
    
    const { error: studentError } = await supabaseAdmin.from('students').insert({
      id: userId,
      matricule,
      dob,
      gender,
      contact,
      program_id: programId,
      level,
      entry_year: entryYear,
      pin_hash: pinHash // In reality use bcrypt.hashSync(pin, 10)
    });
    
    if (studentError) throw studentError;
    
    res.status(201).json({
      success: true,
      data: {
        matricule,
        tempPassword,
        pin,
        email
      }
    });
    
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
