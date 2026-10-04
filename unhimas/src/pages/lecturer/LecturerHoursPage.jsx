import { useQuery } from '@tanstack/react-query';
import { MdAccessTime } from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getMyLecturerProfile, getMyShifts } from '../../services/lecturerService';

function fmtDT(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function calcDuration(clockIn, clockOut) {
  if (!clockIn || !clockOut) return '—';
  const hrs = (new Date(clockOut) - new Date(clockIn)) / 3600000;
  const h = Math.floor(hrs);
  const m = Math.round((hrs - h) * 60);
  return `${h}h ${m}m`;
}

export default function LecturerHoursPage() {
  const { session } = useAuth();

  const { data: lecturerProfile } = useQuery({
    queryKey: ['my-lecturer-profile'],
    queryFn: getMyLecturerProfile,
    enabled: !!session,
  });
  const lecturerId = lecturerProfile?.id;

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['my-shifts', lecturerId],
    queryFn: () => getMyShifts(lecturerId, { limit: 100 }),
    enabled: !!lecturerId,
  });

  // Monthly summary
  const monthlySummary = {};
  shifts.forEach((s) => {
    if (s.status !== 'closed' || !s.clock_out) return;
    const month = new Date(s.clock_in).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const hrs = (new Date(s.clock_out) - new Date(s.clock_in)) / 3600000;
    if (!monthlySummary[month]) monthlySummary[month] = 0;
    monthlySummary[month] += hrs;
  });

  const totalHours = Object.values(monthlySummary).reduce((a, b) => a + b, 0);

  return (
    <AppLayout pageTitle="My Hours">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">My Teaching Hours</h1>
          <p className="page-subtitle">Your recorded campus hours</p>
        </div>
        <div className="page-header-actions">
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--color-primary)',
            }}
          >
            Total: {totalHours.toFixed(1)}h
          </div>
        </div>
      </div>

      {/* Monthly summary cards */}
      {Object.keys(monthlySummary).length > 0 && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {Object.entries(monthlySummary).map(([month, hrs]) => (
            <div key={month} className="stat-card">
              <div className="stat-card-icon blue"><MdAccessTime /></div>
              <div className="stat-card-body">
                <div className="stat-card-value">{hrs.toFixed(1)}h</div>
                <div className="stat-card-label">{month}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full shift history */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Shift History</span>
        </div>
        {isLoading ? (
          <div style={{ padding: '1.5rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: 4 }} />
                <div className="skeleton skeleton-text" style={{ width: '40%' }} />
              </div>
            ))}
          </div>
        ) : shifts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><MdAccessTime /></div>
            <div className="empty-state-title">No shifts recorded</div>
            <p className="empty-state-text">Your campus clock-in history will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => (
                  <tr key={s.id}>
                    <td>{new Date(s.clock_in).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{new Date(s.clock_in).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{s.clock_out ? new Date(s.clock_out).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : <span className="badge badge-green">Active</span>}</td>
                    <td>{calcDuration(s.clock_in, s.clock_out)}</td>
                    <td>
                      {s.status === 'open' && <span className="badge badge-green">Clocked In</span>}
                      {s.status === 'closed' && <span className="badge badge-gray">Completed</span>}
                      {s.status === 'corrected' && <span className="badge badge-amber">Corrected</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
