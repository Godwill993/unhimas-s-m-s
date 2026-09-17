import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { UserProfile } from '../../types/index';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'discipline' | 'admin'>('teacher');
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/users', {
        full_name: fullName,
        email,
        password,
        role,
      });
      toast.success('Staff account created successfully!');
      setIsCreateOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (user: UserProfile) => {
    try {
      await api.patch(`/admin/users/${user.id}`, {
        active: !user.active,
      });
      toast.success(`Account ${!user.active ? 'activated' : 'deactivated'}`);
      loadUsers();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Staff User Accounts</h2>
          <p className="text-xs text-slate-400">Manage teachers and discipline staff access</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center space-x-2">
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Account</span>
        </Button>
      </div>

      <Card>
        <Table
          data={users}
          isLoading={loading}
          keyExtractor={(u) => u.id}
          columns={[
            { header: 'Full Name', accessor: (u) => <span className="font-semibold text-slate-100">{u.full_name}</span> },
            { header: 'Email', accessor: 'email' },
            {
              header: 'Role',
              accessor: (u) => (
                <Badge
                  variant={
                    u.role === 'admin' ? 'warning' : u.role === 'teacher' ? 'info' : 'success'
                  }
                >
                  {u.role.toUpperCase()}
                </Badge>
              ),
            },
            {
              header: 'Status',
              accessor: (u) => (
                <Badge variant={u.active ? 'success' : 'danger'}>
                  {u.active ? 'Active' : 'Disabled'}
                </Badge>
              ),
            },
            {
              header: 'Actions',
              accessor: (u) => (
                <Button
                  size="sm"
                  variant={u.active ? 'danger' : 'outline'}
                  onClick={() => toggleActive(u)}
                >
                  {u.active ? 'Deactivate' : 'Activate'}
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* Create User Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Staff Account">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Marie Ngu"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. marie@school.cm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            options={[
              { value: 'teacher', label: 'Teacher' },
              { value: 'discipline', label: 'Discipline Personnel' },
              { value: 'admin', label: 'Admin' },
            ]}
          />
          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="ghost" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
