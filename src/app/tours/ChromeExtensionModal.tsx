import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Laptop,
  MousePointerClick,
  Puzzle,
  Sparkles,
  Workflow,
  X,
} from 'lucide-react';

export interface ChromeExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportClick?: () => void;
}

export const ChromeExtensionModal: React.FC<ChromeExtensionModalProps> = ({
  isOpen,
  onClose,
  onImportClick,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'features'>('install');

  if (!isOpen) return null;

  const copyExtensionsUrl = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ext-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/50 via-purple-50/20 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="ext-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  FlowPilot Chrome Extension
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Zero Code Needed
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create interactive tours directly on your live website — just like Userpilot & Whatfix.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('install')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'install'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            📦 3-Step Setup Guide
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'features'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ✨ Key Capabilities & Compare
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'install' ? (
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm">Download the Extension Package</h3>
                    <a
                      href="/downloads/flowpilot-extension.zip"
                      download="flowpilot-extension.zip"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Download .zip
                    </a>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Download the pre-packaged <code>flowpilot-extension.zip</code> and unzip (extract) it to a folder on your computer.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Load into Chrome (Developer Mode)</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Open Chrome's Extensions manager:
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="text-xs px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-900 font-mono text-indigo-600 dark:text-indigo-400 border border-slate-300 dark:border-slate-700">
                      chrome://extensions
                    </code>
                    <button
                      type="button"
                      onClick={copyExtensionsUrl}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedUrl ? 'Copied' : 'Copy link'}
                    </button>
                  </div>
                  <ul className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-5">
                    <li>Toggle ON <strong>Developer mode</strong> in the top right.</li>
                    <li>Click <strong>Load unpacked</strong> in the top left.</li>
                    <li>Select the extracted <code>extension</code> folder.</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Open Your App & Record Visually</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Navigate to your website (e.g. <code>app.yoursite.com</code> or <code>localhost:3000</code>):
                  </p>
                  <ul className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-5">
                    <li>Click the <strong>FlowPilot</strong> icon in your browser toolbar.</li>
                    <li>Click <strong>Start Visual Recording</strong>.</li>
                    <li>Hover and click any button, menu, input, or card to add a tour step.</li>
                    <li>When done, click <strong>Done & Save to FlowPilot</strong>.</li>
                  </ul>
                  <div className="mt-3 p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
                    <span>Your tour will automatically open here in the FlowPilot Studio with all steps already set up!</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mb-2">
                    <MousePointerClick className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs">Point-and-Click Recording</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Hover over any element on your page with interactive highlights. Click to capture immediately.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-2">
                    <Workflow className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs">Smart Resilient Selectors</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Prefers data-testid, aria-label, and semantic IDs so tours never break when CSS classes change.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-2">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs">Multi-Page Navigation</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Switch to Navigate mode anytime, browse across different pages of your app, and continue recording.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 flex items-center justify-center mb-2">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs">Zero-Code Workflow</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Product managers, marketers, and founders can build onboarding guides without waiting for developer sprints.
                  </p>
                </div>
              </div>

              {/* Comparison table */}
              <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="p-2.5">Feature</th>
                      <th className="p-2.5 text-indigo-600 dark:text-indigo-400">FlowPilot Extension</th>
                      <th className="p-2.5 text-slate-500">Userpilot / Whatfix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                    <tr>
                      <td className="p-2.5 font-medium">Element point & click</td>
                      <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">✓ Yes</td>
                      <td className="p-2.5 text-emerald-600 dark:text-emerald-400">✓ Yes</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Requires initial code install</td>
                      <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">No (build on any site)</td>
                      <td className="p-2.5 text-slate-500">No (extension based)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Monthly cost</td>
                      <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">$0 Free / Included</td>
                      <td className="p-2.5 text-rose-500">$249 - $500+/mo</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Embed Script Weight</td>
                      <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">&lt; 37 KB (Zero CSS Leak)</td>
                      <td className="p-2.5 text-slate-500">120 KB - 250 KB</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <a
            href="/downloads/flowpilot-extension.zip"
            download="flowpilot-extension.zip"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Download className="w-3.5 h-3.5" /> Download flowpilot-extension.zip (16 KB)
          </a>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <a
              href="/downloads/flowpilot-extension.zip"
              download="flowpilot-extension.zip"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
            >
              Download & Install Now <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
