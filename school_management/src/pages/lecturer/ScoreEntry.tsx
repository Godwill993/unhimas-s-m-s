import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Award, CheckCircle2, Eye, EyeOff, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const LecturerScoreEntry: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCourseId = searchParams.get('course_id') || '';

  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [scores, setScores] = useState<{ [enrollmentId: string]: { ca: number | ''; exam: number | '' } }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

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

    async function loadStudents() {
      setIsLoading(true);
      try {
        const res = await api.get(`/lecturer/courses/${selectedCourseId}/students`);
        const list = res.data.enrollments || [];
        setEnrollments(list);

        // Prepopulate score inputs
        const scoreMap: any = {};
        let anyPublished = false;
        list.forEach((e: any) => {
          scoreMap[e.id] = {
            ca: e.grades?.ca_score !== undefined && e.grades?.ca_score !== null ? e.grades.ca_score : '',
            exam: e.grades?.exam_score !== undefined && e.grades?.exam_score !== null ? e.grades.exam_score : '',
          };
          if (e.grades?.is_published) anyPublished = true;
        });
        setScores(scoreMap);
        setIsPublished(anyPublished);
      } catch (err: any) {
        toast.error('Failed to load students for this course');
      } finally {
        setIsLoading(false);
      }
    }
    loadStudents();
  }, [selectedCourseId]);

  const handleScoreChange = (enrollmentId: string, field: 'ca' | 'exam', value: string) => {
    const num = value === '' ? '' : Math.max(0, Number(value));
    setScores((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        [field]: num,
      },
    }));
  };

  const calculateLiveGrade = (caVal: number | '', examVal: number | '') => {
    const ca = Number(caVal || 0);
    const exam = Number(examVal || 0);
    const total = Math.min(100, Math.max(0, ca + exam));

    let letter = 'F';
    let pts = 0.0;
    if (total >= 80) { letter = 'A'; pts = 4.0; }
    else if (total >= 75) { letter = 'B+'; pts = 3.5; }
    else if (total >= 70) { letter = 'B'; pts = 3.0; }
    else if (total >= 65) { letter = 'C+'; pts = 2.5; }
    else if (total >= 60) { letter = 'C'; pts = 2.0; }
    else if (total >= 50) { letter = 'D'; pts = 1.0; }

    return { total, letter, pts };
  };

  const handleSaveIndividual = async (enrollmentId: string) => {
    const s = scores[enrollmentId];
    if (!s) return;

    try {
      await api.post('/lecturer/grades/submit', {
        enrollment_id: enrollmentId,
        ca_score: s.ca === '' ? 0 : s.ca,
        exam_score: s.exam === '' ? 0 : s.exam,
      });
      toast.success('Grade recorded');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to record grade');
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const promises = enrollments.map((e) => {
        const s = scores[e.id];
        return api.post('/lecturer/grades/submit', {
          enrollment_id: e.id,
          ca_score: s?.ca === '' ? 0 : s?.ca,
          exam_score: s?.exam === '' ? 0 : s?.exam,
        });
      });
      await Promise.all(promises);
      toast.success('All course scores submitted successfully!');
    } catch (err: any) {
      toast.error('Failed to submit all scores');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    const activeAssignment = assignments.find((a) => a.course_id === selectedCourseId);
    if (!activeAssignment) return;

    try {
      const nextState = !isPublished;
      await api.put(`/lecturer/courses/${selectedCourseId}/toggle-publish`, {
        session_id: activeAssignment.session_id,
        is_published: nextState,
      });
      setIsPublished(nextState);
      toast.success(nextState ? 'Grades marked as published!' : 'Grades hidden from students.');
    } catch (err: any) {
      toast.error('Failed to toggle publication status');
    }
  };

  if (isLoading && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentAssignment = assignments.find((a) => a.course_id === selectedCourseId);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Course Score & Grade Entry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter Continuous Assessment (CA /30) and Final Exam (/70) scores. System computes Total, Letter Grade & GPA points automatically.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            onClick={handleTogglePublish}
            className="text-xs"
          >
            {isPublished ? (
              <>
                <EyeOff className="w-4 h-4 mr-1 text-amber-500" />
                Unpublish Course Grades
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1 text-emerald-500" />
                Publish Grades to Students
              </>
            )}
          </Button>

          <Button variant="primary" onClick={handleSaveAll} isLoading={isSaving} className="text-xs">
            <Save className="w-4 h-4 mr-1" />
            Save All Scores
          </Button>
        </div>
      </div>

      {/* Course Selector Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            Selected Course:
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full sm:w-80 p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
          >
            {assignments.map((a) => (
              <option key={a.course_id} value={a.course_id}>
                {a.courses?.code} - {a.courses?.name} ({a.courses?.credits} Cr)
              </option>
            ))}
          </select>
        </div>

        {currentAssignment && (
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>Enrolled: <strong>{enrollments.length} students</strong></span>
            <span>&bull;</span>
            <span>Program: <strong>{currentAssignment.courses?.programs?.code}</strong></span>
          </div>
        )}
      </div>

      {/* Score Entry Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {enrollments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No students currently enrolled in this course.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Matricule</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center">CA Score (/30)</th>
                  <th className="py-3 px-4 text-center">Exam Score (/70)</th>
                  <th className="py-3 px-4 text-center">Total (/100)</th>
                  <th className="py-3 px-4 text-center">Letter Grade</th>
                  <th className="py-3 px-4 text-center">GPA Pts</th>
                  <th className="py-3 px-4 text-right">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {enrollments.map((e) => {
                  const s = scores[e.id] || { ca: '', exam: '' };
                  const live = calculateLiveGrade(s.ca, s.exam);

                  return (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {e.students?.matricule}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {e.students?.user_profiles?.full_name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          step="0.5"
                          placeholder="0-30"
                          value={s.ca}
                          onChange={(ev) => handleScoreChange(e.id, 'ca', ev.target.value)}
                          className="w-16 p-1.5 text-center font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="70"
                          step="0.5"
                          placeholder="0-70"
                          value={s.exam}
                          onChange={(ev) => handleScoreChange(e.id, 'exam', ev.target.value)}
                          className="w-16 p-1.5 text-center font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-black text-sm text-slate-900 dark:text-slate-100">
                        {live.total}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-xs ${
                            live.letter === 'A'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : live.letter.startsWith('B')
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                              : live.letter.startsWith('C')
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {live.letter}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {live.pts.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSaveIndividual(e.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
