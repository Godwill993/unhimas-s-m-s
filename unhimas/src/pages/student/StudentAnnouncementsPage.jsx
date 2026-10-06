import { useQuery } from '@tanstack/react-query';
import { MdCampaign, MdWarning } from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getMyAnnouncements, getMyStudentProfile } from '../../services/studentService';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function StudentAnnouncementsPage() {
  const { session } = useAuth();

  const { data: studentProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-student-profile'],
    queryFn: getMyStudentProfile,
    enabled: !!session,
  });

  const batchId = studentProfile?.batch_id;
  const departmentId = studentProfile?.batches?.departments?.id;
  const { data: announcements = [], isLoading, error } = useQuery({
    queryKey: ['my-announcements', batchId, departmentId],
    queryFn: () => getMyAnnouncements(batchId, departmentId),
    enabled: !!batchId && !!departmentId,
  });

  return (
    <AppLayout pageTitle="Announcements">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Official updates for your academic community</p>
        </div>
      </div>

      {profileLoading || isLoading ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[1, 2, 3].map((item) => (
            <div key={item} className="card" style={{ padding: '1.25rem' }}>
              <div className="skeleton skeleton-title" style={{ width: '60%', marginBottom: 8 }} />
              <div className="skeleton skeleton-text" style={{ width: '85%', height: 18 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state" role="alert">
          <div className="empty-state-icon"><MdWarning /></div>
          <div className="empty-state-title">Announcements unavailable</div>
          <p className="empty-state-text">Announcements could not be loaded. Please try again later.</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><MdCampaign /></div>
          <div className="empty-state-title">No announcements</div>
          <p className="empty-state-text">There are no published announcements for your audience.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {announcements.map((announcement) => (
            <article key={announcement.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <span className="badge badge-blue">Published</span>
                  <h2 style={{ fontSize: '1.0625rem', margin: '0.75rem 0 0.5rem' }}>{announcement.title}</h2>
                </div>
                <time dateTime={announcement.published_at || announcement.created_at} style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  {formatDate(announcement.published_at || announcement.created_at)}
                </time>
              </div>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{announcement.body}</p>
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
