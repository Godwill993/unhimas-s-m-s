import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdPeople, MdSearch, MdToggleOn, MdToggleOff } from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import { toast } from '../../components/common/Toast';
import { getStaffProfiles, toggleProfileStatus } from '../../services/peopleService';

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['admin-staff-profiles', roleFilter],
    queryFn: () => getStaffProfiles({ role: roleFilter || null }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => toggleProfileStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-profiles'] });
      toast.success('Account status updated');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update user status');
    },
  });

  const filteredStaff = profiles.filter((p) => {
    const s = search.toLowerCase();
    return (
      (p.full_name && p.full_name.toLowerCase().includes(s)) ||
      (p.login_id && p.login_id.toLowerCase().includes(s)) ||
      (p.role && p.role.toLowerCase().includes(s))
    );
  });

  return (
    <AppLayout pageTitle="Front Desk & Staff">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Front Desk & System Staff</h1>
          <p className="page-subtitle">Manage administrative officers, front desk operators, and access roles</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
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
              placeholder="Search staff by name or login ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="form-input"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="frontdesk">Front Desk</option>
              <option value="lecturer">Lecturer</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Login ID / Username</th>
                <th>Assigned Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                    Loading staff profiles...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <MdPeople className="empty-state-icon" />
                      <div className="empty-state-title">No Profiles Found</div>
                      <div className="empty-state-text">
                        Staff and user profiles will appear here as they are authenticated.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((profile) => (
                  <tr key={profile.id}>
                    <td>
                      <strong>{profile.full_name}</strong>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                        {profile.login_id || '—'}
                      </code>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          profile.role === 'admin'
                            ? 'badge-red'
                            : profile.role === 'frontdesk'
                            ? 'badge-blue'
                            : profile.role === 'lecturer'
                            ? 'badge-purple'
                            : 'badge-gray'
                        }`}
                      >
                        {profile.role?.toUpperCase()}
                      </span>
                    </td>
                    <td>{profile.phone || '—'}</td>
                    <td>
                      <span className={`badge ${profile.is_active ? 'badge-green' : 'badge-gray'}`}>
                        {profile.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-icon"
                        title={profile.is_active ? 'Disable account' : 'Enable account'}
                        onClick={() => toggleMutation.mutate({ id: profile.id, is_active: !profile.is_active })}
                      >
                        {profile.is_active ? (
                          <MdToggleOn style={{ color: '#059669', fontSize: '1.25rem' }} />
                        ) : (
                          <MdToggleOff style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem' }} />
                        )}
                      </button>
                    </td>
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
