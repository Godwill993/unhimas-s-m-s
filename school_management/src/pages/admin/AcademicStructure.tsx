import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Spinner } from '../../components/ui/Spinner';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Building2,
  Check,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AcademicStructure: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faculties' | 'departments' | 'programs' | 'courses' | 'sessions'>('faculties');
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [facRes, deptRes, progRes, courseRes, sessRes] = await Promise.all([
        api.get('/admin/faculties'),
        api.get('/admin/departments'),
        api.get('/admin/programs'),
        api.get('/admin/courses'),
        api.get('/admin/sessions'),
      ]);
      setFaculties(facRes.data.faculties || []);
      setDepartments(deptRes.data.departments || []);
      setPrograms(progRes.data.programs || []);
      setCourses(courseRes.data.courses || []);
      setSessions(sessRes.data.sessions || []);
    } catch (err) {
      console.error('Failed to load academic data:', err);
      toast.error('Failed to load academic structure data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'faculties') {
        await api.post('/admin/faculties', formData);
        toast.success('Faculty added successfully');
      } else if (activeTab === 'departments') {
        await api.post('/admin/departments', formData);
        toast.success('Department added successfully');
      } else if (activeTab === 'programs') {
        await api.post('/admin/programs', formData);
        toast.success('Program added successfully');
      } else if (activeTab === 'courses') {
        await api.post('/admin/courses', formData);
        toast.success('Course added successfully');
      } else if (activeTab === 'sessions') {
        await api.post('/admin/sessions', formData);
        toast.success('Academic session added successfully');
      }
      setIsCreateOpen(false);
      setFormData({});
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save item');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/${deleteTarget.type}/${deleteTarget.id}`);
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleActivateSession = async (sessionId: string) => {
    try {
      await api.put(`/admin/sessions/${sessionId}/activate`);
      toast.success('Academic session activated');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to activate session');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Academic Structure Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure faculties, departments, degree programs (HND, BTS, Bachelor's, Master's), courses, and academic sessions.
          </p>
        </div>

        <Button variant="primary" onClick={() => { setFormData({}); setIsCreateOpen(true); }}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add New {activeTab.slice(0, -1)}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto">
        {[
          { id: 'faculties', label: 'Faculties', count: faculties.length, icon: Building2 },
          { id: 'departments', label: 'Departments', count: departments.length, icon: Layers },
          { id: 'programs', label: 'Programs', count: programs.length, icon: BookOpen },
          { id: 'courses', label: 'Courses', count: courses.length, icon: BookOpen },
          { id: 'sessions', label: 'Academic Sessions', count: sessions.length, icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-bold border-b-2 transition-all duration-150 whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-100 dark:bg-slate-800 font-mono">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* FACULTIES TAB */}
        {activeTab === 'faculties' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Faculty Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {faculties.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{f.code}</td>
                    <td className="py-3.5 px-4 font-semibold">{f.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{f.description || '-'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteTarget({ type: 'faculties', id: f.id, name: f.name })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DEPARTMENTS TAB */}
        {activeTab === 'departments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{d.code}</td>
                    <td className="py-3.5 px-4 font-semibold">{d.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{d.faculties?.name || '-'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteTarget({ type: 'departments', id: d.id, name: d.name })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PROGRAMS TAB (HND, BTS, Bachelor's, Master's) */}
        {activeTab === 'programs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Program Name</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {programs.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{p.code}</td>
                    <td className="py-3.5 px-4 font-semibold">{p.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {p.level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{p.departments?.name || '-'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteTarget({ type: 'programs', id: p.id, name: p.name })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Course Code</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4 text-center">Credits</th>
                  <th className="py-3 px-4 text-center">Semester</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{c.code}</td>
                    <td className="py-3.5 px-4 font-semibold">{c.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{c.programs?.name || '-'}</td>
                    <td className="py-3.5 px-4 text-center font-bold">{c.credits}</td>
                    <td className="py-3.5 px-4 text-center">Sem {c.semester}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteTarget({ type: 'courses', id: c.id, name: c.name })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SESSIONS TAB */}
        {activeTab === 'sessions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Session Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">{s.name}</td>
                    <td className="py-3.5 px-4">
                      {s.is_active ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active Session</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Inactive</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!s.is_active && (
                        <Button variant="secondary" onClick={() => handleActivateSession(s.id)}>
                          Set as Active
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 capitalize">
              Add New {activeTab.slice(0, -1)}
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {activeTab === 'faculties' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Code</label>
                    <input
                      type="text"
                      placeholder="e.g. FST (Science & Tech)"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Faculty of Science and Technology"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Description</label>
                    <input
                      type="text"
                      placeholder="Optional description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </>
              )}

              {activeTab === 'departments' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Faculty</label>
                    <select
                      value={formData.faculty_id || ''}
                      onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    >
                      <option value="">Select Faculty</option>
                      {faculties.map((f) => (
                        <option key={f.id} value={f.id}>{f.code} - {f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CS"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Department of Computer Science"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>
                </>
              )}

              {activeTab === 'programs' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Department</label>
                    <select
                      value={formData.department_id || ''}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Level</label>
                    <select
                      value={formData.level || 'Bachelor\'s'}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    >
                      <option value="HND">HND (Higher National Diploma)</option>
                      <option value="BTS">BTS (Brevet de Technicien Supérieur)</option>
                      <option value="Bachelor's">Bachelor's Degree (BSc / BEng)</option>
                      <option value="Master's">Master's Degree (MSc)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Code</label>
                    <input
                      type="text"
                      placeholder="e.g. SWE (Software Engineering)"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Program Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineering"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>
                </>
              )}

              {activeTab === 'courses' && (
                <>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Program</label>
                    <select
                      value={formData.program_id || ''}
                      onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    >
                      <option value="">Select Program</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>{p.code} - {p.name} ({p.level})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Course Code</label>
                      <input
                        type="text"
                        placeholder="e.g. SWE301"
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Credits</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        placeholder="e.g. 4"
                        value={formData.credits || 3}
                        onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Course Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Distributed Systems & Cloud Architecture"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Semester</label>
                    <select
                      value={formData.semester || 1}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      required
                    >
                      <option value={1}>Semester 1</option>
                      <option value={2}>Semester 2</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'sessions' && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 uppercase">Session Name</label>
                  <input
                    type="text"
                    placeholder="e.g. 2025/2026"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save {activeTab.slice(0, -1)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.name}?`}
        message="This action will permanently delete this record and its associated children. Are you sure you want to proceed?"
        isDestructive={true}
        confirmText="Delete"
      />
    </div>
  );
};
