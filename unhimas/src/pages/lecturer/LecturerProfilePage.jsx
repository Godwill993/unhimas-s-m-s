import { useQuery } from '@tanstack/react-query';
import { MdAccountCircle, MdEmail, MdPhone } from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getMyLecturerProfile } from '../../services/lecturerService';

export default function LecturerProfilePage() {
  const { session, profile } = useAuth();

  const { data: lecturerProfile, isLoading } = useQuery({
    queryKey: ['my-lecturer-profile'],
    queryFn: getMyLecturerProfile,
    enabled: !!session,
  });

  return (
    <AppLayout pageTitle="Profile">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Your staff information</p>
        </div>
      </div>

      <div style={{ maxWidth: 640 }}>
        <div className="card">
          <div
            style={{
              background: 'var(--color-primary)',
              padding: '2rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <MdAccountCircle />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem' }}>
                {isLoading ? '—' : `${lecturerProfile?.first_name} ${lecturerProfile?.middle_name ? lecturerProfile.middle_name + ' ' : ''}${lecturerProfile?.last_name}`}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', marginTop: 2 }}>
                {lecturerProfile?.staff_id || profile?.login_id || '—'}
              </div>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', marginTop: 8 }}>
                Lecturer
              </span>
            </div>
          </div>

          <div className="card-body">
            {isLoading ? (
              <div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: 6 }} />
                    <div className="skeleton skeleton-text" style={{ width: '70%' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Staff ID</div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{lecturerProfile?.staff_id || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Department</div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{lecturerProfile?.departments?.name || '—'}</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Specialization</div>
                  <div style={{ fontSize: '0.9375rem' }}>{lecturerProfile?.specialization || '—'}</div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Email</div>
                  <div style={{ fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MdEmail color="var(--color-text-muted)" />
                    {lecturerProfile?.email || '—'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Phone</div>
                  <div style={{ fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MdPhone color="var(--color-text-muted)" />
                    {lecturerProfile?.phone || '—'}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Account Login</div>
                  <div style={{ fontSize: '0.9375rem' }}>{profile?.login_id || profile?.full_name || '—'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Status</div>
                  {lecturerProfile?.is_active
                    ? <span className="badge badge-green">Active</span>
                    : <span className="badge badge-red">Inactive</span>
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
