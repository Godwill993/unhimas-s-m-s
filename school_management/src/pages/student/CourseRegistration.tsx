import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { BookOpen, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const StudentCourseRegistration: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/student/available-courses');
      const list = res.data.courses || [];
      setCourses(list);
      setActiveSession(res.data.activeSession);

      // Pre-select already enrolled courses
      const enrolled = list.filter((c: any) => c.isEnrolled).map((c: any) => c.id);
      setSelectedIds(enrolled);
    } catch (err: any) {
      toast.error('Failed to load courses for registration');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const toggleCourse = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one course');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/student/register-courses', { course_ids: selectedIds });
      toast.success('Course registration completed successfully!');
      fetchCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCredits = courses
    .filter((c) => selectedIds.includes(c.id))
    .reduce((sum, c) => sum + Number(c.credits || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Semester Course Registration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Active Session: <strong>{activeSession?.name || 'Current'}</strong>. Select the required courses for your degree program.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 text-xs font-bold text-blue-600 dark:text-blue-400">
            Selected: {totalCredits} Total Credits
          </div>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Confirm Enrolment
          </Button>
        </div>
      </div>

      {/* Courses List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {courses.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No courses available for your program in this session.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {courses.map((course) => {
              const isSelected = selectedIds.includes(course.id);
              return (
                <div
                  key={course.id}
                  onClick={() => toggleCourse(course.id)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50/50 dark:bg-blue-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by div click
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                          {course.code}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Semester {course.semester}
                        </span>
                        {course.isEnrolled && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Currently Registered
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {course.name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                      {course.credits} Credits
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
