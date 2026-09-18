import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { BookOpen, CheckSquare, Calendar, FolderDown, Users, Award } from 'lucide-react';

export const LecturerMyCourses: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await api.get('/lecturer/my-courses');
        setAssignments(res.data.assignments || []);
      } catch (err) {
        console.error('Failed to load lecturer courses:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourses();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          My Teaching Courses
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Courses assigned to you for the active academic session. Manage grades, student attendance, and course handouts.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No courses currently assigned
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please contact the Academic Dean or Department Coordinator to have courses assigned to your instructor profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((ass) => (
            <div
              key={ass.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                    {ass.courses?.code}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {ass.courses?.credits} Credits
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {ass.courses?.name}
                </h3>

                <p className="text-xs text-slate-500">
                  {ass.courses?.programs?.name} &bull; Sem {ass.courses?.semester}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2">
                <button
                  onClick={() => navigate(`/lecturer/scores?course_id=${ass.course_id}`)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[10px] font-bold transition-colors"
                >
                  <Award className="w-4 h-4 mb-1" />
                  <span>Grades</span>
                </button>

                <button
                  onClick={() => navigate(`/lecturer/attendance?course_id=${ass.course_id}`)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-[10px] font-bold transition-colors"
                >
                  <Calendar className="w-4 h-4 mb-1" />
                  <span>Attendance</span>
                </button>

                <button
                  onClick={() => navigate(`/lecturer/resources?course_id=${ass.course_id}`)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[10px] font-bold transition-colors"
                >
                  <FolderDown className="w-4 h-4 mb-1" />
                  <span>Handouts</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
