import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../services/storage';
import { DocumentModel, ComponentNode } from '../../types/document';
import { 
  X, 
  Compass, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Globe, 
  Crosshair, 
  Layers, 
  Sliders
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTourModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const [tourName, setTourName] = useState('New Feature Walkthrough');
  const [targetUrl, setTargetUrl] = useState('https://app.yourproduct.com/dashboard');
  const [stepCount, setStepCount] = useState<number>(3);
  const [spotlightStyle, setSpotlightStyle] = useState<'dimmed' | 'halo' | 'pulse'>('dimmed');
  const [placement, setPlacement] = useState<'bottom' | 'top' | 'right' | 'left' | 'auto'>('bottom');
  const [step1Title, setStep1Title] = useState('Welcome to the Dashboard');
  const [step2Title, setStep2Title] = useState('Explore Key Analytics');
  const [step3Title, setStep3Title] = useState('Take Your Next Action');

  if (!isOpen) return null;

  const handleCreateTour = () => {
    const docId = `doc_tour_${Date.now()}`;
    const projectId = `proj_tour_${Date.now()}`;

    // Construct tour steps
    const stepTitles = [
      step1Title || 'Welcome Step',
      step2Title || 'Feature Highlights',
      step3Title || 'Action Checklist',
      'Advanced Settings',
      'Completion & Next Steps',
    ];

    const tourStepChildren: ComponentNode[] = Array.from({ length: stepCount }, (_, i) => ({
      id: `step_${Date.now()}_${i + 1}`,
      type: 'TourStep',
      name: `Step ${i + 1}: ${stepTitles[i] || `Tour Step ${i + 1}`}`,
      target: {
        selector: i === 0 ? '#welcome-header' : i === 1 ? '#analytics-chart' : '#action-button',
        placement: placement,
        offset: 12,
        highlight: true,
      },
      props: {
        stepNumber: i + 1,
        title: stepTitles[i] || `Tour Step ${i + 1}`,
        description: i === 0 
          ? 'Welcome to this interactive walkthrough. Learn the most important features in just 2 minutes.' 
          : i === 1 
          ? 'Track your real-time conversions, visitor metrics, and active campaigns directly here.' 
          : 'Ready to launch? Click here to invite team members and publish your first project.',
        nextButtonText: i === stepCount - 1 ? 'Finish Tour 🎉' : 'Next Step →',
        prevButtonText: i === 0 ? undefined : 'Back',
        skipButtonText: 'Skip Tour',
      },
      styles: {
        width: '100%',
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#e2e8f0',
      },
      children: [],
    }));

    const rootContainer: ComponentNode = {
      id: `tour_container_${Date.now()}`,
      type: 'TourContainer',
      name: `${tourName} Flow`,
      props: {
        currentStepIndex: 0,
      },
      styles: {
        width: '100%',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      },
      children: tourStepChildren,
    };

    const doc: DocumentModel = {
      id: docId,
      projectId,
      organizationId: 'org_flowpilot_demo',
      title: tourName.trim() || 'Untitled Tour',
      documentType: 'tour',
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: false,
      rootNode: rootContainer,
      themeVariables: {
        primaryColor: '#4f46e5',
        secondaryColor: '#6366f1',
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        borderRadius: '8px',
        fontFamily: 'Inter, sans-serif',
      },
      responsiveSettings: {
        breakpoints: { mobile: 480, tablet: 768, desktop: 1200 },
      },
      experienceSettings: {
        showBackdrop: spotlightStyle === 'dimmed',
        backdropColor: '#0f172a',
        backdropOpacity: 0.75,
        closeOnEscape: true,
        showProgress: true,
        allowSkip: true,
        accentColor: '#4f46e5',
      },
      triggerConditions: {
        urlRules: [{ type: 'contains', value: targetUrl }],
        delaySeconds: 1,
        frequency: 'once_per_visitor',
      },
    };

    storage.saveDocument(doc);

    storage.createProject({
      title: tourName.trim() || 'Untitled Tour',
      description: `Guided walkthrough targeting ${targetUrl} with ${stepCount} interactive steps`,
      type: 'tour',
      status: 'draft',
      tags: ['product-tour', 'onboarding'],
      documentId: docId,
    });

    onClose();
    navigate(`/editor/${docId}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-slate-900 dark:to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Create Product Tour
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure your dedicated walkthrough flow and target parameters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Tour Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tour Name
            </label>
            <input
              type="text"
              value={tourName}
              onChange={(e) => setTourName(e.target.value)}
              placeholder="e.g. Dashboard Onboarding Tour"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Target URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>Target Application URL</span>
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://app.yourproduct.com/dashboard"
              className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Step Count & Placement */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Number of Steps
              </label>
              <div className="flex gap-1.5">
                {[2, 3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setStepCount(cnt)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      stepCount === cnt
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tooltip Placement
              </label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="bottom">Bottom (Default)</option>
                <option value="top">Top</option>
                <option value="right">Right</option>
                <option value="left">Left</option>
                <option value="auto">Auto Adaptive</option>
              </select>
            </div>
          </div>

          {/* Spotlight Effect Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-indigo-500" />
              <span>Target Spotlight Effect</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dimmed', label: 'Dark Backdrop', desc: 'Focus whole screen' },
                { id: 'halo', label: 'Halo Glow', desc: 'Indigo glow ring' },
                { id: 'pulse', label: 'Pulse Target', desc: 'Subtle heartbeat' },
              ].map((eff) => (
                <button
                  key={eff.id}
                  type="button"
                  onClick={() => setSpotlightStyle(eff.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    spotlightStyle === eff.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[11px] font-bold">{eff.label}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{eff.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step Titles Preview */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Initial Step Titles
            </label>
            <div className="space-y-1.5">
              <input
                type="text"
                value={step1Title}
                onChange={(e) => setStep1Title(e.target.value)}
                placeholder="Step 1 Title"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              />
              {stepCount >= 2 && (
                <input
                  type="text"
                  value={step2Title}
                  onChange={(e) => setStep2Title(e.target.value)}
                  placeholder="Step 2 Title"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              )}
              {stepCount >= 3 && (
                <input
                  type="text"
                  value={step3Title}
                  onChange={(e) => setStep3Title(e.target.value)}
                  placeholder="Step 3 Title"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateTour}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <span>Launch in Canvas Editor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
