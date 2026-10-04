import { useQuery } from '@tanstack/react-query';
import { MdHowToReg, MdWarning } from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getMyStudentProfile, getMyAttendanceSummary } from '../../services/studentService';

function AttendancePctBar({ pct }) {
  const color = pct >= 75 ? '#059669' : pct >= 60 ? '#b45309' : 'var(--color-secondary)';
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
        <span>{pct}%</span>
        <span style={{ color: pct < 75 ? 'var(--color-secondary)' : '#059669', fontWeight: 600 }}>
          {pct < 75 ? 'Below threshold' : 'Satisfactory'}
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(pct, 100)}%`,
            background: color,
            borderRadius: 4,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function StudentAttendancePage() {
  const { session } = useAuth();

  const { data: studentProfile } = useQuery({
    queryKey: ['my-student-profile'],
    queryFn: () => import('../../services/studentService').then((m) => m.getMyStudentProfile()),
    enabled: !!session,
  });

  const studentId = studentProfile?.id;
  const batchId = studentProfile?.batch_id;

  const { data: summary = [], isLoading } = useQuery({
    queryKey: ['my-attendance-summary', studentId, batchId],
    queryFn: () => getMyAttendanceSummary(studentId, batchId),
    enabled: !!studentId && !!batchId,
  });

  const lowCourses = summary.filter((c) => c.percentage < 75);
  const overallPct = summary.length > 0
    ? Math.round(summary.reduce((s, c) => s + c.percentage, 0) / summary.length)
    : null;

  return (
    <AppLayout pageTitle="My Attendance">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">My Attendance</h1>
          <p className="page-subtitle">Attendance breakdown per course</p>
        </div>
        {overallPct !== null && (
          <div
            style={{
              background: overallPct >= 75 ? 'rgba(16,185,129,0.08)' : 'rgba(183,0,50,0.06)',
              border: `1px solid ${overallPct >= 75 ? 'rgba(16,185,129,0.25)' : 'rgba(183,0,50,0.25)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '0.625rem 1rem',
              fontWeight: 800,
              fontSize: '1.25rem',
              color: overallPct >= 75 ? '#059669' : 'var(--color-secondary)',
            }}
          >
            {overallPct}% Overall
          </div>
        )}
      </div>

      {lowCourses.length > 0 && (
        <div
          style={{
            background: 'rgba(183,0,50,0.06)',
            border: '1px solid rgba(183,0,50,0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: 'var(--color-secondary)',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <MdWarning size={20} />
          You have below-threshold attendance in {lowCourses.length} course(s). Attendance must be ≥ 75%.
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ padding: '1.25rem' }}>
              <div className="skeleton skeleton-title" style={{ width: '70%', marginBottom: 8 }} />
              <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: 16 }} />
              <div className="skeleton skeleton-text" style={{ height: 6 }} />
            </div>
          ))}
        </div>
      ) : summary.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><MdHowToReg /></div>
          <div className="empty-state-title">No attendance records</div>
          <p className="empty-state-text">No class sessions have been recorded for your batch yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {summary.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{ padding: '1.25rem', borderLeft: `3px solid ${item.percentage < 75 ? 'var(--color-secondary)' : '#059669'}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div>
                  <span className="badge badge-blue" style={{ marginBottom: 4 }}>{item.courses?.code}</span>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>{item.courses?.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Sem {item.semesters?.number} — {item.semesters?.name}
                  </div>
                </div>
                {item.percentage < 75 && <MdWarning color="var(--color-secondary)" size={20} />}
              </div>

              <AttendancePctBar pct={item.percentage} />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  marginTop: '1rem',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                }}
              >
                {[
                  { label: 'Sessions', value: item.totalSessions, color: 'var(--color-text)' },
                  { label: 'Present', value: item.present, color: '#059669' },
                  { label: 'Absent', value: item.absent, color: 'var(--color-secondary)' },
                  { label: 'Late', value: item.late, color: '#b45309' },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: 'var(--color-bg)', borderRadius: 6, padding: '0.375rem 0.25rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: stat.color }}>{stat.value}</div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: 1 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
