import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Class, AcademicPeriod, Student } from '../../types/index';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { FileText, Download, Archive } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminReports: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Selection state
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [downloadingSingle, setDownloadingSingle] = useState(false);
  const [downloadingBulk, setDownloadingBulk] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [clsRes, prdRes] = await Promise.all([
          api.get('/admin/classes'),
          api.get('/admin/periods'),
        ]);
        setClasses(clsRes.data.classes);
        setPeriods(prdRes.data.periods);

        const active = prdRes.data.periods.find((p: AcademicPeriod) => p.active);
        if (active) setSelectedPeriodId(active.id);
      } catch {
        toast.error('Failed to load classes or periods');
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    async function loadStudents() {
      if (!selectedClassId) {
        setStudents([]);
        return;
      }
      try {
        const res = await api.get(`/admin/students?class_id=${selectedClassId}`);
        setStudents(res.data.students);
      } catch {
        toast.error('Failed to load class students');
      }
    }
    loadStudents();
  }, [selectedClassId]);

  const handleDownloadSingle = async () => {
    if (!selectedStudentId || !selectedPeriodId) {
      toast.error('Please select a student and period');
      return;
    }
    setDownloadingSingle(true);
    try {
      const response = await api.get(
        `/admin/reports/student/${selectedStudentId}/pdf?period_id=${selectedPeriodId}`,
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_card.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report card downloaded!');
    } catch {
      toast.error('Failed to download PDF report');
    } finally {
      setDownloadingSingle(false);
    }
  };

  const handleDownloadBulk = async (format: 'zip' | 'merged') => {
    if (!selectedClassId || !selectedPeriodId) {
      toast.error('Please select a class and period');
      return;
    }
    setDownloadingBulk(true);
    try {
      const response = await api.get(
        `/admin/reports/class/${selectedClassId}/pdf?period_id=${selectedPeriodId}&format=${format}`,
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], {
        type: format === 'zip' ? 'application/zip' : 'application/pdf',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `class_reports.${format === 'zip' ? 'zip' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Class reports downloaded (${format.toUpperCase()})!`);
    } catch {
      toast.error('Failed to generate bulk reports');
    } finally {
      setDownloadingBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Report Card Generation</h2>
        <p className="text-xs text-slate-400">Generate and download single student or bulk class PDF report cards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Single Student Download */}
        <Card
          title="Single Student Report"
          subtitle="Generate PDF report for an individual student"
        >
          <div className="space-y-4">
            <Select
              label="1. Select Class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              options={[
                { value: '', label: '-- Select Class --' },
                ...classes.map((c) => ({
                  value: c.id,
                  label: `${c.name}${c.stream ? ` (${c.stream})` : ''}`,
                })),
              ]}
            />

            <Select
              label="2. Select Student"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={!selectedClassId}
              options={[
                { value: '', label: '-- Select Student --' },
                ...students.map((s) => ({
                  value: s.id,
                  label: `${s.full_name} (${s.student_code})`,
                })),
              ]}
            />

            <Select
              label="3. Select Academic Period"
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

            <Button
              className="w-full flex items-center justify-center space-x-2"
              onClick={handleDownloadSingle}
              isLoading={downloadingSingle}
              disabled={!selectedStudentId || !selectedPeriodId}
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Report</span>
            </Button>
          </div>
        </Card>

        {/* Bulk Class Download */}
        <Card
          title="Bulk Class Download"
          subtitle="Download PDF report cards for an entire class"
        >
          <div className="space-y-4">
            <Select
              label="1. Select Class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              options={[
                { value: '', label: '-- Select Class --' },
                ...classes.map((c) => ({
                  value: c.id,
                  label: `${c.name}${c.stream ? ` (${c.stream})` : ''}`,
                })),
              ]}
            />

            <Select
              label="2. Select Academic Period"
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

            <div className="pt-2 grid grid-cols-2 gap-3">
              <Button
                variant="primary"
                className="flex items-center justify-center space-x-2"
                onClick={() => handleDownloadBulk('zip')}
                isLoading={downloadingBulk}
                disabled={!selectedClassId || !selectedPeriodId}
              >
                <Archive className="w-4 h-4" />
                <span>Download .ZIP</span>
              </Button>

              <Button
                variant="secondary"
                className="flex items-center justify-center space-x-2"
                onClick={() => handleDownloadBulk('merged')}
                isLoading={downloadingBulk}
                disabled={!selectedClassId || !selectedPeriodId}
              >
                <FileText className="w-4 h-4" />
                <span>Merged PDF</span>
              </Button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Choose .ZIP for individual PDFs or Merged for a single printable document.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
