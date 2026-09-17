export type UserRole = 'admin' | 'teacher' | 'discipline';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  stream: string | null;
  created_at: string;
  subjects?: Subject[];
  students?: { count: number }[];
}

export interface Subject {
  id: string;
  name: string;
  class_id: string;
  coefficient: number;
  created_at: string;
  class?: Class;
  teacher_subjects?: Array<{
    teacher_id: string;
    profiles?: { full_name: string };
  }>;
}

export interface Student {
  id: string;
  student_code: string;
  full_name: string;
  class_id: string;
  guardian_name?: string | null;
  guardian_contact?: string | null;
  dob?: string | null;
  gender?: 'male' | 'female' | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  class?: Class;
}

export interface AcademicPeriod {
  id: string;
  year: string;
  term: number;
  sequence: number;
  label: string;
  active: boolean;
  created_at: string;
}

export interface Score {
  id: string;
  student_id: string;
  subject_id: string;
  period_id: string;
  mark: number;
  entered_by: string;
  created_at: string;
  updated_at: string;
  student?: Student;
  subject?: Subject;
  period?: AcademicPeriod;
  entered_by_profile?: { full_name: string };
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  recorded_by: string;
  created_at: string;
  student?: Student;
}

export type DisciplineType = 'absence' | 'lateness' | 'misconduct' | 'sanction';

export interface DisciplineRecord {
  id: string;
  student_id: string;
  date: string;
  type: DisciplineType;
  notes: string | null;
  recorded_by: string;
  created_at: string;
  student?: Student;
  recorded_by_profile?: { full_name: string };
}

export interface PublicReportResult {
  student: {
    full_name: string;
    student_code: string;
    class_name: string;
    stream: string | null;
  };
  period: {
    year: string;
    term: number;
    sequence: number;
    label: string;
  };
  subjects: Array<{
    subject: string;
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
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  discipline: Array<{
    date?: string;
    type?: string;
    notes: string;
  }>;
}

export interface AdminDashboardData {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    activePeriod: AcademicPeriod | null;
  };
  classAverages: Array<{
    class_name: string;
    average: number;
  }>;
  recentDiscipline: DisciplineRecord[];
}
