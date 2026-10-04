import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MdAssignment, MdLock, MdWarning } from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getMyStudentProfile, getMyResults } from '../../services/studentService';

function GradeCell({ grade, gp }) {
  const colors = {
    A: 'badge-green', B: 'badge-blue', C: 'badge-amber', D: 'badge-amber', F: 'badge-red',
  };
  return (
    <span className={`badge ${colors[grade] || 'badge-gray'}`}>
      {grade} ({gp})
    </span>
  );
}

export default function StudentResultsPage() {
  const { session } = useAuth();
  const [semFilter, setSemFilter] = useState('all');

  const { data: studentProfile, isLoading: stuLoading } = useQuery({
    queryKey: ['my-student-profile'],
    queryFn: getMyStudentProfile,
    enabled: !!session,
  });

  const studentId = studentProfile?.id;

  const { data: results = [], isLoading: resLoading } = useQuery({
    queryKey: ['my-results', studentId],
    queryFn: () => getMyResults(studentId),
    enabled: !!studentId,
  });

  // Group by semester
  const bySemester = {};
  results.forEach((r) => {
    const semKey = r.mark_submissions?.batch_courses?.semesters?.id;
    const semName = r.mark_submissions?.batch_courses?.semesters?.name
      + ' — '
      + r.mark_submissions?.batch_courses?.semesters?.academic_years?.name;
    const semNum = r.mark_submissions?.batch_courses?.semesters?.number;
    if (!bySemester[semKey]) {
      bySemester[semKey] = { semKey, semName, semNum, marks: [] };
    }
    bySemester[semKey].marks.push(r);
  });

  const semesters = Object.values(bySemester).sort((a, b) => b.semNum - a.semNum);

  const filtered = semFilter === 'all' ? semesters : semesters.filter((s) => s.semKey === semFilter);

  // GPA per semester
  const computeGPA = (marks) => {
    if (!marks.length) return null;
    const total = marks.reduce((sum, m) => sum + (m.grade_point || 0), 0);
    return (total / marks.length).toFixed(2);
  };

  const isLoading = stuLoading || resLoading;

  return (
    <AppLayout pageTitle="My Results">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">My Results</h1>
          <p className="page-subtitle">Published academic results only</p>
        </div>
      </div>

      {/* Semester filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${semFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setSemFilter('all')}
        >
          All Semesters
        </button>
        {semesters.map((s) => (
          <button
            key={s.semKey}
            className={`btn btn-sm ${semFilter === s.semKey ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSemFilter(s.semKey)}
          >
            {s.semName}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="card" style={{ padding: '1.5rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 6 }} />
              <div className="skeleton skeleton-text" style={{ width: '40%' }} />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: '3rem' }}>
          <div className="empty-state-icon" style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>
            <MdLock size={48} />
          </div>
          <div className="empty-state-title">No published results</div>
          <p className="empty-state-text">
            Your results will appear here once the administrator publishes them.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filtered.map((sem) => {
            const gpa = computeGPA(sem.marks);
            const failed = sem.marks.filter((m) => m.grade === 'F').length;
            return (
              <div key={sem.semKey} className="card">
                <div
                  className="card-header"
                  style={{
                    background: 'var(--color-primary)',
                    color: '#fff',
                    borderRadius: '0',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#fff' }}>{sem.semName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {failed > 0 && (
                      <span className="badge" style={{ background: 'rgba(183,0,50,0.35)', color: '#fff' }}>
                        <MdWarning /> {failed} Failed
                      </span>
                    )}
                    {gpa && (
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800 }}>
                        GPA: {gpa}
                      </span>
                    )}
                  </div>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Credit Units</th>
                        <th>Attendance</th>
                        <th>Coursework</th>
                        <th>Exam</th>
                        <th>Total</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sem.marks.map((m) => {
                        const course = m.mark_submissions?.batch_courses?.courses;
                        return (
                          <tr key={m.id} style={{ background: m.grade === 'F' ? 'rgba(183,0,50,0.03)' : undefined }}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{course?.name}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{course?.code}</div>
                            </td>
                            <td>{course?.credit_units}</td>
                            <td>{m.attendance_score}</td>
                            <td>{m.coursework_score}</td>
                            <td>{m.exam_score}</td>
                            <td>
                              <strong style={{ color: m.grade === 'F' ? 'var(--color-secondary)' : 'var(--color-text)' }}>
                                {m.total_score}
                              </strong>
                            </td>
                            <td>
                              <GradeCell grade={m.grade} gp={m.grade_point} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={6} style={{ fontWeight: 700, textAlign: 'right', paddingRight: '1rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                          Semester GPA:
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--color-primary)' }}>
                            {gpa || '—'}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
