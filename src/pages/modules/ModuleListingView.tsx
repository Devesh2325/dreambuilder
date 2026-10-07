import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../services/storage';
import { Project } from '../../types/modules';
import { ExperienceType } from '../../types/document';
import { 
  Plus, 
  Search, 
  Play, 
  Copy, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Monitor,
  Tablet,
  Smartphone,
  Globe,
  Sliders,
  CheckCircle2,
  FileEdit,
  Sparkles
} from 'lucide-react';
import { CreateExperienceModal } from '../../components/modals/CreateExperienceModal';

interface Props {
  moduleType: ExperienceType;
  title: string;
  subtitle: string;
  icon: any;
  accentColor: string;
  specializedMetrics?: { label: string; value: string; change?: string }[];
  extraConfigPreview?: React.ReactNode;
}

export const ModuleListingView: React.FC<Props> = ({
  moduleType,
  title,
  subtitle,
  icon: Icon,
  accentColor,
  specializedMetrics = [],
  extraConfigPreview,
}) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(() => 
    storage.getProjects().filter(p => p.type === moduleType)
  );
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this experience?')) {
      storage.deleteProject(id);
      setProjects(storage.getProjects().filter(p => p.type === moduleType));
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
    setProjects(storage.getProjects().filter(p => p.type === moduleType));
  };

  const filtered = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans select-none pb-12 transition-colors">
      {/* Module Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accentColor} text-white shadow-md`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 hover:shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>Create New {title.split(' ')[0]}</span>
          </button>
        </div>
      </div>

      {/* Specialized Metrics Cards */}
      {specializedMetrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {specializedMetrics.map((m, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block mb-1">{m.label}</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{m.value}</div>
              {m.change && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {m.change}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Extra Config Preview Widget */}
      {extraConfigPreview}

      {/* Experiences Table / Card List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
        {/* Table Filters & Search Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mr-2">
              All {title} ({filtered.length})
            </h3>
            {/* Status Filter Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('published')}
                className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'published' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('draft')}
                className={`px-2.5 py-1 rounded-md transition-all ${statusFilter === 'draft' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Drafts
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white w-full sm:w-60"
            />
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-500">
              <Icon className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold mb-3">No matching {title.toLowerCase()} found.</p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
              >
                Create Experience Now
              </button>
            </div>
          ) : (
            filtered.map((proj) => {
              const isDesktop = proj.tags.includes('desktop') || !proj.tags.includes('mobile');
              const isTablet = proj.tags.includes('tablet');
              const isMobile = proj.tags.includes('mobile');

              return (
                <div
                  key={proj.id}
                  onClick={() => navigate(`/editor/${proj.documentId}`)}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                >
                  {/* Left: Icon, Title & Target Route */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {proj.title}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          proj.status === 'published' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {proj.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {proj.description || `Target route: /dashboard`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Badges, Metrics & Quick Actions */}
                  <div className="flex items-center gap-4 sm:gap-6 justify-between md:justify-end shrink-0">
                    {/* Device Badge */}
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
                      {isMobile ? <Smartphone className="w-3.5 h-3.5" /> : isTablet ? <Tablet className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                      <span className="capitalize">{isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</span>
                    </div>

                    {/* Stats */}
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                        {(proj.viewsCount || 0).toLocaleString()} views
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {proj.completionRate || 0}% completed
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* Play Preview Action */}
                      <button
                        type="button"
                        onClick={() => navigate(`/preview/${proj.documentId}`)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg font-bold text-xs transition-colors"
                        title="Run Interactive Preview"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden lg:inline">Play</span>
                      </button>

                      {/* Edit in Visual Editor */}
                      <button
                        type="button"
                        onClick={() => navigate(`/editor/${proj.documentId}`)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit in Visual Editor"
                      >
                        <FileEdit className="w-4 h-4" />
                      </button>

                      {/* Duplicate */}
                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(proj, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(proj.id, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <CreateExperienceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultType={moduleType}
      />
    </div>
  );
};
