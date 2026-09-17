-- ============================================================
-- School Management System — Sample Seed Data
-- ============================================================

-- 1. Insert Classes
insert into public.classes (id, name, stream) values
  ('c1000000-0000-0000-0000-000000000001', 'Form 1', null),
  ('c1000000-0000-0000-0000-000000000002', 'Form 4', 'Science'),
  ('c1000000-0000-0000-0000-000000000003', 'Lower Sixth', 'Arts')
on conflict (name, stream) do nothing;

-- 2. Insert Academic Periods
insert into public.academic_periods (id, year, term, sequence, active) values
  ('p1000000-0000-0000-0000-000000000001', '2025-2026', 1, 1, true),
  ('p1000000-0000-0000-0000-000000000002', '2025-2026', 1, 2, false)
on conflict (year, term, sequence) do nothing;

-- 3. Insert Subjects with Coefficients
insert into public.subjects (id, name, class_id, coefficient) values
  -- Form 4 Science
  ('s1000000-0000-0000-0000-000000000001', 'Mathematics', 'c1000000-0000-0000-0000-000000000002', 4),
  ('s1000000-0000-0000-0000-000000000002', 'Physics', 'c1000000-0000-0000-0000-000000000002', 3),
  ('s1000000-0000-0000-0000-000000000003', 'Chemistry', 'c1000000-0000-0000-0000-000000000002', 3),
  ('s1000000-0000-0000-0000-000000000004', 'Biology', 'c1000000-0000-0000-0000-000000000002', 3),
  ('s1000000-0000-0000-0000-000000000005', 'English Language', 'c1000000-0000-0000-0000-000000000002', 2)
on conflict (name, class_id) do nothing;

-- 4. Insert Students
insert into public.students (id, student_code, full_name, class_id, guardian_name, guardian_contact, gender) values
  ('u1000000-0000-0000-0000-000000000001', 'SCH-2026-F4-0001', 'Samuel Taku', 'c1000000-0000-0000-0000-000000000002', 'Joseph Taku', '+237 670 111 222', 'male'),
  ('u1000000-0000-0000-0000-000000000002', 'SCH-2026-F4-0002', 'Brenda Nkem', 'c1000000-0000-0000-0000-000000000002', 'Grace Nkem', '+237 675 333 444', 'female'),
  ('u1000000-0000-0000-0000-000000000003', 'SCH-2026-F4-0003', 'Kevin Enow', 'c1000000-0000-0000-0000-000000000002', 'Peter Enow', '+237 699 555 666', 'male')
on conflict (student_code) do nothing;
