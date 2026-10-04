import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdBook, MdSearch, MdEdit, MdToggleOn, MdToggleOff } from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';
import {
  getCourses,
  createCourse,
  updateCourse,
  getDepartments,
} from '../../services/academicService';

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [formData, setFormData] = useState({
    department_id: '',
    code: '',
    name: '',
    credit_units: 3,
  });

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => getCourses(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: getDepartments,
  });

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Course created successfully');
      handleCloseModal();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create course');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateCourse(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Course updated successfully');
      handleCloseModal();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update course');
    },
  });

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormData({
      department_id: departments[0]?.id || '',
      code: '',
      name: '',
      credit_units: 3,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      department_id: course.department_id,
      code: course.code,
      name: course.name,
      credit_units: course.credit_units,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.department_id || !formData.code.trim() || !formData.name.trim()) {
      toast.error('All fields are required');
      return;
    }
    if (editingCourse) {
      updateMutation.mutate({
        id: editingCourse.id,
        updates: {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          credit_units: Number(formData.credit_units),
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleStatus = (course) => {
    updateMutation.mutate({
      id: course.id,
      updates: { is_active: !course.is_active },
    });
  };

  const filteredCourses = courses.filter((c) => {
    const s = search.toLowerCase();
    const matchSearch =
      c.code.toLowerCase().includes(s) ||
      c.name.toLowerCase().includes(s) ||
      (c.departments?.name && c.departments.name.toLowerCase().includes(s));

    const matchDept = deptFilter ? c.department_id === deptFilter : true;
    return matchSearch && matchDept;
  });

  return (
    <AppLayout pageTitle="Curriculum Courses">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Curriculum Courses</h1>
          <p className="page-subtitle">Configure university courses, credit weights, and departmental syllabi</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <MdAdd /> Add Course
          </button>
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
              placeholder="Search courses by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="form-input"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.abbreviation})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Department</th>
                <th>Credit Units</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                    Loading courses...
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <MdBook className="empty-state-icon" />
                      <div className="empty-state-title">No Courses Found</div>
                      <div className="empty-state-text">
                        Add courses to your academic department (e.g. SWE 101, CEN 205).
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <code style={{ fontSize: '0.85rem', background: 'var(--color-bg)', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {c.code}
                      </code>
                    </td>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>{c.departments?.name} ({c.departments?.abbreviation})</td>
                    <td>
                      <span className="badge badge-blue">{c.credit_units} Credits</span>
                    </td>
                    <td>
                      <span className={`badge ${c.is_active ? 'badge-green' : 'badge-gray'}`}>
                        {c.is_active ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                        <button
                          className="btn-icon"
                          title="Edit course"
                          onClick={() => handleOpenEdit(c)}
                        >
                          <MdEdit />
                        </button>
                        <button
                          className="btn-icon"
                          title={c.is_active ? 'Deactivate' : 'Activate'}
                          onClick={() => handleToggleStatus(c)}
                        >
                          {c.is_active ? <MdToggleOn style={{ color: '#059669', fontSize: '1.25rem' }} /> : <MdToggleOff style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem' }} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCourse ? 'Edit Course' : 'Add Curriculum Course'}
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingCourse ? 'Save Changes' : 'Create Course'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {!editingCourse && (
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-input"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                required
              >
                <option value="">Select department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.abbreviation})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Course Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. SWE 101"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Credit Units *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                className="form-input"
                value={formData.credit_units}
                onChange={(e) => setFormData({ ...formData, credit_units: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Course Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Introduction to Software Engineering"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
