import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import type { AcademicPeriod } from '../../types/index';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface StudentScoreRow {
  student_id: string;
  student_code: string;
  full_name: string;
  mark: string; // string representation for input control
}

export const TeacherScoreEntry: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get('class_id') || '';

  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);

  // Selected filters
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  // Grid state
  const [rows, setRows] = useState<StudentScoreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  useEffect(() => {
    async function loadMeta() {
      try {
        const [clsRes, prdRes] = await Promise.all([
          api.get('/teacher/classes'),
          api.get('/teacher/periods'),
        ]);
        setAssignedClasses(clsRes.data.classes);
        setPeriods(prdRes.data.periods);

        const activePeriod = prdRes.data.periods.find((p: AcademicPeriod) => p.active);
        if (activePeriod) setSelectedPeriodId(activePeriod.id);

        if (clsRes.data.classes.length > 0 && !initialClassId) {
          setSelectedClassId(clsRes.data.classes[0].class.id);
        }
      } catch {
        toast.error('Failed to load initial data');
      }
    }
    loadMeta();
  }, [initialClassId]);

  // Set default subject when class changes
  useEffect(() => {
    if (!selectedClassId) return;
    const classData = assignedClasses.find((item) => item.class.id === selectedClassId);
    if (classData && classData.subjects.length > 0) {
      setSelectedSubjectId(classData.subjects[0].id);
    } else {
      setSelectedSubjectId('');
    }
  }, [selectedClassId, assignedClasses]);

  // Load students & scores grid
  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId || !selectedPeriodId) {
      setRows([]);
      return;
    }

    async function fetchGridData() {
      setLoading(true);
      try {
        const [stdRes, scRes] = await Promise.all([
          api.get(`/teacher/students?class_id=${selectedClassId}`),
          api.get(`/teacher/scores?subject_id=${selectedSubjectId}&period_id=${selectedPeriodId}`),
        ]);

        const students = stdRes.data.students;
        const scores = scRes.data.scores;
        const scoreMap = new Map<string, number>();

        scores.forEach((s: any) => scoreMap.set(s.student_id, s.mark));

        const gridRows: StudentScoreRow[] = students.map((std: any) => ({
          student_id: std.id,
          student_code: std.student_code,
          full_name: std.full_name,
          mark: scoreMap.has(std.id) ? scoreMap.get(std.id)!.toString() : '',
        }));

        setRows(gridRows);
        setDirty(false);
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to load scores grid');
      } finally {
        setLoading(false);
      }
    }

    fetchGridData();
  }, [selectedClassId, selectedSubjectId, selectedPeriodId]);

  const handleMarkChange = (studentId: string, val: string) => {
    // Validate number 0-20
    if (val !== '' && (isNaN(Number(val)) || Number(val) < 0 || Number(val) > 20)) {
      return;
    }

    setRows((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, mark: val } : r))
    );
    setDirty(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextRef = inputRefs.current.get(rows[index + 1]?.student_id);
      if (nextRef) nextRef.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevRef = inputRefs.current.get(rows[index - 1]?.student_id);
      if (prevRef) prevRef.focus();
    }
  };

  const handleSaveAll = async () => {
    if (!selectedSubjectId || !selectedPeriodId) return;

    // Filter valid scores
    const payloadScores = rows
      .filter((r) => r.mark !== '')
      .map((r) => ({
        student_id: r.student_id,
        mark: parseFloat(r.mark),
      }));

    if (payloadScores.length === 0) {
      toast.error('No valid scores to save');
      return;
    }

    setSaving(true);
    try {
      await api.post('/teacher/scores', {
        subject_id: selectedSubjectId,
        period_id: selectedPeriodId,
        scores: payloadScores,
      });
      toast.success(`Saved ${payloadScores.length} scores successfully!`);
      setDirty(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save scores');
    } finally {
      setSaving(false);
    }
  };

  const selectedClass = assignedClasses.find((c) => c.class.id === selectedClassId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Spreadsheet Score Entry Grid</h2>
          <p className="text-xs text-slate-400">Fast batch mark entry (0 to 20). Press Enter or Down arrow to move between students.</p>
        </div>
        {dirty && (
          <Badge variant="warning" className="animate-pulse">
            Unsaved Changes
          </Badge>
        )}
      </div>

      {/* Selectors Bar */}
      <Card className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Class"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          options={[
            { value: '', label: '-- Select Class --' },
            ...assignedClasses.map((item) => ({
              value: item.class.id,
              label: `${item.class.name}${item.class.stream ? ` (${item.class.stream})` : ''}`,
            })),
          ]}
        />

        <Select
          label="Subject"
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          disabled={!selectedClassId || !selectedClass}
          options={[
            { value: '', label: '-- Select Subject --' },
            ...(selectedClass?.subjects || []).map((s: any) => ({
              value: s.id,
              label: `${s.name} (Coeff ${s.coefficient})`,
            })),
          ]}
        />

        <Select
          label="Academic Period"
          value={selectedPeriodId}
          onChange={(e) => setSelectedPeriodId(e.target.value)}
          options={[
            { value: '', label: '-- Select Period --' },
            ...periods.map((p) => ({
              value: p.id,
              label: `${p.label} (${p.year})${p.active ? ' - ACTIVE' : ''}`,
            })),
          ]}
        />
      </Card>

      {/* Spreadsheet Grid */}
      <Card
        title="Student Marks Grid"
        action={
          <Button
            onClick={handleSaveAll}
            isLoading={saving}
            disabled={!dirty || rows.length === 0}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save All Marks</span>
          </Button>
        }
      >
        {loading ? (
          <div className="flex justify-center p-12">
            <Spinner size="md" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Select a Class, Subject, and Academic Period to populate the score grid.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 w-16">#</th>
                  <th className="px-4 py-3">Student Code</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3 w-48 text-center">Mark (/20)</th>
                  <th className="px-4 py-3 w-32 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.map((row, idx) => {
                  const markNum = row.mark !== '' ? parseFloat(row.mark) : null;
                  const isPass = markNum !== null && markNum >= 10;
                  const isFail = markNum !== null && markNum < 10;

                  return (
                    <tr key={row.student_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-slate-500 font-mono">{idx + 1}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-amber-400 font-semibold">{row.student_code}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-100">{row.full_name}</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          ref={(el) => {
                            if (el) inputRefs.current.set(row.student_id, el);
                          }}
                          type="number"
                          step="0.25"
                          min="0"
                          max="20"
                          placeholder="-- / 20"
                          value={row.mark}
                          onChange={(e) => handleMarkChange(row.student_id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                          className={`w-28 text-center px-3 py-1.5 bg-slate-950 border rounded-lg font-mono font-bold text-sm focus:outline-none focus:ring-2 transition-all ${
                            isPass
                              ? 'border-emerald-500/50 text-emerald-400 focus:ring-emerald-500/50'
                              : isFail
                              ? 'border-rose-500/50 text-rose-400 focus:ring-rose-500/50'
                              : 'border-slate-700 text-slate-100 focus:ring-amber-500/50'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {markNum !== null ? (
                          <Badge variant={isPass ? 'success' : 'danger'}>
                            {markNum >= 16
                              ? 'A'
                              : markNum >= 14
                              ? 'B'
                              : markNum >= 12
                              ? 'C'
                              : markNum >= 10
                              ? 'D'
                              : 'F'}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-600">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
