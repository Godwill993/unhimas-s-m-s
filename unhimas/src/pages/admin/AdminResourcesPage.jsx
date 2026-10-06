import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MdDownload, MdFilePresent, MdFolder, MdWarning } from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import { getAdminResources, getAdminResourceDownload } from '../../services/adminService';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminResourcesPage() {
  const [courseFilter, setCourseFilter] = useState('all');

  const { data: resources = [], isLoading, error } = useQuery({
    queryKey: ['admin-resources'],
    queryFn: getAdminResources,
  });

  const courses = [...new Map(
    resources
      .filter((resource) => resource.courses?.id)
      .map((resource) => [resource.courses.id, resource.courses]),
  ).values()];

  const filteredResources = courseFilter === 'all'
    ? resources
    : resources.filter((resource) => resource.course_id === courseFilter);

  const downloadResource = async (resource) => {
    try {
      const { url, error } = await getAdminResourceDownload(resource.file_path);
      if (error) {
        window.alert('The resource could not be downloaded. Please try again later.');
        return;
      }
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      window.alert('The resource could not be downloaded. Please try again later.');
    }
  };

  return (
    <AppLayout pageTitle="Resources">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">University Resources</h1>
          <p className="page-subtitle">Secure institutional learning materials and documents</p>
        </div>
      </div>

      {courses.length > 0 && (
        <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
          <label className="form-label" htmlFor="admin-resource-course-filter">Filter by course</label>
          <select id="admin-resource-course-filter" className="form-input" value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
            <option value="all">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.code} — {course.name}</option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3].map((item) => (
            <div key={item} className="card" style={{ padding: '1.25rem' }}>
              <div className="skeleton skeleton-title" style={{ width: '70%', marginBottom: 8 }} />
              <div className="skeleton skeleton-text" style={{ width: '50%', marginBottom: 16 }} />
              <div className="skeleton skeleton-text" style={{ height: 36 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state" role="alert">
          <div className="empty-state-icon"><MdWarning /></div>
          <div className="empty-state-title">Resources unavailable</div>
          <p className="empty-state-text">The resource library could not be loaded. Please try again later.</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><MdFolder /></div>
          <div className="empty-state-title">No resources found</div>
          <p className="empty-state-text">No course materials have been uploaded yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {filteredResources.map((resource) => (
            <article key={resource.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', minHeight: 220 }}>
              <div className="card-title" style={{ marginBottom: 10 }}>
                <MdFilePresent color="var(--color-primary)" />
                {resource.courses?.code && <span style={{ marginLeft: 6 }}>{resource.courses.code}</span>}
              </div>
              <h2 style={{ fontSize: '1rem', margin: '0 0 0.5rem' }}>{resource.title}</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', lineHeight: 1.6, flex: 1 }}>{resource.description || 'No description provided.'}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatDate(resource.created_at)}</span>
                <button className="btn btn-primary btn-sm" onClick={() => downloadResource(resource)}>
                  <MdDownload /> Download
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
