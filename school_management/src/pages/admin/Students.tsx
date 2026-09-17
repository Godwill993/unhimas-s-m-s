import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Student, Class } from '../../types/index';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [classId, setClassId] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [submitting, setSubmitting] = useState(false);

  const loadStudents = async () => {
    try {
      const [stdRes, clsRes] = await Promise.all([
        api.get(`/admin/students${filterClass ? `?class_id=${filterClass}` : ''}`),
        api.get('/admin/classes'),
      ]);
      setStudents(stdRes.data.students);
      setClasses(clsRes.data.classes);
    } catch {
      toast.error('Failed to load student records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [filterClass]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/admin/students', {
        full_name: fullName,
        class_id: classId,
        guardian_name: guardianName || null,
        guardian_contact: guardianContact || null,
        dob: dob || null,
        gender,
      });
      toast.success(`Student created! Code: ${res.data.student.student_code}`);
      setIsModalOpen(false);
      setFullName('');
      setGuardianName('');
      setGuardianContact('');
      loadStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Student Directory</h2>
          <p className="text-xs text-slate-400">Manage enrolled students & generated student codes</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2">
          <UserPlus className="w-4 h-4" />
          <span>Add Student</span>
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Input
            placeholder="Search by student name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          options={[
            { value: '', label: 'All Classes' },
            ...classes.map((c) => ({
              value: c.id,
              label: `${c.name}${c.stream ? ` (${c.stream})` : ''}`,
            })),
          ]}
        />
      </div>

      <Card>
        <Table
          data={filteredStudents}
          isLoading={loading}
          keyExtractor={(s) => s.id}
          columns={[
            {
              header: 'Student Code',
              accessor: (s) => (
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                  {s.student_code}
                </span>
              ),
            },
            { header: 'Full Name', accessor: (s) => <span className="font-semibold text-slate-100">{s.full_name}</span> },
            {
              header: 'Class',
              accessor: (s) => `${s.class?.name || ''}${s.class?.stream ? ` (${s.class.stream})` : ''}`,
            },
            { header: 'Guardian', accessor: (s) => s.guardian_name || <span className="text-slate-500">N/A</span> },
            { header: 'Contact', accessor: (s) => s.guardian_contact || <span className="text-slate-500">N/A</span> },
            {
              header: 'Status',
              accessor: (s) => (
                <Badge variant={s.active ? 'success' : 'danger'}>
                  {s.active ? 'Enrolled' : 'Inactive'}
                </Badge>
              ),
            },
          ]}
        />
      </Card>

      {/* Add Student Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Student">
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Samuel Taku"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Select
            label="Assign to Class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            options={[
              { value: '', label: '-- Select Class --' },
              ...classes.map((c) => ({
                value: c.id,
                label: `${c.name}${c.stream ? ` (${c.stream})` : ''}`,
              })),
            ]}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
          <Input
            label="Guardian Name"
            placeholder="e.g. Mr. Joseph Taku"
            value={guardianName}
            onChange={(e) => setGuardianName(e.target.value)}
          />
          <Input
            label="Guardian Phone Contact"
            placeholder="e.g. +237 670 000 000"
            value={guardianContact}
            onChange={(e) => setGuardianContact(e.target.value)}
          />
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Register Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
