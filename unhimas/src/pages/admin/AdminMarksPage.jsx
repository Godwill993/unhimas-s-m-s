import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MdGrade, MdSearch } from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import { getMarkSubmissions } from '../../services/operationsService';

export default function AdminMarksPage() {
  const [search, setSearch] = useState('');

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['admin-all-marks'],
    queryFn: () => getMarkSubmissions(),
  });

  const filtered = submissions.filter((s) => {
    const term = search.toLowerCase();
    const c = s.batch_courses?.courses?.code?.toLowerCase() || '';
    const n = s.batch_courses?.courses?.name?.toLowerCase() || '';
    const b = s.batch_courses?.batches?.name?.toLowerCase() || '';
    return c.includes(term) || n.includes(term) || b.includes(term);
  });

  return (
    <AppLayout pageTitle="Marks Overview">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Marks Management</h1>
          <p className="page-subtitle">Continuous Assessment (CA 30%) and Final Exam (70%) marks by batch course</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 200px' }}>
            <MdSearch
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                fontSize: '1.1rem',
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search by course code, batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Batch</th>
                <th>Semester</th>
                <th>Lecturer</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                    Loading marksheets...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <MdGrade className="empty-state-icon" />
                      <div className="empty-state-title">No Marksheets Created</div>
                      <div className="empty-state-text">
                        Marksheets are initiated when lecturers enter assessments for allocated courses.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <code>{s.batch_courses?.courses?.code}</code>{' '}
                      <strong>{s.batch_courses?.courses?.name}</strong>
                    </td>
                    <td>{s.batch_courses?.batches?.name} ({s.batch_courses?.batches?.code})</td>
                    <td>{s.batch_courses?.semesters?.name}</td>
                    <td>{s.lecturers?.first_name} {s.lecturers?.last_name}</td>
                    <td>
                      <span className={`badge ${s.status === 'published' ? 'badge-green' : s.status === 'approved' ? 'badge-blue' : 'badge-amber'}`}>
                        {s.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{new Date(s.updated_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
