import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import type { AttendanceStatus } from '../../types/index';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { Save, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface StudentAttendanceRow {
  student_id: string;
  student_code: string;
  full_name: string;
  status: AttendanceStatus;
}

export const TeacherAttendance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get('class_id') || '';

  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [rows, setRows] = useState<StudentAttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await api.get('/teacher/classes');
        setAssignedClasses(res.data.classes);
        if (res.data.classes.length > 0 && !initialClassId) {
          setSelectedClassId(res.data.classes[0].class.id);
        }
      } catch {
        toast.error('Failed to load classes');
      }
    }
    loadClasses();
  }, [initialClassId]);

  useEffect(() => {
    if (!selectedClassId || !date) return;

    async function loadAttendanceData() {
      setLoading(true);
      try {
        const res = await api.get(`/teacher/attendance?class_id=${selectedClassId}&date=${date}`);
        const { students, attendance } = res.data;

        const attendanceMap = new Map<string, AttendanceStatus>();
        (attendance || []).forEach((a: any) => attendanceMap.set(a.student_id, a.status));

        const gridRows: StudentAttendanceRow[] = (students || []).map((s: any) => ({
          student_id: s.id,
          student_code: s.student_code,
          full_name: s.full_name,
          status: attendanceMap.get(s.id) || 'present', // default present
        }));

        setRows(gridRows);
      } catch {
        toast.error('Failed to load attendance');
      } finally {
        setLoading(false);
      }
    }
    loadAttendanceData();
  }, [selectedClassId, date]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );
  };

  const setAllStatus = (status: AttendanceStatus) => {
    setRows((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSave = async () => {
    if (!selectedClassId || !date || rows.length === 0) return;

    setSaving(true);
    try {
      await api.post('/teacher/attendance', {
        class_id: selectedClassId,
        date,
        records: rows.map((r) => ({
          student_id: r.student_id,
          status: r.status,
        })),
      });
      toast.success('Attendance saved successfully!');
    } catch {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Class Session Attendance</h2>
        <p className="text-xs text-slate-400">Record daily attendance (Present, Absent, Late)</p>
      </div>

      <Card className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Card>

      <Card
        title="Attendance Roster"
        action={
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={() => setAllStatus('present')}>
              Mark All Present
            </Button>
            <Button
              onClick={handleSave}
              isLoading={saving}
              disabled={rows.length === 0}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Attendance</span>
            </Button>
          </div>
        }
      >
        {loading ? (
          <div className="flex justify-center p-12">
            <Spinner size="md" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Select a class to record attendance.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Student Code</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.map((row) => (
                  <tr key={row.student_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-amber-400 font-semibold">{row.student_code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-100">{row.full_name}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setStatus(row.student_id, 'present')}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            row.status === 'present'
                              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-emerald-400'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Present</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus(row.student_id, 'late')}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            row.status === 'late'
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-amber-400'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Late</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus(row.student_id, 'absent')}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            row.status === 'absent'
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-rose-400'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Absent</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
