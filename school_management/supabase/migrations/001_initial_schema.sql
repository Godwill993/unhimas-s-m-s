-- ============================================================
-- School Management System — Initial Schema
-- Cameroon Anglophone Academic System
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PROFILES (linked to Supabase Auth users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('admin', 'teacher', 'discipline')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. CLASSES
-- ============================================================
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,           -- e.g. 'Form 1', 'Lower Sixth'
  stream text,                  -- e.g. 'Science', 'Arts', null if no stream
  created_at timestamptz not null default now(),
  unique (name, stream)
);

-- ============================================================
-- 3. SUBJECTS
-- ============================================================
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,           -- e.g. 'Mathematics', 'English Language'
  class_id uuid not null references public.classes(id) on delete cascade,
  coefficient numeric not null default 1 check (coefficient > 0),
  created_at timestamptz not null default now(),
  unique (name, class_id)
);

-- ============================================================
-- 4. TEACHER ↔ SUBJECT assignments
-- ============================================================
create table public.teacher_subjects (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  primary key (teacher_id, subject_id)
);

-- ============================================================
-- 5. STUDENTS
-- ============================================================
create table public.students (
  id uuid primary key default gen_random_uuid(),
  student_code text unique not null,   -- e.g. 'SCH-2026-F4-0142'
  full_name text not null,
  class_id uuid not null references public.classes(id),
  guardian_name text,
  guardian_contact text,
  dob date,
  gender text check (gender in ('male', 'female')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 6. ACADEMIC PERIODS
-- ============================================================
create table public.academic_periods (
  id uuid primary key default gen_random_uuid(),
  year text not null,            -- e.g. '2025-2026'
  term int not null check (term in (1, 2, 3)),
  sequence int not null check (sequence in (1, 2)),
  label text generated always as (
    'Term ' || term::text || ' - Seq ' || ((term - 1) * 2 + sequence)::text
  ) stored,
  active boolean not null default false,  -- only one period active at a time
  created_at timestamptz not null default now(),
  unique (year, term, sequence)
);

-- ============================================================
-- 7. SCORES
-- ============================================================
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  period_id uuid not null references public.academic_periods(id) on delete cascade,
  mark numeric not null check (mark >= 0 and mark <= 20),
  entered_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, subject_id, period_id)
);

-- ============================================================
-- 8. ATTENDANCE
-- ============================================================
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present', 'absent', 'late')),
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (student_id, date)
);

-- ============================================================
-- 9. DISCIPLINE RECORDS
-- ============================================================
create table public.discipline_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,
  type text not null check (type in ('absence', 'lateness', 'misconduct', 'sanction')),
  notes text,
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES for query performance
-- ============================================================
create index idx_profiles_role on public.profiles(role);
create index idx_subjects_class on public.subjects(class_id);
create index idx_students_class on public.students(class_id);
create index idx_students_code on public.students(student_code);
create index idx_scores_student on public.scores(student_id);
create index idx_scores_subject on public.scores(subject_id);
create index idx_scores_period on public.scores(period_id);
create index idx_scores_student_period on public.scores(student_id, period_id);
create index idx_attendance_student on public.attendance(student_id);
create index idx_attendance_date on public.attendance(date);
create index idx_discipline_student on public.discipline_records(student_id);
create index idx_discipline_date on public.discipline_records(date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper function to get user role
create or replace function public.get_user_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- --- PROFILES ---
alter table public.profiles enable row level security;

create policy "Admin can manage all profiles"
  on public.profiles for all
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

-- --- CLASSES ---
alter table public.classes enable row level security;

create policy "Admin can manage classes"
  on public.classes for all
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "Authenticated users can read classes"
  on public.classes for select
  using (auth.role() = 'authenticated');

-- --- SUBJECTS ---
alter table public.subjects enable row level security;

create policy "Admin can manage subjects"
  on public.subjects for all
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "Authenticated users can read subjects"
  on public.subjects for select
  using (auth.role() = 'authenticated');

-- --- TEACHER_SUBJECTS ---
alter table public.teacher_subjects enable row level security;

create policy "Admin can manage teacher assignments"
  on public.teacher_subjects for all
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "Teachers can read own assignments"
  on public.teacher_subjects for select
  using (teacher_id = auth.uid());

-- --- STUDENTS ---
alter table public.students enable row level security;

create policy "Admin can manage students"
  on public.students for all
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "Teachers can read students in their classes"
  on public.students for select
  using (
    public.get_user_role() = 'teacher'
    and class_id in (
      select s.class_id from public.subjects s
      join public.teacher_subjects ts on ts.subject_id = s.id
      where ts.teacher_id = auth.uid()
    )
  );

create policy "Discipline can read all students"
  on public.students for select
  using (public.get_user_role() = 'discipline');

-- --- ACADEMIC PERIODS ---
alter table public.academic_periods enable row level security;

create policy "Admin can manage periods"
  on public.academic_periods for all
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "Authenticated users can read periods"
  on public.academic_periods for select
  using (auth.role() = 'authenticated');

-- --- SCORES ---
alter table public.scores enable row level security;

create policy "Admin can manage all scores"
  on public.scores for all
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "Teachers can manage scores for their subjects"
  on public.scores for all
  using (
    public.get_user_role() = 'teacher'
    and subject_id in (
      select subject_id from public.teacher_subjects
      where teacher_id = auth.uid()
    )
  )
  with check (
    public.get_user_role() = 'teacher'
    and subject_id in (
      select subject_id from public.teacher_subjects
      where teacher_id = auth.uid()
    )
  );

-- --- ATTENDANCE ---
alter table public.attendance enable row level security;

create policy "Admin can manage all attendance"
  on public.attendance for all
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "Teachers can manage attendance"
  on public.attendance for all
  using (public.get_user_role() = 'teacher')
  with check (public.get_user_role() = 'teacher');

-- --- DISCIPLINE RECORDS ---
alter table public.discipline_records enable row level security;

create policy "Admin can manage all discipline records"
  on public.discipline_records for all
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

create policy "Discipline staff can manage discipline records"
  on public.discipline_records for all
  using (public.get_user_role() = 'discipline')
  with check (public.get_user_role() = 'discipline');

-- ============================================================
-- FUNCTION: Auto-generate student code
-- ============================================================
create or replace function public.generate_student_code(
  p_class_name text,
  p_year text default to_char(now(), 'YYYY')
)
returns text
language plpgsql
as $$
declare
  v_prefix text;
  v_count int;
begin
  -- Build prefix from class name: 'Form 1' → 'F1', 'Lower Sixth' → 'LS'
  v_prefix := case
    when p_class_name ilike 'form%' then 'F' || regexp_replace(p_class_name, '[^0-9]', '', 'g')
    when p_class_name ilike 'lower%' then 'LS'
    when p_class_name ilike 'upper%' then 'US'
    else upper(left(p_class_name, 2))
  end;

  -- Count existing students with this prefix pattern
  select count(*) + 1 into v_count
  from public.students
  where student_code like 'SCH-' || p_year || '-' || v_prefix || '-%';

  return 'SCH-' || p_year || '-' || v_prefix || '-' || lpad(v_count::text, 4, '0');
end;
$$;
