import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../services/storage';
import { Template } from '../../types/modules';
import { 
  LayoutTemplate, 
  Search, 
  Sparkles, 
  ArrowRight, 
  Star, 
  Compass, 
  PlaySquare, 
  Globe, 
  Megaphone, 
  HelpCircle,
  AppWindow,
  CheckSquare
} from 'lucide-react';

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [templates] = useState<Template[]>(() => storage.getTemplates());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'tour', label: 'Product Tours' },
    { id: 'demo', label: 'Interactive Demos' },
    { id: 'page', label: 'Landing Pages' },
    { id: 'banner', label: 'Banners' },
    { id: 'popup', label: 'Popups & Modals' },
    { id: 'checklist', label: 'Checklists' },
    { id: 'faq', label: 'FAQs' },
    { id: 'survey', label: 'Surveys' },
  ];

  const handleUseTemplate = (tpl: Template) => {
    const { document } = storage.cloneTemplateToProject(tpl.id);
    navigate(`/editor/${document.id}`);
  };

  const filtered = templates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans select-none">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-sm mb-3 text-purple-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready-to-Deploy Blueprints</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Templates Marketplace</h1>
          <p className="text-sm text-purple-200 mt-1 max-w-xl">
            Choose from professionally designed onboarding tours, interactive demos, announcements, and responsive pages.
          </p>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === c.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-subtle hover:shadow-card transition-all flex flex-col group hover:border-indigo-300"
          >
            {/* Thumbnail */}
            <div className="h-44 bg-slate-100 relative overflow-hidden">
              <img
                src={tpl.thumbnail}
                alt={tpl.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                {tpl.category}
              </div>
              {tpl.isPopular && (
                <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Popular
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {tpl.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {tpl.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {tpl.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {tpl.stepsCount} {tpl.stepsCount === 1 ? 'block' : 'steps / sections'}
                </span>
                <button
                  type="button"
                  onClick={() => handleUseTemplate(tpl)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1"
                >
                  <span>Use Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
