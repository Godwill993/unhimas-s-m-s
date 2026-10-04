import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  MdHowToReg,
  MdAdd,
  MdCheckCircle,
  MdCancel,
  MdSchedule,
  MdPeopleAlt,
} from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import {
  getMyLecturerProfile,
  getMyCourses,
  getSessionsForBatchCourse,
  createClassSession,
  getAttendanceForSession,
  getStudentsInBatch,
  upsertAttendance,
  markAllPresent,
} from '../../services/lecturerService';

const STATUS_OPTS = ['present', 'absent', 'late', 'excused'];

const STATUS_STYLE = {
  present: { cls: 'badge-green', label: 'Present' },
  absent: { cls: 'badge-red', label: 'Absent' },
  late: { cls: 'badge-amber', label: 'Late' },
  excused: { cls: 'badge-gray', label: 'Excused' },
};

function fmtDT(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function LecturerSessionsPage() {
  const { session, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const initialBc = searchParams.get('bc') || '';
  const qc = useQueryClient();
  const { showToast } = useToast();

  const [selectedBcId, setSelectedBcId] = useState(initialBc);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [newSessionModal, setNewSessionModal] = useState(false);
  const [newSessionForm, setNewSessionForm] = useState({
    scheduled_start: '', scheduled_end: '', room: '', topic: '', notes: '',
  });
  const [localAttendance, setLocalAttendance] = useState({});
  const [markingAll, setMarkingAll] = useState(false);

  const { data: lecturerProfile } = useQuery({
    queryKey: ['my-lecturer-profile'],
    queryFn: getMyLecturerProfile,
    enabled: !!session,
  });
  const lecturerId = lecturerProfile?.id;

  const { data: courses = [] } = useQuery({
    queryKey: ['my-courses', lecturerId],
    queryFn: () => getMyCourses(lecturerId),
    enabled: !!lecturerId,
  });

  const selectedCourse = courses.find((c) => c.id === selectedBcId);

  const { data: sessions = [], isLoading: sessLoading, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions-for-bc', selectedBcId],
    queryFn: () => getSessionsForBatchCourse(selectedBcId),
    enabled: !!selectedBcId,
  });

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  const { data: students = [] } = useQuery({
    queryKey: ['students-in-batch', selectedCourse?.batches?.id],
    queryFn: () => getStudentsInBatch(selectedCourse.batches.id),
    enabled: !!selectedCourse?.batches?.id,
  });

  const { data: attendance = [], isLoading: attLoading, refetch: refetchAtt } = useQuery({
    queryKey: ['attendance-session', selectedSessionId],
    queryFn: () => getAttendanceForSession(selectedSessionId),
    enabled: !!selectedSessionId,
    onSuccess: (data) => {
      const init = {};
      data.forEach((r) => { init[r.student_id] = r.status; });
      setLocalAttendance(init);
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: () => createClassSession({
      batch_course_id: selectedBcId,
      lecturer_id: lecturerId,
      ...newSessionForm,
    }),
    onSuccess: () => {
      showToast('Session created', 'success');
      setNewSessionModal(false);
      setNewSessionForm({ scheduled_start: '', scheduled_end: '', room: '', topic: '', notes: '' });
      refetchSessions();
    },
    onError: (err) => showToast(err.message || 'Failed to create session', 'error'),
  });

  const markAllPresentFn = async () => {
    if (!selectedSessionId || students.length === 0) return;
    setMarkingAll(true);
    try {
      await markAllPresent(selectedSessionId, students.map((s) => s.id), profile?.id);
      const newAtt = {};
      students.forEach((s) => { newAtt[s.id] = 'present'; });
      setLocalAttendance(newAtt);
      showToast('All students marked present', 'success');
      refetchAtt();
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  const saveAttendance = async (studentId, status) => {
    if (!selectedSessionId) return;
    setLocalAttendance((prev) => ({ ...prev, [studentId]: status }));
    try {
      await upsertAttendance({ session_id: selectedSessionId, student_id: studentId, status, marked_by: profile?.id });
    } catch (err) {
      showToast('Failed to save: ' + (err.message || ''), 'error');
    }
  };

  // Summary
  const totalStu = students.length;
  const present = Object.values(localAttendance).filter((s) => s === 'present').length;
  const absent = Object.values(localAttendance).filter((s) => s === 'absent').length;
  const late = Object.values(localAttendance).filter((s) => s === 'late').length;
  const pct = totalStu > 0 ? Math.round(((present + late) / totalStu) * 100) : 0;

  return (
    <AppLayout pageTitle="Class Sessions">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Class Sessions &amp; Attendance</h1>
          <p className="page-subtitle">Manage sessions and mark student attendance</p>
        </div>
      </div>

      {/* Course selector */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <label className="form-label" htmlFor="sess-bc-select">Select Course</label>
        <select
          id="sess-bc-select"
          className="form-input"
          style={{ maxWidth: 420 }}
          value={selectedBcId}
          onChange={(e) => { setSelectedBcId(e.target.value); setSelectedSessionId(null); }}
        >
          <option value="">— Select a course —</option>
          {courses.map((bc) => (
            <option key={bc.id} value={bc.id}>
              {bc.courses?.code} — {bc.courses?.name} ({bc.batches?.name}, Sem {bc.semesters?.number})
            </option>
          ))}
        </select>
      </div>

      {selectedBcId && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.25rem' }}>
          {/* Sessions list */}
          <div className="card" style={{ alignSelf: 'start' }}>
            <div className="card-header">
              <span className="card-title">Sessions</span>
              <button className="btn btn-primary btn-sm" onClick={() => setNewSessionModal(true)}>
                <MdAdd /> New
              </button>
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {sessLoading ? (
                <div style={{ padding: '1rem' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton skeleton-text" style={{ marginBottom: 10, height: 48 }} />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.5rem' }}>
                  <div className="empty-state-title" style={{ fontSize: '0.875rem' }}>No sessions yet</div>
                  <p className="empty-state-text">Create a session to start marking attendance.</p>
                </div>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--color-border)',
                      background: s.id === selectedSessionId ? 'rgba(17,47,66,0.06)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderLeft: s.id === selectedSessionId ? '3px solid var(--color-primary)' : '3px solid transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                      {new Date(s.scheduled_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {new Date(s.scheduled_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(s.scheduled_end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {s.topic && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.topic}</div>}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Attendance panel */}
          <div>
            {!selectedSessionId ? (
              <div className="card">
                <div className="empty-state" style={{ padding: '3rem' }}>
                  <div className="empty-state-icon"><MdHowToReg /></div>
                  <div className="empty-state-title">Select a session</div>
                  <p className="empty-state-text">Select a session from the left to mark attendance.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Summary row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                  }}
                >
                  {[
                    { label: 'Total', value: totalStu, color: 'var(--color-primary)' },
                    { label: 'Present', value: present, color: '#059669' },
                    { label: 'Absent', value: absent, color: 'var(--color-secondary)' },
                    { label: 'Attendance', value: `${pct}%`, color: pct >= 75 ? '#059669' : '#b45309' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.875rem 1rem',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{item.label}</div>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">
                      <MdPeopleAlt style={{ verticalAlign: 'middle', marginRight: 6 }} />
                      {selectedSession && fmtDT(selectedSession.scheduled_start)}
                    </span>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={markAllPresentFn}
                      disabled={markingAll || students.length === 0}
                    >
                      <MdCheckCircle /> {markingAll ? 'Marking…' : 'Mark All Present'}
                    </button>
                  </div>
                  <div className="table-wrapper">
                    {attLoading ? (
                      <div style={{ padding: '1rem' }}>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="skeleton skeleton-text" style={{ marginBottom: 10 }} />
                        ))}
                      </div>
                    ) : students.length === 0 ? (
                      <div className="empty-state"><div className="empty-state-title">No students in batch</div></div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Matricule</th>
                            <th>Name</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((stu) => {
                            const status = localAttendance[stu.id] || 'absent';
                            return (
                              <tr key={stu.id}>
                                <td><span className="badge badge-blue">{stu.matricule}</span></td>
                                <td style={{ fontWeight: 600 }}>{stu.first_name} {stu.last_name}</td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                    {STATUS_OPTS.map((opt) => (
                                      <button
                                        key={opt}
                                        className={`btn btn-sm ${status === opt ? (opt === 'present' ? 'btn-primary' : opt === 'absent' ? 'btn-danger' : 'btn-outline') : 'btn-outline'}`}
                                        style={{
                                          padding: '0.25rem 0.625rem',
                                          fontSize: '0.75rem',
                                          opacity: status === opt ? 1 : 0.6,
                                        }}
                                        onClick={() => saveAttendance(stu.id, opt)}
                                        aria-pressed={status === opt}
                                      >
                                        {STATUS_STYLE[opt].label}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!selectedBcId && (
        <div className="empty-state">
          <div className="empty-state-icon"><MdSchedule /></div>
          <div className="empty-state-title">Select a course to manage sessions</div>
        </div>
      )}

      {/* New Session Modal */}
      {newSessionModal && (
        <Modal title="Create Class Session" onClose={() => setNewSessionModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={newSessionForm.scheduled_start}
                onChange={(e) => setNewSessionForm((f) => ({ ...f, scheduled_start: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={newSessionForm.scheduled_end}
                onChange={(e) => setNewSessionForm((f) => ({ ...f, scheduled_end: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Room</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Room 101"
                value={newSessionForm.room}
                onChange={(e) => setNewSessionForm((f) => ({ ...f, room: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Topic</label>
              <input
                type="text"
                className="form-input"
                placeholder="Session topic (optional)"
                value={newSessionForm.topic}
                onChange={(e) => setNewSessionForm((f) => ({ ...f, topic: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-input"
                rows={2}
                value={newSessionForm.notes}
                onChange={(e) => setNewSessionForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="modal-footer" style={{ padding: 0 }}>
              <button className="btn btn-outline" onClick={() => setNewSessionModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => createSessionMutation.mutate()}
                disabled={createSessionMutation.isPending || !newSessionForm.scheduled_start || !newSessionForm.scheduled_end}
              >
                <MdAdd /> {createSessionMutation.isPending ? 'Creating…' : 'Create Session'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
