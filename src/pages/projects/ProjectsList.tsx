import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { storage } from '../../services/storage';
import { Project } from '../../types/modules';
import { 
  Plus, 
  Search, 
  ExternalLink, 
  Copy, 
  Trash2, 
  FolderKanban, 
  Filter, 
  Sparkles,
  Compass,
  PlaySquare,
  Globe,
  Megaphone,
  CheckSquare,
  Star
} from 'lucide-react';

export const ProjectsList: React.FC = () => {
  const navigate = useNavigate();
  const { openCreateModal } = useOutletContext<{ openCreateModal: () => void }>() || {};

  const [projects, setProjects] = useState<Project[]>(() => storage.getProjects());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

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

  const filtered = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">All Experience Projects</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your interactive tours, simulated demos, landing pages, banners, and widgets.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Experience</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
          >
            <option value="all">All Types</option>
            <option value="tour">Tours</option>
            <option value="demo">Demos</option>
            <option value="page">Pages</option>
            <option value="banner">Banners</option>
            <option value="popup">Popups</option>
            <option value="checklist">Checklists</option>
            <option value="survey">Surveys</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filtered.map((proj) => (
          <div
            key={proj.id}
            onClick={() => navigate(`/editor/${proj.documentId}`)}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-all p-5 flex flex-col justify-between cursor-pointer group hover:border-indigo-300"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {proj.type}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  proj.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {proj.status}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                {proj.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
                {proj.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-medium">
                {(proj.viewsCount || 0).toLocaleString()} views
              </span>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => navigate(`/preview/${proj.documentId}`)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Live Preview"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDuplicate(proj, e)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(proj.id, e)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
