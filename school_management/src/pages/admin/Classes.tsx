import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Class, Subject, UserProfile, AcademicPeriod } from '../../types/index';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Plus, BookOpen, UserCheck, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminClasses: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  // Active tab
  const [tab, setTab] = useState<'classes' | 'subjects' | 'periods'>('classes');

  // Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);

  // Form states
  const [className, setClassName] = useState('');
  const [classStream, setClassStream] = useState('');

  const [subjectName, setSubjectName] = useState('');
  const [subjectClassId, setSubjectClassId] = useState('');
  const [subjectCoeff, setSubjectCoeff] = useState('1');

  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('');

  const [periodYear, setPeriodYear] = useState('2025-2026');
  const [periodTerm, setPeriodTerm] = useState('1');
  const [periodSeq, setPeriodSeq] = useState('1');

  const loadData = async () => {
    try {
      const [clsRes, subRes, usrRes, prdRes] = await Promise.all([
        api.get('/admin/classes'),
        api.get('/admin/subjects'),
        api.get('/admin/users'),
        api.get('/admin/periods'),
      ]);
      setClasses(clsRes.data.classes);
      setSubjects(subRes.data.subjects);
      setTeachers(usrRes.data.users.filter((u: UserProfile) => u.role === 'teacher'));
      setPeriods(prdRes.data.periods);
    } catch {
      toast.error('Failed to load academic data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/classes', { name: className, stream: classStream || null });
      toast.success('Class created!');
      setIsClassModalOpen(false);
      setClassName('');
      setClassStream('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create class');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/subjects', {
        name: subjectName,
        class_id: subjectClassId,
        coefficient: parseFloat(subjectCoeff) || 1,
      });
      toast.success('Subject created!');
      setIsSubjectModalOpen(false);
      setSubjectName('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create subject');
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/teacher-subjects', {
        teacher_id: assignTeacherId,
        subject_id: assignSubjectId,
      });
      toast.success('Teacher assigned to subject!');
      setIsAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to assign teacher');
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/periods', {
        year: periodYear,
        term: parseInt(periodTerm),
        sequence: parseInt(periodSeq),
        active: true,
      });
      toast.success('Academic period created and set to active!');
      setIsPeriodModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create period');
    }
  };

  const setPeriodActive = async (id: string) => {
    try {
      await api.patch(`/admin/periods/${id}`, { active: true });
      toast.success('Active period updated');
      loadData();
    } catch {
      toast.error('Failed to update period');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Academic Structure</h2>
          <p className="text-xs text-slate-400">Manage classes, streams, subjects, coefficients & periods</p>
        </div>

        {/* Tab selector */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 space-x-1">
          <button
            onClick={() => setTab('classes')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === 'classes' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Classes & Streams
          </button>
          <button
            onClick={() => setTab('subjects')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === 'subjects' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Subjects & Teachers
          </button>
          <button
            onClick={() => setTab('periods')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === 'periods' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Academic Periods
          </button>
        </div>
      </div>

      {/* ── Tab 1: Classes ── */}
      {tab === 'classes' && (
        <Card
          title="Classes & Streams"
          action={
            <Button size="sm" onClick={() => setIsClassModalOpen(true)} className="flex items-center space-x-1">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Class</span>
            </Button>
          }
        >
          <Table
            data={classes}
            isLoading={loading}
            keyExtractor={(c) => c.id}
            columns={[
              { header: 'Class Name', accessor: (c) => <span className="font-semibold text-slate-100">{c.name}</span> },
              { header: 'Stream', accessor: (c) => c.stream ? <Badge variant="info">{c.stream}</Badge> : <span className="text-slate-500">None</span> },
              { header: 'Subjects', accessor: (c) => <span className="text-xs">{c.subjects?.length || 0} subjects</span> },
            ]}
          />
        </Card>
      )}

      {/* ── Tab 2: Subjects & Teachers ── */}
      {tab === 'subjects' && (
        <Card
          title="Subjects & Teacher Assignments"
          action={
            <div className="flex space-x-2">
              <Button size="sm" onClick={() => setIsSubjectModalOpen(true)} className="flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Add Subject</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsAssignModalOpen(true)} className="flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Assign Teacher</span>
              </Button>
            </div>
          }
        >
          <Table
            data={subjects}
            isLoading={loading}
            keyExtractor={(s) => s.id}
            columns={[
              { header: 'Subject', accessor: (s) => <span className="font-semibold text-slate-100">{s.name}</span> },
              { header: 'Class', accessor: (s) => `${s.class?.name}${s.class?.stream ? ` (${s.class.stream})` : ''}` },
              { header: 'Coefficient', accessor: (s) => <Badge variant="warning">{s.coefficient}</Badge> },
              {
                header: 'Assigned Teacher(s)',
                accessor: (s) => (
                  <div>
                    {s.teacher_subjects && s.teacher_subjects.length > 0 ? (
                      s.teacher_subjects.map((ts, idx) => (
                        <span key={idx} className="text-xs text-emerald-400 font-medium block">
                          {ts.profiles?.full_name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-rose-400">Unassigned</span>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* ── Tab 3: Periods ── */}
      {tab === 'periods' && (
        <Card
          title="Academic Periods"
          subtitle="Sequences & Terms for report card generation"
          action={
            <Button size="sm" onClick={() => setIsPeriodModalOpen(true)} className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Add Period</span>
            </Button>
          }
        >
          <Table
            data={periods}
            isLoading={loading}
            keyExtractor={(p) => p.id}
            columns={[
              { header: 'Academic Year', accessor: 'year' },
              { header: 'Term', accessor: (p) => `Term ${p.term}` },
              { header: 'Sequence', accessor: (p) => `Seq ${(p.term - 1) * 2 + p.sequence}` },
              { header: 'Label', accessor: (p) => <span className="font-semibold text-amber-400">{p.label}</span> },
              {
                header: 'Status',
                accessor: (p) => (
                  <Badge variant={p.active ? 'success' : 'neutral'}>
                    {p.active ? 'Active Period' : 'Inactive'}
                  </Badge>
                ),
              },
              {
                header: 'Action',
                accessor: (p) => (
                  !p.active ? (
                    <Button size="sm" variant="outline" onClick={() => setPeriodActive(p.id)}>
                      Set Active
                    </Button>
                  ) : null
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* Create Class Modal */}
      <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title="Add New Class">
        <form onSubmit={handleCreateClass} className="space-y-4">
          <Input
            label="Class Name"
            placeholder="e.g. Form 4, Lower Sixth"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
          />
          <Input
            label="Stream (Optional)"
            placeholder="e.g. Science, Arts"
            value={classStream}
            onChange={(e) => setClassStream(e.target.value)}
          />
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="ghost" type="button" onClick={() => setIsClassModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Class</Button>
          </div>
        </form>
      </Modal>

      {/* Create Subject Modal */}
      <Modal isOpen={isSubjectModalOpen} onClose={() => setIsSubjectModalOpen(false)} title="Add Subject">
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <Input
            label="Subject Name"
            placeholder="e.g. Mathematics, Chemistry"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            required
          />
          <Select
            label="Target Class"
            value={subjectClassId}
            onChange={(e) => setSubjectClassId(e.target.value)}
            options={[
              { value: '', label: '-- Select Class --' },
              ...classes.map((c) => ({
                value: c.id,
                label: `${c.name}${c.stream ? ` (${c.stream})` : ''}`,
              })),
            ]}
            required
          />
          <Input
            label="Coefficient (Weight)"
            type="number"
            step="0.5"
            min="1"
            max="10"
            value={subjectCoeff}
            onChange={(e) => setSubjectCoeff(e.target.value)}
            required
          />
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="ghost" type="button" onClick={() => setIsSubjectModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Subject</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Teacher Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Teacher to Subject">
        <form onSubmit={handleAssignTeacher} className="space-y-4">
          <Select
            label="Subject"
            value={assignSubjectId}
            onChange={(e) => setAssignSubjectId(e.target.value)}
            options={[
              { value: '', label: '-- Select Subject --' },
              ...subjects.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.class?.name}${s.class?.stream ? ` - ${s.class.stream}` : ''})`,
              })),
            ]}
            required
          />
          <Select
            label="Teacher"
            value={assignTeacherId}
            onChange={(e) => setAssignTeacherId(e.target.value)}
            options={[
              { value: '', label: '-- Select Teacher --' },
              ...teachers.map((t) => ({ value: t.id, label: t.full_name })),
            ]}
            required
          />
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="ghost" type="button" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button type="submit">Assign Teacher</Button>
          </div>
        </form>
      </Modal>

      {/* Create Period Modal */}
      <Modal isOpen={isPeriodModalOpen} onClose={() => setIsPeriodModalOpen(false)} title="Add Academic Period">
        <form onSubmit={handleCreatePeriod} className="space-y-4">
          <Input
            label="Academic Year"
            placeholder="e.g. 2025-2026"
            value={periodYear}
            onChange={(e) => setPeriodYear(e.target.value)}
            required
          />
          <Select
            label="Term"
            value={periodTerm}
            onChange={(e) => setPeriodTerm(e.target.value)}
            options={[
              { value: '1', label: 'Term 1' },
              { value: '2', label: 'Term 2' },
              { value: '3', label: 'Term 3' },
            ]}
          />
          <Select
            label="Sequence"
            value={periodSeq}
            onChange={(e) => setPeriodSeq(e.target.value)}
            options={[
              { value: '1', label: 'Sequence 1 (First half of term)' },
              { value: '2', label: 'Sequence 2 (Second half of term)' },
            ]}
          />
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="ghost" type="button" onClick={() => setIsPeriodModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Period</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
