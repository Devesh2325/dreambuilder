import React, { useState } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { storage } from '../../services/storage';
import { 
  X, 
  UploadCloud, 
  Check, 
  Copy, 
  ExternalLink, 
  RotateCcw, 
  Clock, 
  ShieldCheck,
  Code
} from 'lucide-react';

export const PublishModal: React.FC = () => {
  const {
    document,
    isPublishModalOpen,
    setIsPublishModalOpen,
    publish,
    setDocument,
  } = useEditorStore();

  const [summary, setSummary] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isPublishModalOpen || !document) return null;

  const versions = storage.getDocumentVersions(document.id);
  const previewUrl = `${window.location.origin}/preview/${document.id}`;
  const embedSnippet = `<script src="${window.location.origin}/flowpilot.js" data-project-id="${document.projectId}" defer></script>`;

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    publish(summary.trim() || 'Updated experience content and triggers');
    setSummary('');
  };

  const handleRollback = (versionId: string) => {
    if (window.confirm('Are you sure you want to rollback to this version?')) {
      const restored = storage.rollbackDocumentVersion(document.id, versionId);
      setDocument(restored);
      setIsPublishModalOpen(false);
    }
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Publish Experience</h3>
              <p className="text-xs text-slate-500">Deploy changes live to web and application runtimes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPublishModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Release Form */}
          <form onSubmit={handlePublish} className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Release Notes / Change Summary
            </label>
            <input
              type="text"
              placeholder="e.g. Added step 3 to tour, adjusted button copy..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Confirm & Publish New Version
            </button>
          </form>

          {/* Embed Script Snippet */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-600" />
                Customer Website Embed Snippet
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(embedSnippet, setCopiedSnippet)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                {copiedSnippet ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Paste this snippet right before the closing &lt;/body&gt; tag of your web application:
            </p>
            <pre className="p-2.5 bg-slate-900 text-indigo-200 text-[11px] font-mono rounded-lg overflow-x-auto select-all">
              {embedSnippet}
            </pre>
          </div>

          {/* Live Preview Link */}
          <div className="flex items-center justify-between p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Public Live Preview Link:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(previewUrl, setCopiedUrl)}
                className="px-2.5 py-1 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
              >
                {copiedUrl ? 'Copied' : 'Copy URL'}
              </button>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-semibold flex items-center gap-1"
              >
                <span>Open</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Version History & Rollback */}
          {versions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Published Versions History
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {versions.map((ver) => (
                  <div key={ver.id} className="p-2.5 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Version {ver.versionNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ver.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{ver.changeSummary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRollback(ver.id)}
                      className="px-2 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Rollback</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
