import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { storage } from '../../services/storage';
import { useAuth } from '../../services/authContext';
import { Project } from '../../types/modules';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  Eye, 
  CheckCircle, 
  Clock, 
  Compass, 
  BarChart2, 
  Sparkles, 
  FileText, 
  MoreVertical,
  Trash2,
  Copy,
  ExternalLink,
  Filter,
  Play
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const { openCreateModal } = useOutletContext<{ openCreateModal: () => void }>() || {};

  const [projects, setProjects] = useState<Project[]>(() => storage.getProjects());
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Dashboard Aggregates
  const totalCount = projects.length;
  const publishedCount = projects.filter(p => p.status === 'published').length;
  const draftCount = projects.filter(p => p.status === 'draft').length;
  const totalViews = projects.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  const avgCompletion = totalCount > 0 ? (projects.reduce((acc, p) => acc + (p.completionRate || 0), 0) / totalCount).toFixed(1) : '0';

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      storage.deleteProject(id);
      setProjects(storage.getProjects());
    }
  };

  const handleDuplicate = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = storage.getDocument(proj.documentId);
    if (!doc) return;

    const newDocId = `doc_${Date.now()}`;
    const newProjectId = `proj_${Date.now()}`;

    const clonedDoc = {
      ...JSON.parse(JSON.stringify(doc)),
      id: newDocId,
      projectId: newProjectId,
      title: `${proj.title} (Copy)`,
      isPublished: false,
      publishedVersionId: undefined,
    };
    storage.saveDocument(clonedDoc);

    storage.createProject({
      title: `${proj.title} (Copy)`,
      description: proj.description,
      type: proj.type,
      status: 'draft',
      tags: [...proj.tags, 'copy'],
      documentId: newDocId,
    });
    setProjects(storage.getProjects());
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans select-none pb-12 transition-colors">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-7 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-sm mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>FlowPilot Unified Experience Suite</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {user.fullName.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-indigo-200 mt-1 max-w-xl">
            Manage your product tours, in-app banners, checklists, and responsive landing pages from one shared visual engine.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-indigo-900 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Create Experience</span>
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-purple-500/20 to-transparent pointer-events-none" />
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mb-1">Total Experiences</span>
          <div className="text-2xl font-black text-slate-800 dark:text-white">{totalCount}</div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1 inline-block">Active workspace</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mb-1">Live Published</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{publishedCount}</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-block">Serving visitors</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mb-1">Draft Experiences</span>
          <div className="text-2xl font-black text-amber-500 dark:text-amber-400">{draftCount}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1 inline-block">In progress</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mb-1">Monthly Views</span>
          <div className="text-2xl font-black text-slate-800 dark:text-white">{totalViews.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-block">+14.2% vs last mo</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle col-span-2 md:col-span-1">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mb-1">Avg Completion Rate</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{avgCompletion}%</div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1 inline-block">Target: 45%+</span>
        </div>
      </div>

      {/* Projects List Header & Search Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Your Experiences</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Search, edit, preview, and track your interactive flows</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search experiences..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 w-56"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 font-medium"
            >
              <option value="all">All Formats</option>
              <option value="tour">Tours</option>
              <option value="demo">Demos</option>
              <option value="page">Pages</option>
              <option value="banner">Banners</option>
              <option value="popup">Popups</option>
              <option value="checklist">Checklists</option>
              <option value="survey">Surveys</option>
            </select>
          </div>
        </div>

        {/* Projects Table */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">
              <Compass className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">No experiences match your criteria.</p>
            </div>
          ) : (
            filteredProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => navigate(`/editor/${proj.documentId}`)}
                className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {proj.type.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {proj.title}
                      </h4>
                      <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded-full">
                        {proj.type}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        proj.status === 'published' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {proj.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {proj.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Stats */}
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                      {(proj.viewsCount || 0).toLocaleString()} views
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {proj.completionRate || 0}% completion
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => navigate(`/preview/${proj.documentId}`)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                      title="Live Preview"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDuplicate(proj, e)}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(proj.id, e)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
