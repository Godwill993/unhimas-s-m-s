import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdApartment, MdEdit, MdToggleOn, MdToggleOff, MdSearch } from 'react-icons/md';
import AppLayout from '../../components/layout/AppLayout';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
} from '../../services/academicService';

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    description: '',
  });

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: getDepartments,
  });

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      toast.success('Department created successfully');
      handleCloseModal();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create department');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateDepartment(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      toast.success('Department updated successfully');
      handleCloseModal();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update department');
    },
  });

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({ name: '', abbreviation: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      abbreviation: dept.abbreviation,
      description: dept.description || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.abbreviation.trim()) {
      toast.error('Name and abbreviation are required');
      return;
    }

    if (editingDept) {
      updateMutation.mutate({
        id: editingDept.id,
        updates: {
          name: formData.name.trim(),
          abbreviation: formData.abbreviation.trim().toUpperCase(),
          description: formData.description.trim() || null,
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name.trim(),
        abbreviation: formData.abbreviation.trim().toUpperCase(),
        description: formData.description.trim() || null,
      });
    }
  };

  const handleToggleStatus = (dept) => {
    updateMutation.mutate({
      id: dept.id,
      updates: { is_active: !dept.is_active },
    });
  };

  const filteredDepts = departments.filter((d) => {
    const s = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(s) ||
      d.abbreviation.toLowerCase().includes(s) ||
      (d.code && d.code.toLowerCase().includes(s))
    );
  });

  return (
    <AppLayout pageTitle="Departments">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage university academic faculties & departmental codes</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <MdAdd /> Add Department
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ position: 'relative', minWidth: '260px', flex: '1 1 200px' }}>
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
              placeholder="Search departments by name, code or abbreviation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Total: <strong>{departments.length}</strong> departments
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Abbreviation</th>
                <th>Code</th>
                <th>Batches</th>
                <th>Courses</th>
                <th>Faculty Lecturers</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                    Loading departments...
                  </td>
                </tr>
              ) : filteredDepts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="empty-state">
                      <MdApartment className="empty-state-icon" />
                      <div className="empty-state-title">No Departments Found</div>
                      <div className="empty-state-text">
                        Create your first academic department to begin building curricula.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDepts.map((dept) => (
                  <tr key={dept.id}>
                    <td>
                      <strong>{dept.name}</strong>
                      {dept.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {dept.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-blue">{dept.abbreviation}</span>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                        {dept.code || '—'}
                      </code>
                    </td>
                    <td>{dept.batches?.[0]?.count ?? 0}</td>
                    <td>{dept.courses?.[0]?.count ?? 0}</td>
                    <td>{dept.lecturers?.[0]?.count ?? 0}</td>
                    <td>
                      <span className={`badge ${dept.is_active ? 'badge-green' : 'badge-gray'}`}>
                        {dept.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                        <button
                          className="btn-icon"
                          title="Edit department"
                          onClick={() => handleOpenEdit(dept)}
                        >
                          <MdEdit />
                        </button>
                        <button
                          className="btn-icon"
                          title={dept.is_active ? 'Deactivate' : 'Activate'}
                          onClick={() => handleToggleStatus(dept)}
                        >
                          {dept.is_active ? <MdToggleOn style={{ color: '#059669', fontSize: '1.25rem' }} /> : <MdToggleOff style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem' }} />}
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

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingDept ? 'Edit Department' : 'Add New Department'}
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
              {editingDept ? 'Update Department' : 'Create Department'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Department Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Computer Engineering"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Abbreviation *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. CEN or SWE"
              value={formData.abbreviation}
              onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
              required
            />
            <div className="form-hint">
              Used in generated codes (e.g. UNH-CEN-...)
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-input"
              rows="3"
              placeholder="Brief summary of department focus..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
