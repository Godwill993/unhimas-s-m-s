import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { FolderDown, Plus, Trash2, FileText, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const LecturerResources: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    title: '',
    category: 'Lecture Notes',
    file_path: '',
    course_id: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rRes, aRes] = await Promise.all([
        api.get('/lecturer/resources'),
        api.get('/lecturer/my-courses'),
      ]);
      setResources(rRes.data.resources || []);
      setAssignments(aRes.data.assignments || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load course resources');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course_id) {
      toast.error('Please select an assigned course');
      return;
    }

    try {
      const assignment = assignments.find((a) => a.course_id === form.course_id);
      await api.post('/lecturer/resources', {
        ...form,
        session_id: assignment?.session_id,
        program_id: assignment?.courses?.program_id,
      });

      toast.success('Course material uploaded successfully!');
      setIsUploadOpen(false);
      setForm({ title: '', category: 'Lecture Notes', file_path: '', course_id: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to upload resource');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/lecturer/resources/${id}`);
      toast.success('Resource deleted');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to delete resource');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Course Handouts & Past Papers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload syllabi, past examination questions, and lecture slides for your assigned university courses.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Upload New Resource
        </Button>
      </div>

      {/* Resources Grid */}
      {resources.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <FolderDown className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No course resources uploaded yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Share past papers and lecture materials with students enrolled in your courses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                    {r.category}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-400">
                    {r.courses?.code}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                  {r.title}
                </h4>

                <p className="text-xs text-slate-500 truncate">
                  Course: {r.courses?.name}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <a
                  href={r.file_path}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Material</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>

                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Upload Course Handout / Past Paper
              </h3>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Target Course
                </label>
                <select
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                >
                  <option value="">Select one of your assigned courses</option>
                  {assignments.map((a) => (
                    <option key={a.course_id} value={a.course_id}>
                      {a.courses?.code} - {a.courses?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Resource Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2024 Past Questions Paper 1"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="Lecture Notes">Lecture Notes / Slides</option>
                  <option value="Past Paper">Past Examination Paper</option>
                  <option value="Handbook">Course Syllabus / Handbook</option>
                  <option value="Assignment">Practical / Assignment Guide</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Document URL / Storage File Path
                </label>
                <input
                  type="url"
                  placeholder="https://... or Supabase Storage URL"
                  value={form.file_path}
                  onChange={(e) => setForm({ ...form, file_path: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setIsUploadOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Publish Resource
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
