import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  MdBook,
  MdHowToReg,
  MdAssignment,
  MdNotifications,
  MdCampaign,
  MdWarning,
  MdCheckCircle,
  MdRefresh,
  MdTrendingUp,
} from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import {
  getMyStudentProfile,
  getStudentDashboardStats,
  getMyAnnouncements,
  getStudentNotifications,
} from '../../services/studentService';

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, color = 'blue', link, suffix = '' }) {
  const inner = (
    <div className="stat-card">
      <div className={`stat-card-icon ${color}`}>{icon}</div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value !== null && value !== undefined ? `${value}${suffix}` : '—'}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
  if (link) return <Link to={link} style={{ textDecoration: 'none' }}>{inner}</Link>;
  return inner;
}

function StatSkeleton() {
  return (
    <div className="stat-card">
      <div className="skeleton skeleton-box" style={{ width: 44, height: 44, borderRadius: 8 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton skeleton-title" style={{ width: 60, marginBottom: 6 }} />
        <div className="skeleton skeleton-text" style={{ width: 120 }} />
      </div>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { session, profile } = useAuth();
  const profileId = profile?.id;

  const {
    data: studentProfile,
    isLoading: stuLoading,
    error: stuError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['my-student-profile'],
    queryFn: getMyStudentProfile,
    enabled: !!session,
  });

  const batchId = studentProfile?.batch_id;
  const studentId = studentProfile?.id;
  const departmentId = studentProfile?.batches?.departments?.id;

  const { data: stats = {}, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['student-dashboard-stats', studentId, batchId, profileId],
    queryFn: () => getStudentDashboardStats(studentId, batchId, profileId),
    enabled: !!studentId && !!batchId && !!profileId,
  });

  const { data: announcements = [], isLoading: annLoading } = useQuery({
    queryKey: ['my-announcements', batchId, departmentId],
    queryFn: () => getMyAnnouncements(batchId, departmentId),
    enabled: !!batchId,
  });

  const { data: notifications = [], isLoading: notifsLoading } = useQuery({
    queryKey: ['student-notifications', profileId],
    queryFn: () => getStudentNotifications(profileId, { limit: 5 }),
    enabled: !!profileId,
  });

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  if (stuLoading) {
    return (
      <AppLayout pageTitle="Student Dashboard">
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">My Dashboard</h1>
            <p className="page-subtitle">Loading your profile…</p>
          </div>
        </div>
        <div className="stats-grid">{[1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)}</div>
      </AppLayout>
    );
  }

  if (stuError) {
    return (
      <AppLayout pageTitle="Student Dashboard">
        <div className="empty-state">
          <div className="empty-state-icon"><MdWarning /></div>
          <div className="empty-state-title">Profile Not Linked</div>
          <p className="empty-state-text">Your account is not yet linked to a student profile. Please contact the Front Desk or administrator.</p>
        </div>
      </AppLayout>
    );
  }

  const firstName = studentProfile?.first_name || 'Student';
  const dept = studentProfile?.batches?.departments?.name || '';
  const batchName = studentProfile?.batches?.name || '';

  const lowAttendance = stats.attendancePct !== null && stats.attendancePct < 75;

  return (
    <AppLayout pageTitle="Student Dashboard">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Welcome, {firstName}</h1>
          <p className="page-subtitle">{formattedDate}</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => { refetchProfile(); refetchStats(); }}
            aria-label="Refresh"
          >
            <MdRefresh /> Refresh
          </button>
        </div>
      </div>

      {/* Student ID Card */}
      <div
        style={{
          background: 'var(--color-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.125rem', marginTop: 2 }}>
            {studentProfile?.first_name} {studentProfile?.middle_name ? `${studentProfile.middle_name} ` : ''}{studentProfile?.last_name}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', marginTop: 4 }}>
            {studentProfile?.matricule}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem' }}>{dept}</div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', marginTop: 2 }}>{batchName}</div>
          {studentProfile?.batches?.academic_years?.name && (
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', marginTop: 2 }}>
              {studentProfile.batches.academic_years.name}
            </div>
          )}
        </div>
      </div>

      {/* Low attendance warning */}
      {lowAttendance && (
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
          Your overall attendance is below 75% ({stats.attendancePct}%). Please attend more classes.
          <Link to="/student/attendance" style={{ marginLeft: 'auto', color: 'var(--color-secondary)', fontWeight: 700, fontSize: '0.8125rem' }}>
            View →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        {statsLoading ? (
          [1, 2, 3, 4, 5].map((i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={<MdBook />} value={stats.totalCourses} label="My Courses" color="blue" link="/student/courses" />
            <StatCard icon={<MdHowToReg />} value={stats.attendancePct !== null ? stats.attendancePct : '—'} label="Attendance Rate" color={lowAttendance ? 'red' : 'green'} link="/student/attendance" suffix="%" />
            <StatCard icon={<MdAssignment />} value={stats.publishedResults} label="Published Results" color="blue" link="/student/results" />
            <StatCard icon={<MdTrendingUp />} value={stats.gpa !== null ? stats.gpa : '—'} label="Current GPA" color="amber" link="/student/results" />
            <StatCard icon={<MdNotifications />} value={stats.unreadNotifications} label="Unread Notifications" color={stats.unreadNotifications > 0 ? 'red' : 'blue'} />
          </>
        )}
      </div>

      {/* Announcements & Notifications grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Announcements */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MdCampaign color="var(--color-secondary)" /> Announcements
            </span>
            <Link to="/student/announcements" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {annLoading ? (
              <div style={{ padding: '1rem' }}>
                {[1, 2].map((i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 4 }} />
                    <div className="skeleton skeleton-text" style={{ width: '55%' }} />
                  </div>
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon"><MdCampaign /></div>
                <div className="empty-state-title">No announcements</div>
              </div>
            ) : (
              announcements.slice(0, 5).map((ann) => (
                <div
                  key={ann.id}
                  style={{
                    padding: '0.875rem 1.25rem',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text)' }}>{ann.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {ann.body}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {fmtDate(ann.published_at || ann.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MdNotifications color="var(--color-primary)" /> Notifications
            </span>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifsLoading ? (
              <div style={{ padding: '1rem' }}>
                {[1, 2].map((i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div className="skeleton skeleton-text" style={{ width: '75%', marginBottom: 4 }} />
                    <div className="skeleton skeleton-text" style={{ width: '50%' }} />
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon"><MdNotifications /></div>
                <div className="empty-state-title">No notifications</div>
                <p className="empty-state-text">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '0.875rem 1.25rem',
                    borderBottom: '1px solid var(--color-border)',
                    background: n.is_read ? 'transparent' : 'rgba(17,47,66,0.03)',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                  }}
                >
                  {!n.is_read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-secondary)', flexShrink: 0, marginTop: 5 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: '0.875rem' }}>{n.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{n.message}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                      {fmtDate(n.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
