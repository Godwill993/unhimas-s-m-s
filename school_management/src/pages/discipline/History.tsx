import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import type { DisciplineRecord, Class } from '../../types/index';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export const DisciplineHistory: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialStudentId = searchParams.get('student_id') || '';

  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    async function loadMeta() {
      try {
        const clsRes = await api.get('/discipline/classes');
        setClasses(clsRes.data.classes);
      } catch {
        toast.error('Failed to load classes');
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        let url = `/discipline/records?`;
        if (initialStudentId) url += `student_id=${initialStudentId}&`;
        if (selectedClassId) url += `class_id=${selectedClassId}&`;
        if (selectedType) url += `type=${selectedType}&`;

        const res = await api.get(url);
        setRecords(res.data.records);
      } catch {
        toast.error('Failed to load discipline history');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [initialStudentId, selectedClassId, selectedType]);

  const typeVariants: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = {
    absence: 'warning',
    lateness: 'info',
    misconduct: 'danger',
    sanction: 'danger',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Discipline History</h2>
        <p className="text-xs text-slate-400">Complete log of student infractions, absences, and sanctions</p>
      </div>

      <Card className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Filter Class"
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
          label="Filter Category"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          options={[
            { value: '', label: 'All Categories' },
            { value: 'absence', label: 'Absence' },
            { value: 'lateness', label: 'Lateness' },
            { value: 'misconduct', label: 'Misconduct' },
            { value: 'sanction', label: 'Sanction' },
          ]}
        />
      </Card>

      <Card title="Infraction Log">
        <Table
          data={records}
          isLoading={loading}
          keyExtractor={(r) => r.id}
          columns={[
            { header: 'Date', accessor: (r) => <span className="font-mono text-xs text-slate-300">{r.date}</span> },
            {
              header: 'Student',
              accessor: (r) => (
                <div>
                  <p className="font-semibold text-slate-100">{r.student?.full_name}</p>
                  <p className="text-xs font-mono text-amber-400">{r.student?.student_code}</p>
                </div>
              ),
            },
            {
              header: 'Category',
              accessor: (r) => (
                <Badge variant={typeVariants[r.type] || 'neutral'}>
                  {r.type.toUpperCase()}
                </Badge>
              ),
            },
            {
              header: 'Notes & Action Taken',
              accessor: (r) => <span className="text-xs text-slate-300">{r.notes || 'No notes'}</span>,
            },
            {
              header: 'Logged By',
              accessor: (r) => (
                <span className="text-xs text-slate-400">
                  {r.recorded_by_profile?.full_name || 'Staff'}
                </span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
