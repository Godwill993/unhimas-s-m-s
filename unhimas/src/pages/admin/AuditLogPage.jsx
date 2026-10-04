import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MdHistory, MdSearch } from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/common/Modal';
import { getAuditLogs } from '../../services/operationsService';

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-audit-logs-full', actionFilter],
    queryFn: () => getAuditLogs({ limit: 100, action: actionFilter || null }),
  });

  const filteredLogs = logs.filter((log) => {
    const s = search.toLowerCase();
    const actorName = log.profiles?.full_name?.toLowerCase() || '';
    const table = log.table_name?.toLowerCase() || '';
    const action = log.action?.toLowerCase() || '';
    return actorName.includes(s) || table.includes(s) || action.includes(s);
  });

  return (
    <AppLayout pageTitle="Audit Log">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">System Audit Log</h1>
          <p className="page-subtitle">Immutable security audit trail capturing all database changes and actor identities</p>
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
              placeholder="Search by actor, table name, or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="form-input"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Target Table</th>
                <th>Record ID</th>
                <th style={{ textAlign: 'right' }}>Payload</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <MdHistory className="empty-state-icon" />
                      <div className="empty-state-title">No Audit Records Found</div>
                      <div className="empty-state-text">
                        Database modifications and administrative actions will automatically trigger audit logs.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td>
                      <strong>{log.profiles?.full_name || 'System / Trigger'}</strong>
                    </td>
                    <td>
                      <span className="badge badge-gray">{log.profiles?.role || 'SYSTEM'}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          log.action === 'INSERT'
                            ? 'badge-green'
                            : log.action === 'UPDATE'
                            ? 'badge-blue'
                            : 'badge-red'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <code>{log.table_name}</code>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.72rem' }}>{log.record_id ? String(log.record_id).slice(0, 8) + '...' : '—'}</code>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Diff Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={`Audit Record: ${selectedLog?.action} on ${selectedLog?.table_name}`}
        maxWidth="680px"
        footer={
          <button className="btn btn-primary" onClick={() => setSelectedLog(null)}>
            Close
          </button>
        }
      >
        <div style={{ fontSize: '0.8125rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <strong>Actor:</strong> {selectedLog?.profiles?.full_name || 'System'}
            </div>
            <div>
              <strong>Time:</strong> {selectedLog && new Date(selectedLog.created_at).toLocaleString()}
            </div>
            <div>
              <strong>Record ID:</strong> {selectedLog?.record_id}
            </div>
          </div>

          {selectedLog?.old_data && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '0.25rem' }}>
                Previous State (old_data):
              </div>
              <pre
                style={{
                  background: 'var(--color-bg)',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(selectedLog.old_data, null, 2)}
              </pre>
            </div>
          )}

          {selectedLog?.new_data && (
            <div>
              <div style={{ fontWeight: 600, color: '#059669', marginBottom: '0.25rem' }}>
                New State (new_data):
              </div>
              <pre
                style={{
                  background: 'var(--color-bg)',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(selectedLog.new_data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Modal>
    </AppLayout>
  );
}
