import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Student, Class, DisciplineType } from '../../types/index';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const DisciplineLogIncident: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialStudentId = searchParams.get('student_id') || '';
  const navigate = useNavigate();

  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<DisciplineType>('misconduct');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await api.get('/discipline/classes');
        setClasses(res.data.classes);
      } catch {
        toast.error('Failed to load classes');
      }
    }
    loadClasses();
  }, []);

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await api.get(
          `/discipline/students${selectedClassId ? `?class_id=${selectedClassId}` : ''}`
        );
        setStudents(res.data.students);
      } catch {
        toast.error('Failed to load students');
      }
    }
    loadStudents();
  }, [selectedClassId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error('Please select a student');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/discipline/records', {
        student_id: selectedStudentId,
        date,
        type,
        notes,
      });
      toast.success('Discipline record logged successfully!');
      setNotes('');
      navigate(`/discipline/history?student_id=${selectedStudentId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to log discipline record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/discipline')}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Log Discipline Incident</h2>
          <p className="text-xs text-slate-400">Record absence, lateness, misconduct, or sanction for a student</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Filter Class (Optional)"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              options={[
                { value: '', label: 'All Classes' },
                ...classes.map((c) => ({
                  value: c.id,
                  label: `${c.name}${c.stream ? ` (${c.stream})` : ''}`,
                })),
              ]}
            />

            <Select
              label="Select Student"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              options={[
                { value: '', label: '-- Select Student --' },
                ...students.map((s) => ({
                  value: s.id,
                  label: `${s.full_name} (${s.student_code})`,
                })),
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Incident Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <Select
              label="Incident Category / Type"
              value={type}
              onChange={(e) => setType(e.target.value as DisciplineType)}
              options={[
                { value: 'absence', label: 'Unexcused Absence' },
                { value: 'lateness', label: 'Chronic Lateness' },
                { value: 'misconduct', label: 'Misconduct / Classroom Disruption' },
                { value: 'sanction', label: 'Official Sanction / Suspension' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Incident Notes & Details
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the incident, conduct issue, or sanction applied..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => navigate('/discipline')}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={submitting} className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Log Incident</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
