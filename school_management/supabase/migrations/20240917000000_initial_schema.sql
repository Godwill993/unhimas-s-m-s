-- Initial Schema for UNHIMAS Management System

-- Create custom types for ENUMs
CREATE TYPE user_role AS ENUM ('admin', 'lecturer', 'student', 'finance');
CREATE TYPE program_level AS ENUM ('HND', 'BTS', 'Bachelor''s', 'Master''s');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'dropped');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE invoice_status AS ENUM ('pending', 'partial', 'paid');

-- 1. Users (Extended profile for auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Academic Structure
CREATE TABLE faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    level program_level NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE academic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL, -- e.g., '2025/2026'
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Users (Students & Lecturers)
CREATE TABLE students (
    id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    matricule TEXT UNIQUE NOT NULL,
    dob DATE NOT NULL,
    gender TEXT NOT NULL,
    contact TEXT,
    program_id UUID REFERENCES programs(id),
    level TEXT NOT NULL,
    entry_year INTEGER NOT NULL,
    pin_hash TEXT NOT NULL
);

CREATE TABLE lecturers (
    id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id),
    employee_id TEXT UNIQUE NOT NULL
);

-- 4. Course Assignments & Enrollments
CREATE TABLE course_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lecturer_id UUID REFERENCES lecturers(id) ON DELETE CASCADE,
    session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
    UNIQUE(course_id, lecturer_id, session_id)
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
    status enrollment_status DEFAULT 'active',
    UNIQUE(student_id, course_id, session_id)
);

-- 5. Grades & Attendance
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE UNIQUE,
    ca_score NUMERIC(5,2) DEFAULT 0,
    exam_score NUMERIC(5,2) DEFAULT 0,
    total_score NUMERIC(5,2) DEFAULT 0,
    letter_grade TEXT,
    gpa_points NUMERIC(3,2),
    is_published BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES user_profiles(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    lecturer_id UUID REFERENCES lecturers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status attendance_status NOT NULL,
    UNIQUE(attendance_session_id, student_id)
);

-- 6. Finance
CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
    level TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    UNIQUE(program_id, session_id, level)
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status invoice_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    receipt_number TEXT UNIQUE NOT NULL,
    recorded_by UUID REFERENCES user_profiles(id)
);

-- 7. Resources & Announcements
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    file_path TEXT NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_role user_role,
    author_id UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
  SELECT role::text FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT auth.role() = 'admin';
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Admin All" ON user_profiles FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON faculties FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON departments FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON programs FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON academic_sessions FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON courses FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON students FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON lecturers FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON course_assignments FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON enrollments FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON grades FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON attendance_sessions FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON attendance_records FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON fee_structures FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON invoices FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON payments FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON resources FOR ALL USING (is_admin());
CREATE POLICY "Admin All" ON announcements FOR ALL USING (is_admin());

CREATE POLICY "Read Academic Structure" ON faculties FOR SELECT USING (true);
CREATE POLICY "Read Academic Structure" ON departments FOR SELECT USING (true);
CREATE POLICY "Read Academic Structure" ON programs FOR SELECT USING (true);
CREATE POLICY "Read Academic Structure" ON academic_sessions FOR SELECT USING (true);
CREATE POLICY "Read Academic Structure" ON courses FOR SELECT USING (true);

CREATE POLICY "Student read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Student read own record" ON students FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Student read own enrollments" ON enrollments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Student read own published grades" ON grades FOR SELECT USING (
    enrollment_id IN (SELECT id FROM enrollments WHERE student_id = auth.uid()) AND is_published = true
);
CREATE POLICY "Student read own attendance" ON attendance_records FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Student read own invoices" ON invoices FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Student read own payments" ON payments FOR SELECT USING (
    invoice_id IN (SELECT id FROM invoices WHERE student_id = auth.uid())
);
CREATE POLICY "Student read program resources" ON resources FOR SELECT USING (
    program_id IN (SELECT program_id FROM students WHERE id = auth.uid()) OR program_id IS NULL
);

CREATE POLICY "Lecturer read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Lecturer read own record" ON lecturers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Lecturer read assignments" ON course_assignments FOR SELECT USING (auth.uid() = lecturer_id);
CREATE POLICY "Lecturer manage grades for assigned courses" ON grades FOR ALL USING (
    enrollment_id IN (
        SELECT e.id FROM enrollments e
        JOIN course_assignments ca ON e.course_id = ca.course_id AND e.session_id = ca.session_id
        WHERE ca.lecturer_id = auth.uid()
    )
);
CREATE POLICY "Lecturer manage attendance sessions" ON attendance_sessions FOR ALL USING (auth.uid() = lecturer_id);
CREATE POLICY "Lecturer manage attendance records" ON attendance_records FOR ALL USING (
    attendance_session_id IN (SELECT id FROM attendance_sessions WHERE lecturer_id = auth.uid())
);
CREATE POLICY "Lecturer manage resources for assigned courses" ON resources FOR ALL USING (auth.uid() = uploader_id);
CREATE POLICY "Lecturer read resources for assigned courses" ON resources FOR SELECT USING (
    course_id IN (SELECT course_id FROM course_assignments WHERE lecturer_id = auth.uid())
);

CREATE OR REPLACE FUNCTION is_finance() RETURNS boolean AS $$
  SELECT auth.role() = 'finance';
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Finance read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Finance All Invoices" ON invoices FOR ALL USING (is_finance());
CREATE POLICY "Finance All Payments" ON payments FOR ALL USING (is_finance());
CREATE POLICY "Finance Read Fee Structures" ON fee_structures FOR SELECT USING (is_finance());

CREATE POLICY "Read Announcements" ON announcements FOR SELECT USING (
    target_role IS NULL OR target_role::text = auth.role()
);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION get_public_results(p_matricule TEXT, p_pin TEXT)
RETURNS TABLE (
    course_code TEXT,
    course_name TEXT,
    credits INTEGER,
    ca_score NUMERIC,
    exam_score NUMERIC,
    total_score NUMERIC,
    letter_grade TEXT,
    gpa_points NUMERIC
) AS $$
DECLARE
    v_student_id UUID;
    v_stored_hash TEXT;
BEGIN
    SELECT id, pin_hash INTO v_student_id, v_stored_hash
    FROM students
    WHERE matricule = p_matricule;
    
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Invalid matricule or PIN';
    END IF;
    
    IF v_stored_hash = crypt(p_pin, v_stored_hash) THEN
        RETURN QUERY
        SELECT c.code, c.name, c.credits, g.ca_score, g.exam_score, g.total_score, g.letter_grade, g.gpa_points
        FROM grades g
        JOIN enrollments e ON g.enrollment_id = e.id
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = v_student_id AND g.is_published = true;
    ELSE
        RAISE EXCEPTION 'Invalid matricule or PIN';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
