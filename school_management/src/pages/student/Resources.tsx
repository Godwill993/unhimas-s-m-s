import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner } from '../../components/ui/Spinner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { FolderDown, Download, Search, Filter, FileText, FileImage, FileVideo, File } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Resource } from '../../types';

const categoryIcons: Record<string, React.ElementType> = {
  'Past Paper': FileText,
  'Lecture Note': FileText,
  'Video': FileVideo,
  'Image': FileImage,
  'Other': File,
};

export const StudentResources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/student/resources');
        setResources(res.data.resources || []);
      } catch {
        toast.error('Failed to load resources');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const categories = Array.from(new Set(resources.map((r) => r.category)));

  const filtered = resources.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !search || r.title.toLowerCase().includes(q) || r.courses?.name?.toLowerCase().includes(q) || '';
    const matchCat = !filterCategory || r.category === filterCategory;
    return matchSearch && matchCat;
  });

  const handleDownload = async (resource: Resource) => {
    try {
      const res = await api.get(`/student/resources/${resource.id}/url`);
      window.open(res.data.url, '_blank');
    } catch {
      toast.error('Could not generate download link');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Past Papers & Resources</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Course materials and past examination papers</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search resources or course name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FolderDown className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">No resources available yet.</p>
            <p className="text-xs mt-1">Resources uploaded by your lecturers will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((resource) => {
              const Icon = categoryIcons[resource.category] || File;
              return (
                <div
                  key={resource.id}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {resource.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 mb-1">
                    {resource.title}
                  </h3>
                  {resource.courses && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      {resource.courses.code} · {resource.courses.name}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-400">Uploaded by</p>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {resource.user_profiles?.full_name || 'UNHIMAS Staff'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(resource)}
                      className="flex items-center space-x-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group-hover:underline transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                  {resource.created_at && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(resource.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
