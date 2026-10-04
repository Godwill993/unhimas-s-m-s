import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MdBook } from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getMyStudentProfile, getMyStudentCourses } from '../../services/studentService';

export default function StudentCoursesPage() {
  const { session } = useAuth();
  const [semFilter, setSemFilter] = useState('all');

  const { data: studentProfile } = useQuery({
    queryKey: ['my-student-profile'],
    queryFn: () => import('../../services/studentService').then((m) => m.getMyStudentProfile()),
    enabled: !!session,
  });

  const batchId = studentProfile?.batch_id;

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['my-student-courses', batchId],
    queryFn: () => getMyStudentCourses(batchId),
    enabled: !!batchId,
  });

  const semesters = [...new Map(courses.map((c) => [c.semesters?.id, c.semesters])).values()].filter(Boolean);
  const filtered = semFilter === 'all' ? courses : courses.filter((c) => c.semesters?.id === semFilter);

  return (
    <AppLayout pageTitle="My Courses">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">My Courses</h1>
          <p className="page-subtitle">Courses enrolled in your batch</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${semFilter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSemFilter('all')}>
          All Semesters
        </button>
        {semesters.map((sem) => (
          <button
            key={sem.id}
            className={`btn btn-sm ${semFilter === sem.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSemFilter(sem.id)}
          >
            {sem.name}
            {sem.is_current && <span className="badge badge-green" style={{ marginLeft: 6 }}>Current</span>}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ padding: '1.25rem' }}>
              <div className="skeleton skeleton-title" style={{ width: '70%', marginBottom: 8 }} />
              <div className="skeleton skeleton-text" style={{ width: '50%' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><MdBook /></div>
          <div className="empty-state-title">No courses found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map((bc) => (
            <div key={bc.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="badge badge-blue">{bc.courses?.code}</span>
                {bc.is_compulsory
                  ? <span className="badge badge-gray">Compulsory</span>
                  : <span className="badge badge-amber">Optional</span>
                }
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 4 }}>{bc.courses?.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                {bc.courses?.credit_units} credit unit(s)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>Lecturer:</span>{' '}
                {bc.lecturers ? `${bc.lecturers.first_name} ${bc.lecturers.last_name}` : '—'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <span style={{ fontWeight: 600 }}>Semester:</span> {bc.semesters?.name}
                {bc.semesters?.is_current && <span className="badge badge-green" style={{ marginLeft: 6 }}>Current</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
