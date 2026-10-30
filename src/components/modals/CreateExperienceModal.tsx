import React, { useState, useEffect } from 'react';
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
  Languages,
  DollarSign,
  MessageSquareQuote,
  Send,
  LayoutTemplate,
  FilePlus2,
  Check
} from 'lucide-react';
import { 
  createBlankDocument,
  createTourDocument, 
  createDemoDocument, 
  createPageDocument, 
  createBannerDocument, 
  createMenuDocument, 
  createFaqDocument, 
  createPopupDocument, 
  createChecklistDocument, 
  createSurveyDocument,
  createPricingDocument,
  createTestimonialsDocument,
  createFormDocument
} from '../../services/seedData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ExperienceType;
  isGlobal?: boolean;
}

const EXPERIENCE_TYPES = [
  { type: 'tour' as ExperienceType, title: 'Product Tour', desc: 'Step-by-step guided walkthroughs with target element spotlighting', icon: Compass, category: 'Adoption' },
  { type: 'demo' as ExperienceType, title: 'Interactive Demo', desc: 'Clickable product simulation with interactive hotspots', icon: PlaySquare, category: 'Adoption' },
  { type: 'checklist' as ExperienceType, title: 'Onboarding Checklist', desc: 'Gamified milestone checklist for new user onboarding', icon: CheckSquare, category: 'Adoption' },
  { type: 'banner' as ExperienceType, title: 'In-App Banner', desc: 'High-visibility announcement header or floating alert', icon: Megaphone, category: 'Engagement' },
  { type: 'popup' as ExperienceType, title: 'Popup & Modal', desc: 'Exit-intent or scroll-triggered modal offer or notice', icon: AppWindow, category: 'Engagement' },
  { type: 'survey' as ExperienceType, title: 'Feedback & Survey', desc: 'In-app CSAT/NPS rating widget and customer feedback form', icon: Star, category: 'Engagement' },
  { type: 'pricing' as ExperienceType, title: 'Pricing Table', desc: 'Tiered subscription cards with billing intervals and feature lists', icon: DollarSign, category: 'Engagement' },
  { type: 'testimonials' as ExperienceType, title: 'Testimonials Grid', desc: 'Verified customer review cards, quote walls, and star ratings', icon: MessageSquareQuote, category: 'Content' },
  { type: 'form' as ExperienceType, title: 'Lead Capture Form', desc: 'Contact inquiries and demo requests with validated fields', icon: Send, category: 'Content' },
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

export const CreateExperienceModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  defaultType, 
  isGlobal = false 
}) => {
  const navigate = useNavigate();

  // If a specific defaultType is provided and not in global mode, skip format picker step
  const isModuleLocked = Boolean(defaultType && !isGlobal);

  const [step, setStep] = useState<1 | 2>(isModuleLocked ? 2 : 1);
  const [selectedType, setSelectedType] = useState<ExperienceType>(defaultType || 'tour');
  const [filterCategory, setFilterCategory] = useState<'all' | 'Adoption' | 'Engagement' | 'Content'>('all');
  
  // Starting canvas layout mode: 'blank' (clean empty canvas) vs 'template' (starter pre-filled demo)
  const [startMode, setStartMode] = useState<'blank' | 'template'>('blank');

  // Step 2 Fields
  const [title, setTitle] = useState('');
  const [targetPageUrl, setTargetPageUrl] = useState('https://app.yourproduct.com/dashboard');
  const [deviceTarget, setDeviceTarget] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [language, setLanguage] = useState('en');

  // Synchronize when modal opens or defaultType changes
  useEffect(() => {
    if (isOpen) {
      if (defaultType && !isGlobal) {
        setSelectedType(defaultType);
        setStep(2);
        const def = EXPERIENCE_TYPES.find(t => t.type === defaultType);
        setTitle(`My ${def?.title || 'Experience'}`);
      } else {
        setStep(1);
        setSelectedType(defaultType || 'tour');
        setTitle('');
      }
      setStartMode('blank');
    }
  }, [isOpen, defaultType, isGlobal]);

  if (!isOpen) return null;

  const filteredTypes = filterCategory === 'all' 
    ? EXPERIENCE_TYPES 
    : EXPERIENCE_TYPES.filter(t => t.category === filterCategory);

  const selectedDef = EXPERIENCE_TYPES.find(t => t.type === selectedType) || EXPERIENCE_TYPES[0];
  const SelectedIcon = selectedDef.icon;

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
    if (startMode === 'blank') {
      // Create clean document without bloated dummy data
      doc = createBlankDocument(newDocId, newProjectId, finalTitle, selectedType);
    } else {
      // Create with rich starter template
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
        case 'pricing': doc = createPricingDocument(newDocId, newProjectId, finalTitle); break;
        case 'testimonials': doc = createTestimonialsDocument(newDocId, newProjectId, finalTitle); break;
        case 'form': doc = createFormDocument(newDocId, newProjectId, finalTitle); break;
        default: doc = createBlankDocument(newDocId, newProjectId, finalTitle, selectedType);
      }
    }

    // Set trigger url rule based on user input
    if (targetPageUrl) {
      doc.triggerConditions.urlRules = [{ type: 'contains', value: targetPageUrl }];
    }

    storage.saveDocument(doc);
    storage.createProject({
      title: finalTitle,
      description: `Targeting: ${targetPageUrl} (${deviceTarget}) - ${startMode === 'blank' ? 'Blank Canvas' : 'Starter Template'}`,
      type: selectedType,
      status: 'draft',
      tags: [selectedType, deviceTarget, language, startMode],
      documentId: newDocId,
    });

    onClose();
    navigate(`/editor/${newDocId}`);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <SelectedIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {isModuleLocked
                  ? `Create New ${selectedDef.title}`
                  : step === 1
                  ? 'Step 1: Choose Experience Format'
                  : `Step 2: Configure ${selectedDef.title}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isModuleLocked
                  ? `Configure your ${selectedDef.title.toLowerCase()} starting canvas, targeting & layout`
                  : step === 1
                  ? 'Select what type of interactive experience you want to design'
                  : 'Select starting canvas mode, destination URL, and device target'}
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

        {/* STEP 1: Format & Category Selection (Only shown when not locked to a specific module) */}
        {step === 1 && !isModuleLocked && (
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
                    onClick={() => {
                      setSelectedType(item.type);
                      setTitle(`My ${item.title}`);
                    }}
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

        {/* STEP 2: Experience Configuration & Start Mode Selection */}
        {(step === 2 || isModuleLocked) && (
          <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto">
            
            {/* Start Mode Toggle (Blank vs Template) - Professional Builder Pattern */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Choose Starting Canvas Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Option 1: Clean / Blank Canvas */}
                <div
                  onClick={() => setStartMode('blank')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 relative ${
                    startMode === 'blank'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    startMode === 'blank'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <FilePlus2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Blank Canvas (Clean Slate)
                      </span>
                      {startMode === 'blank' && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Clean canvas with no dummy data clutter. Perfect to design from scratch or drag blocks freely.
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                      Recommended
                    </span>
                  </div>
                </div>

                {/* Option 2: Starter Template */}
                <div
                  onClick={() => setStartMode('template')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 relative ${
                    startMode === 'template'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    startMode === 'template'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <LayoutTemplate className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Starter Template
                      </span>
                      {startMode === 'template' && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Pre-populated sample layout with pre-styled cards and mock steps for quick inspiration.
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                      Sample Data Included
                    </span>
                  </div>
                </div>

              </div>
            </div>

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
                placeholder={`e.g. My ${selectedDef.title}`}
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
              {!isModuleLocked ? (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Formats</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}

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
