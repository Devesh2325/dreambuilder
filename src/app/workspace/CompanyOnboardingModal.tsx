import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Building2, Check, Palette, Rocket, Sparkles, Target, Users, X } from 'lucide-react';
import { useWorkspace } from '../workspace';
import { useServices } from '../session';
import { inputClass, primaryButton, secondaryButton } from '../shared/ui';
import { ProjectType } from '../../core/schema';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';

const INDUSTRIES = [
  { id: 'saas', label: 'SaaS & Software', icon: '💻' },
  { id: 'fintech', label: 'FinTech & Wealth', icon: '📈' },
  { id: 'agency', label: 'Digital Tech Agency', icon: '🚀' },
  { id: 'health', label: 'Healthcare & Clinic', icon: '🏥' },
  { id: 'ecommerce', label: 'E-Commerce & Retail', icon: '🛍️' },
  { id: 'education', label: 'Education & EdTech', icon: '🎓' },
  { id: 'services', label: 'Professional Consulting', icon: '💼' },
  { id: 'other', label: 'Other Industry', icon: '✨' },
];

const COMPANY_SIZES = ['1-5 employees', '6-25 employees', '26-100 employees', '100+ employees'];

const PRIMARY_GOALS: { id: ProjectType; title: string; desc: string; icon: string }[] = [
  { id: 'website', title: 'Modern Website / Landing Page', desc: 'Publish responsive, high-converting pages for customers.', icon: '🌐' },
  { id: 'tour', title: 'Interactive Product Tour', desc: 'Walk new users through your app with zero CSS conflicts.', icon: '🧭' },
  { id: 'demo', title: 'Clickable Demo Mockup', desc: 'Showcase key product flows with highlighted area spotlights.', icon: '🎮' },
  { id: 'form', title: 'Lead Capture Form & Survey', desc: 'Collect qualified customer inquiries with instant CSV export.', icon: '📋' },
];

const BRAND_PALETTES = [
  { id: 'indigo', name: 'Indigo Tech', hex: '#4f46e5' },
  { id: 'midnight', name: 'Midnight Dark', hex: '#0f172a' },
  { id: 'emerald', name: 'Growth Emerald', hex: '#059669' },
  { id: 'ocean', name: 'Deep Ocean', hex: '#0284c7' },
  { id: 'coral', name: 'Warm Coral', hex: '#e11d48' },
];

export const CompanyOnboardingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { workspace } = useWorkspace();
  const { workspaces } = useServices();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [companyName, setCompanyName] = useState(workspace?.name || '');
  const [tagline, setTagline] = useState('');
  const [industry, setIndustry] = useState('saas');
  const [companySize, setCompanySize] = useState('1-5 employees');
  const [primaryGoal, setPrimaryGoal] = useState<ProjectType>('website');
  const [selectedColor, setSelectedColor] = useState(BRAND_PALETTES[0].hex);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      if (workspace?.organizationId) {
        localStorage.setItem(`fp_onboarded_${workspace.organizationId}`, '1');
        // Save company profile
        localStorage.setItem(
          `fp_company_profile_${workspace.organizationId}`,
          JSON.stringify({
            companyName: companyName.trim() || workspace.name,
            tagline: tagline.trim(),
            industry,
            companySize,
            primaryGoal,
            brandColor: selectedColor,
            completedAt: new Date().toISOString(),
          }),
        );
      }
      onClose();
      // Navigate to creating the chosen primary goal experience
      navigate(ROUTES.create(primaryGoal));
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Progress Strip */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 text-white shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Building2 className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Company Onboarding Setup · Step {step} of 3
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Skip onboarding"
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 id="onboarding-modal-title" className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {step === 1 && 'Tell us about your company'}
            {step === 2 && 'What do you want to build first?'}
            {step === 3 && 'Choose your brand visual theme'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-300">
            {step === 1 && 'We customize your templates, sample copy, and workspace defaults.'}
            {step === 2 && 'FlowPilot aligns your dashboard and tools to your core objective.'}
            {step === 3 && 'Pick a default palette. You can fine-tune every color anytime in the studio.'}
          </p>

          {/* Stepper Progress Bar */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-gradient-to-r from-indigo-400 to-fuchsia-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* STEP 1: Company Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Company / Organization Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Acme Cloud Innovations"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Tagline or One-Sentence Value Proposition
                </label>
                <input
                  type="text"
                  placeholder="e.g. The fastest developer platform for APIs and microservices"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Primary Industry
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => setIndustry(ind.id)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        industry === ind.id
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-base">{ind.icon}</span>
                      <span className="truncate">{ind.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Team Size
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COMPANY_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setCompanySize(size)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                        companySize === size
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Primary Goal */}
          {step === 2 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Select your starting mission:
              </label>
              <div className="grid gap-3">
                {PRIMARY_GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setPrimaryGoal(goal.id)}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                      primaryGoal === goal.id
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-2xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      {goal.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{goal.title}</h3>
                        {primaryGoal === goal.id && (
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{goal.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Brand Palette & Live Preview */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Select your Brand Accent Color:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {BRAND_PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setSelectedColor(pal.hex)}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        selectedColor === pal.hex
                          ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-md bg-indigo-50/50 dark:bg-indigo-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center text-white"
                        style={{ backgroundColor: pal.hex }}
                      >
                        {selectedColor === pal.hex && <Check className="w-4 h-4" />}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center">
                        {pal.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Generated Preview Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-950/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Live Brand Preview
                </span>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-md"
                    style={{ backgroundColor: selectedColor }}
                  >
                    {(companyName || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {companyName || 'Your Company Name'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {tagline || 'Ready to deliver world-class customer experiences'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
              className={secondaryButton}
            >
              Back
            </button>
          ) : (
            <button type="button" onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              Skip for now
            </button>
          )}

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                className={`${primaryButton} cursor-pointer`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleFinish}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Rocket className="w-4 h-4" />
                <span>Launch Workspace</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
