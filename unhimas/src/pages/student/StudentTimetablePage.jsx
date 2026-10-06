import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MdCalendarToday, MdLocationOn, MdPerson, MdWarning } from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { getMyStudentProfile, getMyTimetable } from '../../services/studentService';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(value) {
  if (!value) return '';
  return new Date(`2000-01-01T${value}`).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StudentTimetablePage() {
  const { session } = useAuth();
  const [view, setView] = useState('week');
  const today = new Date();
  const todayIndex = today.getDay();

  const { data: studentProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-student-profile'],
    queryFn: getMyStudentProfile,
    enabled: !!session,
  });

  const batchId = studentProfile?.batch_id;
  const { data: slots = [], isLoading, error } = useQuery({
    queryKey: ['my-timetable', batchId],
    queryFn: () => getMyTimetable(batchId),
    enabled: !!batchId,
  });

  const grouped = useMemo(() => {
    return WEEKDAYS.map((day, dayIndex) => ({
      day,
      dayIndex,
      items: slots.filter((slot) => Number(slot.day_of_week) === dayIndex),
    }));
  }, [slots]);

  return (
    <AppLayout pageTitle="My Timetable">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">My Timetable</h1>
          <p className="page-subtitle">Your batch classes and scheduled lecture rooms</p>
        </div>
        <div className="page-header-actions" aria-label="Timetable view">
          {['week', 'day'].map((option) => (
            <button
              key={option}
              className={`btn btn-sm ${view === option ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setView(option)}
              aria-pressed={view === option}
            >
              {option === 'week' ? 'Week' : 'Day'}
            </button>
          ))}
        </div>
      </div>

      {profileLoading || isLoading ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="card" style={{ padding: '1.25rem' }}>
              <div className="skeleton skeleton-title" style={{ width: '35%', marginBottom: 8 }} />
              <div className="skeleton skeleton-text" style={{ width: '70%' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state" role="alert">
          <div className="empty-state-icon"><MdWarning /></div>
          <div className="empty-state-title">Timetable unavailable</div>
          <p className="empty-state-text">Your timetable could not be loaded. Please try again later.</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><MdCalendarToday /></div>
          <div className="empty-state-title">No classes scheduled</div>
          <p className="empty-state-text">Your batch does not currently have scheduled timetable slots.</p>
        </div>
      ) : view === 'day' ? (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>{WEEKDAYS[todayIndex]}</div>
          {grouped.find((day) => day.dayIndex === todayIndex)?.items.length === 0 ? (
            <p className="empty-state-text">No classes are scheduled for {WEEKDAYS[todayIndex]}.</p>
          ) : (
            grouped.find((day) => day.dayIndex === todayIndex)?.items.map((slot) => (
              <div key={slot.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <strong>{formatTime(slot.start_time)}–{formatTime(slot.end_time)}</strong>
                <div>
                  <div>{slot.batch_course?.courses?.code} — {slot.batch_course?.courses?.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginTop: 4 }}>
                    <span><MdPerson size={14} /> {slot.batch_course?.lecturers?.first_name} {slot.batch_course?.lecturers?.last_name}</span>
                    <span><MdLocationOn size={14} /> {slot.room || 'Location not set'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {grouped.filter((day) => day.items.length > 0).map((day) => (
            <section key={day.dayIndex} className="card" style={{ overflow: 'hidden' }}>
              <div className="card-header" style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: 0 }}>
                <span style={{ fontWeight: 700 }}>{day.day}</span>
              </div>
              <div style={{ padding: '0.5rem 1.25rem' }}>
                {day.items.map((slot) => (
                  <div key={slot.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: '1rem', alignItems: 'center', padding: '0.9rem 0', borderBottom: '1px solid var(--color-border)' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{formatTime(slot.start_time)}–{formatTime(slot.end_time)}</strong>
                    <div>
                      <div style={{ fontWeight: 600 }}>{slot.batch_course?.courses?.code} — {slot.batch_course?.courses?.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 3 }}>
                        {slot.batch_course?.lecturers?.first_name} {slot.batch_course?.lecturers?.last_name}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                      {slot.room || 'Location not set'}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
