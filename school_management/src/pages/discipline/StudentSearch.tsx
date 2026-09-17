import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Student, Class } from '../../types/index';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Search, ShieldAlert, History } from 'lucide-react';
import toast from 'react-hot-toast';

export const DisciplineStudentSearch: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const clsRes = await api.get('/discipline/classes');
        setClasses(clsRes.data.classes);
      } catch {
        toast.error('Failed to load classes');
      }
    }
    loadData();
  }, []);

  const searchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/discipline/students?search=${encodeURIComponent(search)}&class_id=${selectedClassId}`
      );
      setStudents(res.data.students);
    } catch {
      toast.error('Failed to search students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchStudents();
  }, [selectedClassId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchStudents();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Discipline Student Lookup</h2>
        <p className="text-xs text-slate-400">Search for students to view discipline history or log new incidents</p>
      </div>

      <Card>
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search student by name or code (e.g. SCH-2026-F4-0142)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Select
              className="flex-1"
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
            <Button type="submit" className="flex items-center space-x-1">
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Matching Students">
        <Table
          data={students}
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
            {
              header: 'Actions',
              accessor: (s) => (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => navigate(`/discipline/log?student_id=${s.id}`)}
                    className="flex items-center space-x-1"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Log Incident</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/discipline/history?student_id=${s.id}`)}
                    className="flex items-center space-x-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>View History</span>
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
