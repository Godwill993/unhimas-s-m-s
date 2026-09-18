import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Calendar, CheckCircle2, XCircle, Clock, Save, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export const LecturerAttendance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCourseId = searchParams.get('course_id') || '';

  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<{ [studentId: string]: 'present' | 'absent' | 'late' }>({});
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await api.get('/lecturer/my-courses');
        const list = res.data.assignments || [];
        setAssignments(list);
        if (!selectedCourseId && list.length > 0) {
          setSelectedCourseId(list[0].course_id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;

    async function loadCourseData() {
      setIsLoading(true);
      try {
        const [enRes, attRes] = await Promise.all([
          api.get(`/lecturer/courses/${selectedCourseId}/students`),
          api.get(`/lecturer/attendance/course/${selectedCourseId}`),
        ]);
        const list = enRes.data.enrollments || [];
        setEnrollments(list);
        setPastSessions(attRes.data.sessions || []);

        // Default all students to present
        const initStatus: any = {};
        list.forEach((e: any) => {
          initStatus[e.student_id] = 'present';
        });
        setStatuses(initStatus);
      } catch (err) {
        toast.error('Failed to load course attendance data');
      } finally {
        setIsLoading(false);
      }
    }
    loadCourseData();
  }, [selectedCourseId]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setStatuses((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    const currentAssignment = assignments.find((a) => a.course_id === selectedCourseId);
    if (!currentAssignment) return;

    setIsSaving(true);
    try {
      const records = enrollments.map((e) => ({
        student_id: e.student_id,
        status: statuses[e.student_id] || 'present',
      }));

      await api.post('/lecturer/attendance/session', {
        course_id: selectedCourseId,
        session_id: currentAssignment.session_id,
        date,
        records,
      });

      toast.success('Course session attendance saved successfully!');
      // Refresh past sessions
      const attRes = await api.get(`/lecturer/attendance/course/${selectedCourseId}`);
      setPastSessions(attRes.data.sessions || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Course Attendance Register
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Record and track student attendance (Present, Absent, Late) per lecture session.
          </p>
        </div>

        <Button variant="primary" onClick={handleSaveAttendance} isLoading={isSaving}>
          <Save className="w-4 h-4 mr-1.5" />
          Save Session Attendance
        </Button>
      </div>

      {/* Course & Date Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Course
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
          >
            {assignments.map((a) => (
              <option key={a.course_id} value={a.course_id}>
                {a.courses?.code} - {a.courses?.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Lecture Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Attendance Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Enrolled Students ({enrollments.length})
          </h3>
          <span className="text-xs text-slate-400">Date: {date}</span>
        </div>

        {enrollments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No students enrolled in this course yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Matricule</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {enrollments.map((e) => {
                  const currStatus = statuses[e.student_id] || 'present';
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {e.students?.matricule}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {e.students?.user_profiles?.full_name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(e.student_id, 'present')}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                              currStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Present</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(e.student_id, 'absent')}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                              currStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Absent</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(e.student_id, 'late')}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                              currStatus === 'late'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Late</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Past Attendance Sessions */}
      {pastSessions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Previous Recorded Sessions ({pastSessions.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {pastSessions.map((ps) => (
              <div
                key={ps.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1"
              >
                <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>{ps.date}</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Recorded: {ps.attendance_records?.length || 0} students
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
