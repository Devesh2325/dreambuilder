import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../services/storage';
import { ExperienceType } from '../../types/document';
import { 
  X, 
  Compass, 
  PlaySquare, 
  Globe, 
  Megaphone, 
  Menu as MenuIcon, 
  HelpCircle, 
  AppWindow, 
  CheckSquare, 
  Star,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  createTourDocument, 
  createDemoDocument, 
  createPageDocument, 
  createBannerDocument, 
  createMenuDocument, 
  createFaqDocument, 
  createPopupDocument, 
  createChecklistDocument, 
  createSurveyDocument 
} from '../../services/seedData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ExperienceType;
}

export const CreateExperienceModal: React.FC<Props> = ({ isOpen, onClose, defaultType = 'tour' }) => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<ExperienceType>(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const experienceTypes: { type: ExperienceType; title: string; desc: string; icon: any; color: string }[] = [
    { type: 'tour', title: 'Product Tour', desc: 'Guided walkthrough with element spotlighting', icon: Compass, color: 'text-indigo-600 bg-indigo-50' },
    { type: 'demo', title: 'Interactive Demo', desc: 'Simulated screens with clickable hotspots', icon: PlaySquare, color: 'text-purple-600 bg-purple-50' },
    { type: 'page', title: 'Landing Page', desc: 'Responsive marketing pages & sections', icon: Globe, color: 'text-blue-600 bg-blue-50' },
    { type: 'banner', title: 'In-App Banner', desc: 'Top or inline announcement notification', icon: Megaphone, color: 'text-amber-600 bg-amber-50' },
    { type: 'menu', title: 'Navigation Menu', desc: 'Header navigation with dropdown menus', icon: MenuIcon, color: 'text-cyan-600 bg-cyan-50' },
    { type: 'faq', title: 'FAQ & Help Center', desc: 'Searchable collapsible questions accordion', icon: HelpCircle, color: 'text-emerald-600 bg-emerald-50' },
    { type: 'popup', title: 'Popup & Modal', desc: 'Exit-intent or scroll-triggered modal window', icon: AppWindow, color: 'text-rose-600 bg-rose-50' },
    { type: 'checklist', title: 'Onboarding Checklist', desc: 'Gamified user onboarding task progress', icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50' },
    { type: 'survey', title: 'Feedback & NPS Survey', desc: 'Rating score widget & qualitative feedback', icon: Star, color: 'text-amber-600 bg-amber-50' },
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || `New ${selectedType.toUpperCase()} Experience`;
    const newProjectId = `proj_${Date.now()}`;
    const newDocId = `doc_${Date.now()}`;

    // Instantiate appropriate default document model
    let doc;
    switch (selectedType) {
      case 'tour': doc = createTourDocument(newDocId, newProjectId, finalTitle); break;
      case 'demo': doc = createDemoDocument(newDocId, newProjectId, finalTitle); break;
      case 'page': doc = createPageDocument(newDocId, newProjectId, finalTitle); break;
      case 'banner': doc = createBannerDocument(newDocId, newProjectId, finalTitle); break;
      case 'menu': doc = createMenuDocument(newDocId, newProjectId, finalTitle); break;
      case 'faq': doc = createFaqDocument(newDocId, newProjectId, finalTitle); break;
      case 'popup': doc = createPopupDocument(newDocId, newProjectId, finalTitle); break;
      case 'checklist': doc = createChecklistDocument(newDocId, newProjectId, finalTitle); break;
      case 'survey': doc = createSurveyDocument(newDocId, newProjectId, finalTitle); break;
      default: doc = createTourDocument(newDocId, newProjectId, finalTitle);
    }

    // Persist document and project
    storage.saveDocument(doc);
    const proj = storage.createProject({
      title: finalTitle,
      description: description.trim() || `Visual ${selectedType} experience built with FlowPilot.`,
      type: selectedType,
      status: 'draft',
      tags: [selectedType, 'custom'],
      documentId: newDocId,
    });

    onClose();
    navigate(`/editor/${newDocId}`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-800">Create New Experience</h3>
            <p className="text-xs text-slate-500">Choose an experience type to start customizing</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto">
          {/* Type Selector Grid */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Select Experience Format
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {experienceTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedType === item.type;

                return (
                  <div
                    key={item.type}
                    onClick={() => setSelectedType(item.type)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-start ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 mb-0.5">{item.title}</span>
                    <span className="text-[10px] text-slate-500 leading-tight">{item.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Experience Title
              </label>
              <input
                type="text"
                placeholder={`e.g. My New ${selectedType} Flow`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="What is the goal of this experience?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <span>Open Visual Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
