import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Users, Plus, BookOpen, Trash2, X, CheckCircle2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminLecturers: React.FC = () => {
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isLecturerModalOpen, setIsLecturerModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Lecturer Form
  const [lecturerForm, setLecturerForm] = useState({
    full_name: '',
    email: '',
    password: '',
    department_id: '',
    employee_id: '',
  });

  // Assign Form
  const [assignForm, setAssignForm] = useState({
    course_id: '',
    lecturer_id: '',
    session_id: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [lecRes, depRes, couRes, sesRes, assRes] = await Promise.all([
        api.get('/admin/lecturers'),
        api.get('/admin/departments'),
        api.get('/admin/courses'),
        api.get('/admin/sessions'),
        api.get('/admin/course-assignments'),
      ]);
      setLecturers(lecRes.data.lecturers || []);
      setDepartments(depRes.data.departments || []);
      setCourses(couRes.data.courses || []);
      setSessions(sesRes.data.sessions || []);
      setAssignments(assRes.data.assignments || []);
    } catch (err) {
      console.error('Failed to load lecturers data:', err);
      toast.error('Failed to load lecturers and assignments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/lecturers', lecturerForm);
      toast.success('Lecturer created successfully!');
      setIsLecturerModalOpen(false);
      setLecturerForm({
        full_name: '',
        email: '',
        password: '',
        department_id: '',
        employee_id: '',
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create lecturer');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/course-assignments', assignForm);
      toast.success('Course assigned to lecturer successfully!');
      setIsAssignModalOpen(false);
      setAssignForm({ course_id: '', lecturer_id: '', session_id: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to assign course');
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await api.delete(`/admin/course-assignments/${id}`);
      toast.success('Course assignment removed');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to delete assignment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Lecturer Faculty & Course Assignments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create instructor accounts and assign university courses for the active session.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="secondary" onClick={() => setIsAssignModalOpen(true)}>
            <BookOpen className="w-4 h-4 mr-1.5" />
            Assign Course
          </Button>
          <Button variant="primary" onClick={() => setIsLecturerModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Lecturer
          </Button>
        </div>
      </div>

      {/* Grid: Lecturers on left, Assignments on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LECTURERS LIST */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Academic Lecturers ({lecturers.length})
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
            {lecturers.map((lec) => (
              <div key={lec.id} className="py-3 flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {lec.user_profiles?.full_name}
                  </p>
                  <p className="text-[11px] text-slate-500">{lec.user_profiles?.email}</p>
                  <div className="flex items-center space-x-2 text-[10px]">
                    <span className="font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      ID: {lec.employee_id}
                    </span>
                    <span className="text-slate-400">{lec.departments?.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVE COURSE ASSIGNMENTS */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Active Course Teaching Assignments ({assignments.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Assigned Lecturer</th>
                  <th className="py-2.5 px-3">Session</th>
                  <th className="py-2.5 px-3 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assignments.map((ass) => (
                  <tr key={ass.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3">
                      <p className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {ass.courses?.code}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                        {ass.courses?.name}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {ass.lecturers?.user_profiles?.full_name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {ass.lecturers?.employee_id}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {ass.academic_sessions?.name}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteAssignment(ass.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE LECTURER MODAL */}
      {isLecturerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Add Faculty Lecturer
              </h3>
              <button
                onClick={() => setIsLecturerModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLecturer} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Full Name (e.g. Dr. Paul Nkem)
                </label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={lecturerForm.full_name}
                  onChange={(e) => setLecturerForm({ ...lecturerForm, full_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. p.nkem@unhimas.cm"
                  value={lecturerForm.email}
                  onChange={(e) => setLecturerForm({ ...lecturerForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Portal Password
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  value={lecturerForm.password}
                  onChange={(e) => setLecturerForm({ ...lecturerForm, password: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LEC-042"
                    value={lecturerForm.employee_id}
                    onChange={(e) => setLecturerForm({ ...lecturerForm, employee_id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                    Department
                  </label>
                  <select
                    value={lecturerForm.department_id}
                    onChange={(e) => setLecturerForm({ ...lecturerForm, department_id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setIsLecturerModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Lecturer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN COURSE MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Assign Course to Lecturer
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Course to Assign
                </label>
                <select
                  value={assignForm.course_id}
                  onChange={(e) => setAssignForm({ ...assignForm, course_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name} ({c.credits} Credits)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Lecturer
                </label>
                <select
                  value={assignForm.lecturer_id}
                  onChange={(e) => setAssignForm({ ...assignForm, lecturer_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                >
                  <option value="">Select Lecturer</option>
                  {lecturers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.user_profiles?.full_name} ({l.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Academic Session
                </label>
                <select
                  value={assignForm.session_id}
                  onChange={(e) => setAssignForm({ ...assignForm, session_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                >
                  <option value="">Select Session</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.is_active ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Confirm Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
