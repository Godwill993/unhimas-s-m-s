import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import AppLayout from '../../components/layout/AppLayout';
import { toast } from '../../components/common/Toast';
import { MdAccountCircle, MdSave } from 'react-icons/md';

export default function AdminProfilePage() {
  const { session, profile, refetchProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('Profile details updated');
      if (refetchProfile) refetchProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout pageTitle="Profile">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Administrator Profile</h1>
          <p className="page-subtitle">Your credentials, identity, and security preferences</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div className="card-header">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MdAccountCircle style={{ fontSize: '1.25rem' }} /> Account Details
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Email Address (Supabase Auth)</label>
              <input
                type="text"
                className="form-input"
                value={session?.user?.email || 'admin@unhimas.edu'}
                disabled
                style={{ opacity: 0.7 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">System Role</label>
              <input
                type="text"
                className="form-input"
                value={profile?.role?.toUpperCase() || 'ADMINISTRATOR'}
                disabled
                style={{ opacity: 0.7 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+237 6..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <MdSave /> {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
