import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Globe, Image as ImageIcon, Loader2, Monitor, Smartphone, Sparkles, Tablet, Upload, Wand2, X } from 'lucide-react';
import { moduleNoun } from '../../core/modules';
import { ProjectType } from '../../core/schema';
import { generateProjectWithAi, extractBrandFromUrl, AiInputMode } from '../../core/aiGenerator';
import { ROUTES } from '../routes';
import { useServices } from '../session';
import { GLOBAL_LANGUAGES } from '../shared/GoogleTranslate';
import { inputClass, primaryButton, secondaryButton } from '../shared/ui';
import { useWorkspace } from '../workspace';

interface AiCreateModalProps {
  initialType?: ProjectType;
  onClose: () => void;
}

const INSPIRATION_PROMPTS: Record<ProjectType, { label: string; prompt: string }[]> = {
  page: [
    { label: '🚀 SaaS Platform', prompt: 'Modern B2B SaaS landing page with dark theme, animated hero ticker, 4 feature pillars, customer reviews with 5-star ratings, 3 pricing tiers, and an FAQ accordion.' },
    { label: '📈 SEBI Research Analyst', prompt: 'SEBI Registered Research Analyst advisory portfolio for Devesh with regulatory disclosures, disciplined trade call track records, subscription plans with ratings, and contact form.' },
    { label: '📱 Mobile App Launch', prompt: 'High-energy mobile app launch page with dynamic word-cycling headline, App Store & Google Play buttons, screenshot mockups, and customer testimonial quotes.' },
    { label: '🎓 Course & Masterclass', prompt: 'Full-stack developer masterclass landing page with syllabus outline, student reviews with star ratings, instructor credentials, and early-bird checkout button.' },
  ],
  tour: [
    { label: '🧭 App Onboarding Tour', prompt: 'Product onboarding guided walkthrough for a SaaS dashboard with welcome modal, navigation bar spotlight, primary action button tooltip, and celebratory completion slide-out.' },
    { label: '📊 Analytics & Reporting', prompt: 'Step-by-step interactive tour guiding users through KPI charts, custom report filters, user cohort retention tables, and PDF export buttons.' },
    { label: '⚡ New Feature Announcement', prompt: 'Announcement slideout and targeted tooltips showcasing our new AI generation engine and real-time collaboration canvas.' },
  ],
  website: [
    { label: '💼 Tech Agency Website', prompt: 'Multi-page digital agency website with service capabilities, client portfolio case studies, verified Trustpilot star ratings, team profiles, and meeting scheduler.' },
    { label: '🛠️ Developer Platform', prompt: 'Developer hub modeled after Apidog with live API request/response playground, OpenAPI docs, CLI commands, and dark developer aesthetic.' },
  ],
  form: [
    { label: '📋 Lead Intake Survey', prompt: 'Multi-step client intake questionnaire with budget selector, 1-5 star satisfaction rating scale, and contact details validation.' },
  ],
  demo: [
    { label: '🎮 Interactive Product Demo', prompt: 'Clickable product demo with 3 sequential screens, pulsing hotspots, and free trial call-to-action gate.' },
  ],
  banner: [
    { label: '📣 Product Drop Announcement', prompt: 'High-contrast top banner with discount countdown timer, callout badge, and coupon code button.' },
  ],
  menu: [
    { label: '🧭 Responsive Nav Bar', prompt: 'Modern sticky navigation bar with logo, dropdown menus, search bar, and primary sign-up button.' },
  ],
  faq: [
    { label: '❓ Help Center Accordion', prompt: 'Searchable FAQ accordion covering account setup, billing, security, and developer API integration.' },
  ],
};

const THEME_TONES = [
  { id: 'indigo', label: 'Indigo Tech', color: '#4f46e5' },
  { id: 'midnight', label: 'Midnight Dark', color: '#0f172a' },
  { id: 'emerald', label: 'Growth Green', color: '#059669' },
  { id: 'ocean', label: 'Deep Ocean', color: '#0284c7' },
  { id: 'coral', label: 'Warm Coral', color: '#e11d48' },
  { id: 'mono', label: 'Clean Mono', color: '#18181b' },
] as const;

export const AiCreateModal: React.FC<AiCreateModalProps> = ({ initialType = 'page', onClose }) => {
  const { projects } = useServices();
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [type, setType] = useState<ProjectType>(initialType);
  const [mode, setMode] = useState<AiInputMode>('prompt');
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState('');
  const [themeTone, setThemeTone] = useState<'indigo' | 'midnight' | 'emerald' | 'ocean' | 'coral' | 'mono'>('indigo');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [language, setLanguage] = useState('en');
  const [stepMessage, setStepMessage] = useState<string | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal?.();
  }, []);

  const noun = moduleNoun(type);

  // File Upload Handler
  const handleImageUpload = (file: File) => {
    if (!file) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!workspace?.organizationId) throw new Error('Workspace not ready');

      setStepMessage('Analyzing brand and prompt requirements...');
      await new Promise((r) => setTimeout(r, 600));

      setStepMessage(`Synthesizing complete ${noun} layout and responsive structure...`);
      await new Promise((r) => setTimeout(r, 600));

      setStepMessage('Configuring animations, star ratings, and variables...');
      const payload = await generateProjectWithAi(
        {
          type,
          mode,
          prompt,
          url,
          imageDataUrl: imagePreview ?? undefined,
          imageName,
          themeTone,
          device,
          language,
        },
        workspace.organizationId
      );

      setStepMessage('Finalizing project document in workspace...');
      const projectId = await projects.create({
        organizationId: workspace.organizationId,
        type: payload.type,
        title: payload.title,
        theme: payload.theme,
        settings: payload.settings,
        variables: payload.variables,
        documents: payload.documents,
      });

      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-details'] });
      navigate(ROUTES.studio(projectId), {
        state: { justCreatedWithAi: true, initialDevice: device, initialLanguage: language },
      });
    },
    onError: () => {
      setStepMessage(null);
    },
  });

  const urlBrandInfo = url ? extractBrandFromUrl(url) : null;
  const promptsForType = INSPIRATION_PROMPTS[type] ?? INSPIRATION_PROMPTS.page;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="ai-modal-title"
      className="rounded-3xl p-0 w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-slate-800 backdrop:bg-slate-950/70 overflow-hidden"
    >
      {/* Header Banner */}
      <div className="relative p-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="p-2 rounded-xl bg-gradient-to-r from-amber-400 to-indigo-500 text-slate-950 shadow-md">
            <Sparkles className="w-5 h-5 fill-current" />
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/15 text-amber-300 border border-white/20">
            AI Assistant Engine
          </span>
        </div>

        <h2 id="ai-modal-title" className="text-2xl font-bold">
          Create with AI
        </h2>
        <p className="mt-1 text-sm text-slate-300 max-w-lg">
          Generate complete, publication-ready <strong>Pages</strong> or <strong>Interactive Tours</strong> from a prompt, an existing website link, or an uploaded mockup screenshot.
        </p>

        {/* Project Type Switcher */}
        <div className="flex gap-2 mt-5 p-1 rounded-xl bg-white/10 backdrop-blur-md max-w-sm">
          <button
            type="button"
            onClick={() => setType('page')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              type === 'page' ? 'bg-white text-indigo-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Landing Page
          </button>
          <button
            type="button"
            onClick={() => setType('tour')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              type === 'tour' ? 'bg-white text-indigo-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Interactive Tour
          </button>
          <button
            type="button"
            onClick={() => setType('website')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              type === 'website' ? 'bg-white text-indigo-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Website
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6 space-y-5 max-h-[calc(85vh-200px)] overflow-y-auto">
        {/* Input Mode Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            How do you want AI to build it?
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode('prompt')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                mode === 'prompt'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-bold">
                <Wand2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> From Prompt
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Describe what you need</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('url')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                mode === 'url'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-bold">
                <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Website Link
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Recreate from live URL</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('image')}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                mode === 'image'
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-bold">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Mockup Image
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Upload UI screenshot</span>
            </button>
          </div>
        </div>

        {/* Mode 1: Prompt Input */}
        {mode === 'prompt' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="ai-prompt" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Describe your {noun}
              </label>
              <span className="text-[11px] text-slate-400">Be as specific as you like</span>
            </div>
            <textarea
              id="ai-prompt"
              rows={3}
              placeholder={`e.g. Modern ${noun} for an AI developer platform with interactive code mockups, customer testimonials with star ratings, pricing table, and FAQ...`}
              className={`${inputClass} resize-none leading-relaxed text-xs`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            {/* Inspiration Chips */}
            <div className="pt-1">
              <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                Quick inspiration templates:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {promptsForType.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setPrompt(item.prompt)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: Website URL Input */}
        {mode === 'url' && (
          <div className="space-y-3">
            <div>
              <label htmlFor="ai-url" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Enter Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  id="ai-url"
                  type="url"
                  placeholder="https://example.com"
                  className={`${inputClass} !pl-9 font-mono text-xs`}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                AI will inspect the domain, extract the brand name, detect the industry archetype, and generate a matching {noun}.
              </p>
            </div>

            {urlBrandInfo && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Extracted Brand: {urlBrandInfo.brand}</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">Industry: {urlBrandInfo.archetype} ({urlBrandInfo.domain})</span>
                </div>
                <span className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                </span>
              </div>
            )}
          </div>
        )}

        {/* Mode 3: Image / Mockup Upload */}
        {mode === 'image' && (
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Upload UI Screenshot or Mockup
            </label>
            <div
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                imagePreview
                  ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400'
              }`}
              onClick={() => document.getElementById('ai-file-upload')?.click()}
            >
              <input
                id="ai-file-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              />
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Uploaded mockup"
                    className="max-h-40 mx-auto rounded-lg shadow-md object-contain border border-slate-200 dark:border-slate-700"
                  />
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <Check className="w-4 h-4" /> Loaded: {imageName} (Click to replace)
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Drop your screenshot or click to browse
                  </p>
                  <p className="text-[11px] text-slate-400">
                    PNG, JPG or WebP. AI will embed it in the hero card or set it as interactive tour hotspots.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customization Options Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Theme Palette
            </label>
            <select
              className={inputClass}
              value={themeTone}
              onChange={(e) => setThemeTone(e.target.value as any)}
            >
              {THEME_TONES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Target Device
            </label>
            <select
              className={inputClass}
              value={device}
              onChange={(e) => setDevice(e.target.value as any)}
            >
              <option value="desktop">Desktop</option>
              <option value="tablet">Tablet</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Language
            </label>
            <select
              className={inputClass}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {GLOBAL_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native} ({l.label})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress or Error Display */}
        {stepMessage && (
          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3 text-xs text-indigo-900 dark:text-indigo-200 animate-in fade-in">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-semibold">{stepMessage}</span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 px-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <button
          type="button"
          className={secondaryButton}
          disabled={createMutation.isPending}
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={createMutation.isPending || (mode === 'url' && !url) || (mode === 'image' && !imagePreview && !prompt)}
          onClick={() => createMutation.mutate()}
          className="py-2.5 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-lg hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating {noun}...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
              <span>Generate {noun} with AI</span>
            </>
          )}
        </button>
      </div>
    </dialog>
  );
};
