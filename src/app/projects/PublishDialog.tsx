import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, ExternalLink, Globe, Code } from 'lucide-react';
import { MODULES, moduleNoun } from '../../core/modules';
import { ProjectRecord } from '../../data/services';
import { publicSitePath } from '../routes';
import { useServices } from '../session';
import { BusyLabel, ErrorNote, errorMessage, inputClass, primaryButton, secondaryButton } from '../shared/ui';

const suggestSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);

interface PublishDialogProps {
  project: ProjectRecord;
  /** Runs first, so what's published includes the latest edits. */
  beforePublish?: () => Promise<void>;
  onClose: () => void;
  onPublished: () => void;
}

export const PublishDialog: React.FC<PublishDialogProps> = ({ project, beforePublish, onClose, onPublished }) => {
  const { publishing } = useServices();
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState(project.slug ?? suggestSlug(project.title));
  const [summary, setSummary] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [embedTab, setEmbedTab] = useState<'iframe' | 'script'>('iframe');
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal?.();
  }, []);

  const publish = useMutation({
    mutationFn: async () => {
      await beforePublish?.();
      await publishing.publish(project.id, summary.trim() || undefined, slug);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      queryClient.invalidateQueries({ queryKey: ['versions', project.id] });
      setIsSuccess(true);
    },
  });

  const liveUrl = `${window.location.origin}${publicSitePath(slug)}`;
  const iframeSnippet = `<iframe src="${liveUrl}" width="100%" height="750px" style="border:0;border-radius:12px;box-shadow:0 12px 36px rgba(0,0,0,0.12);" allow="clipboard-write" allowfullscreen></iframe>`;
  const scriptSnippet = `<script src="${window.location.origin}/flowpilot.js" data-project-id="${project.id}"></script>`;
  const activeCode = embedTab === 'iframe' ? iframeSnippet : scriptSnippet;

  const copyText = async (text: string, isLink: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isLink) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const noun = moduleNoun(project.type);
  const typeLabel = MODULES[project.type].label;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="publish-title"
      className="rounded-2xl p-6 w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-slate-800 backdrop:bg-slate-900/60"
    >
      {isSuccess ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="text-center">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-2 text-2xl">
              ✓
            </span>
            <h2 id="publish-title" className="text-xl font-bold">
              {typeLabel} is Live!
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your {noun} is published. Share the direct link or integrate it into your site with code.
            </p>
          </div>

          {/* Section 1: Share Link (One Link) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Direct Share Link (One Link)
              </span>
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Open Live <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={liveUrl}
                className={`${inputClass} !bg-white dark:!bg-slate-900 select-all font-mono text-xs`}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                className={`${primaryButton} shrink-0 !py-2 !px-3.5 flex items-center gap-1.5 text-xs font-semibold`}
                onClick={() => copyText(liveUrl, true)}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Section 2: Integrate in Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" /> Integrate in Code
              </span>
              <div className="flex gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${embedTab === 'iframe' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500'}`}
                  onClick={() => setEmbedTab('iframe')}
                >
                  Iframe Embed
                </button>
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${embedTab === 'script' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-slate-500'}`}
                  onClick={() => setEmbedTab('script')}
                >
                  Script Tag
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="p-3 rounded-lg overflow-x-auto bg-slate-900 text-slate-100 text-xs font-mono leading-relaxed">
                <code>{activeCode}</code>
              </pre>
              <button
                type="button"
                aria-label="Copy code snippet"
                className="absolute top-2 right-2 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                onClick={() => copyText(activeCode, false)}
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              className={secondaryButton}
              onClick={onClose}
            >
              Keep Editing
            </button>
            <button
              type="button"
              className={primaryButton}
              onClick={onPublished}
            >
              Project Details →
            </button>
          </div>
        </div>
      ) : (
        <form
          method="dialog"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            publish.mutate();
          }}
        >
          <h2 id="publish-title" className="text-lg font-bold">Publish {noun}</h2>
          <ErrorNote message={publish.isError ? errorMessage(publish.error) : null} />
          <label className="block text-sm font-medium">Web address (One Link)
            <div className="mt-1 flex items-center gap-1">
              <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{window.location.host}{publicSitePath('')}</span>
              <input
                className={inputClass}
                required
                maxLength={63}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                title="Lowercase letters, numbers and single hyphens"
                value={slug}
                onChange={(event) => setSlug(event.target.value.toLowerCase())}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This becomes your permanent shareable URL: {window.location.origin}{publicSitePath(slug)}
            </p>
          </label>
          <label className="block text-sm font-medium">What changed? (optional)
            <input className={`${inputClass} mt-1`} maxLength={500} value={summary} onChange={(event) => setSummary(event.target.value)} />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className={secondaryButton} disabled={publish.isPending} onClick={onClose}>Cancel</button>
            <button type="submit" className={primaryButton} disabled={publish.isPending}>
              <BusyLabel busy={publish.isPending} busyText="Publishing...">Publish</BusyLabel>
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
};
