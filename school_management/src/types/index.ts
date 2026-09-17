export type UserRole = 'admin' | 'lecturer' | 'student' | 'finance';

export type ProgramLevel = 'HND' | 'BTS' | "Bachelor's" | "Master's";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  matricule?: string;
  student?: {
    matricule: string;
    level: string;
    program_id: string;
    entry_year: number;
  };
}

export interface Faculty {
  id: string;
  code: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Department {
  id: string;
  faculty_id: string;
  code: string;
  name: string;
  faculties?: Faculty;
}

export interface Program {
  id: string;
  department_id: string;
  code: string;
  name: string;
  level: ProgramLevel;
  departments?: Department;
}

export interface AcademicSession {
  id: string;
  name: string;
  is_active: boolean;
  created_at?: string;
}

export interface Course {
  id: string;
  program_id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  programs?: Program;
  isEnrolled?: boolean;
}

export interface Student {
  id: string;
  matricule: string;
  dob: string;
  gender: string;
  contact?: string;
  program_id: string;
  level: string;
  entry_year: number;
  user_profiles?: {
    id: string;
    full_name: string;
    email: string;
  };
  programs?: Program;
}

export interface Lecturer {
  id: string;
  department_id: string;
  employee_id: string;
  user_profiles?: {
    id: string;
    full_name: string;
    email: string;
  };
  departments?: Department;
}

export interface CourseAssignment {
  id: string;
  course_id: string;
  lecturer_id: string;
  session_id: string;
  courses?: Course;
  lecturers?: Lecturer;
  academic_sessions?: AcademicSession;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  session_id: string;
  status: 'active' | 'completed' | 'dropped';
  courses?: Course;
  academic_sessions?: AcademicSession;
  grades?: Grade;
  students?: Student;
}

export interface Grade {
  id?: string;
  enrollment_id?: string;
  ca_score?: number;
  exam_score?: number;
  total_score?: number;
  letter_grade?: string;
  gpa_points?: number;
  is_published?: boolean;
}

export interface AttendanceRecord {
  id: string;
  date?: string;
  courseCode?: string;
  courseName?: string;
  status: 'present' | 'absent' | 'late';
}

export interface Invoice {
  id: string;
  student_id: string;
  session_id: string;
  amount: number;
  amountPaid?: number;
  balance?: number;
  due_date: string;
  status: 'pending' | 'partial' | 'paid';
  academic_sessions?: AcademicSession;
  students?: {
    matricule: string;
    user_profiles?: { full_name: string };
  };
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  receipt_number: string;
  recorded_by?: string;
}

export interface Resource {
  id: string;
  title: string;
  category: string;
  file_path: string;
  course_id?: string;
  program_id?: string;
  session_id?: string;
  uploader_id?: string;
  created_at?: string;
  courses?: Course;
  programs?: Program;
  user_profiles?: { full_name: string };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_role: UserRole | null;
  created_at: string;
  user_profiles?: { full_name: string };
}

export interface CredentialsSlipData {
  institution: string;
  studentName: string;
  matricule: string;
  programName: string;
  programCode: string;
  level: string;
  entryYear: number;
  syntheticEmail: string;
  portalPassword: string;
  resultsPin: string;
  portalUrl: string;
  resultsUrl: string;
  registeredAt: string;
}
