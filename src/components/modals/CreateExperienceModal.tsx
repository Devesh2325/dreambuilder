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
  ArrowRight,
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Layers,
  CheckCircle2,
  Languages
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

const EXPERIENCE_TYPES = [
  { type: 'tour' as ExperienceType, title: 'Product Tour', desc: 'Step-by-step guided walkthroughs with target element spotlighting', icon: Compass, category: 'Adoption' },
  { type: 'demo' as ExperienceType, title: 'Interactive Demo', desc: 'Clickable product simulation with interactive hotspots', icon: PlaySquare, category: 'Adoption' },
  { type: 'checklist' as ExperienceType, title: 'Onboarding Checklist', desc: 'Gamified milestone checklist for new user onboarding', icon: CheckSquare, category: 'Adoption' },
  { type: 'banner' as ExperienceType, title: 'In-App Banner', desc: 'High-visibility announcement header or floating alert', icon: Megaphone, category: 'Engagement' },
  { type: 'popup' as ExperienceType, title: 'Popup & Modal', desc: 'Exit-intent or scroll-triggered modal offer or notice', icon: AppWindow, category: 'Engagement' },
  { type: 'survey' as ExperienceType, title: 'Feedback & Survey', desc: 'In-app CSAT/NPS rating widget and customer feedback form', icon: Star, category: 'Engagement' },
  { type: 'page' as ExperienceType, title: 'Landing Page', desc: 'Responsive conversion page with hero and feature blocks', icon: Globe, category: 'Content' },
  { type: 'menu' as ExperienceType, title: 'Navigation Menu', desc: 'Responsive site header navigation with dropdowns', icon: MenuIcon, category: 'Content' },
  { type: 'faq' as ExperienceType, title: 'FAQ & Help Center', desc: 'Searchable accordion knowledgebase for instant answers', icon: HelpCircle, category: 'Content' },
];

const LANGUAGES = [
  { code: 'en', label: 'English (US)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'ja', label: 'Japanese (日本語)' },
];

export const CreateExperienceModal: React.FC<Props> = ({ isOpen, onClose, defaultType = 'tour' }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<ExperienceType>(defaultType);
  const [filterCategory, setFilterCategory] = useState<'all' | 'Adoption' | 'Engagement' | 'Content'>('all');
  
  // Step 2 Fields
  const [title, setTitle] = useState('');
  const [targetPageUrl, setTargetPageUrl] = useState('https://app.yourproduct.com/dashboard');
  const [deviceTarget, setDeviceTarget] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [language, setLanguage] = useState('en');

  if (!isOpen) return null;

  const filteredTypes = filterCategory === 'all' 
    ? EXPERIENCE_TYPES 
    : EXPERIENCE_TYPES.filter(t => t.category === filterCategory);

  const selectedDef = EXPERIENCE_TYPES.find(t => t.type === selectedType) || EXPERIENCE_TYPES[0];

  const handleNextStep = () => {
    if (!title.trim()) {
      setTitle(`My ${selectedDef.title}`);
    }
    setStep(2);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || `New ${selectedDef.title}`;
    const newProjectId = `proj_${Date.now()}`;
    const newDocId = `doc_${Date.now()}`;

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

    // Set trigger url rule based on user input
    if (targetPageUrl) {
      doc.triggerConditions.urlRules = [{ type: 'contains', value: targetPageUrl }];
    }

    storage.saveDocument(doc);
    storage.createProject({
      title: finalTitle,
      description: `Targeting: ${targetPageUrl} (${deviceTarget})`,
      type: selectedType,
      status: 'draft',
      tags: [selectedType, deviceTarget, language],
      documentId: newDocId,
    });

    onClose();
    navigate(`/editor/${newDocId}`);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {step === 1 ? '1' : '2'}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {step === 1 ? 'Step 1: Choose Experience Format' : 'Step 2: Experience Details & Targeting'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 1 ? 'Select what type of interactive experience you want to design' : 'Configure destination page, device, and language'}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Format & Category Selection */}
        {step === 1 && (
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Category:</span>
              {(['all', 'Adoption', 'Engagement', 'Content'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    filterCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'all' ? 'All Formats' : cat}
                </button>
              ))}
            </div>

            {/* Experience Types Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedType === item.type;

                return (
                  <div
                    key={item.type}
                    onClick={() => setSelectedType(item.type)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-600/30 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block mb-1">
                        {item.title}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase mt-3">
                      {item.category}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step 1 Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Selected: <strong className="text-indigo-600 dark:text-indigo-400">{selectedDef.title}</strong>
              </span>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                <span>Continue to Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Details, Targeting & Launch */}
        {step === 2 && (
          <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto">
            {/* Experience Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Experience Name
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. New User Welcome ${selectedDef.title}`}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium"
              />
            </div>

            {/* Target Page URL */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Target Webpage / Application Route
              </label>
              <input
                type="text"
                value={targetPageUrl}
                onChange={(e) => setTargetPageUrl(e.target.value)}
                placeholder="https://app.example.com/dashboard or /onboarding"
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                The experience will automatically trigger when visitors navigate to this URL.
              </span>
            </div>

            {/* Device Target & Language in 2 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Device Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Target Device
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeviceTarget('desktop')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs transition-all ${
                      deviceTarget === 'desktop'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceTarget('tablet')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs transition-all ${
                      deviceTarget === 'tablet'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Tablet className="w-4 h-4" />
                    <span>Tablet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceTarget('mobile')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs transition-all ${
                      deviceTarget === 'mobile'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile</span>
                  </button>
                </div>
              </div>

              {/* Language Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Default Language
                </label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-medium appearance-none"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <Languages className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Step 2 Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create & Open Visual Editor</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
