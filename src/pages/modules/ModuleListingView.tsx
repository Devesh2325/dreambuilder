import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { storage } from '../../services/storage';
import { Project } from '../../types/modules';
import { ExperienceType } from '../../types/document';
import { 
  Plus, 
  Search, 
  Eye, 
  Sparkles, 
  Copy, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
  FileCode
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

  const filtered = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans select-none">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accentColor} text-white shadow-md`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create {title.split(' ')[0]}</span>
          </button>
        </div>
      </div>

      {/* Specialized Metrics Cards */}
      {specializedMetrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {specializedMetrics.map((m, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
              <span className="text-xs font-semibold text-slate-400 block mb-1">{m.label}</span>
              <div className="text-2xl font-black text-slate-800">{m.value}</div>
              {m.change && (
                <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {m.change}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Extra Config Preview Widget (e.g. Selector testing, NPS breakdown) */}
      {extraConfigPreview}

      {/* Projects List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Active {title} Experiences</h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Icon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold mb-3">No {title.toLowerCase()} created yet.</p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
              >
                Create One Now →
              </button>
            </div>
          ) : (
            filtered.map((proj) => (
              <div
                key={proj.id}
                onClick={() => navigate(`/editor/${proj.documentId}`)}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {proj.title}
                      </h4>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        proj.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {proj.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {proj.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-bold text-slate-700 block">
                      {(proj.viewsCount || 0).toLocaleString()} views
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {proj.completionRate || 0}% completion
                    </span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => navigate(`/preview/${proj.documentId}`)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Live Preview"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDuplicate(proj, e)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(proj.id, e)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      <CreateExperienceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultType={moduleType}
      />
    </div>
  );
};
