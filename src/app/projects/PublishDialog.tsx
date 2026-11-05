import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleNoun } from '../../core/modules';
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
      onPublished();
    },
  });

  return (
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby="publish-title" className="rounded-2xl p-6 w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 backdrop:bg-slate-900/60">
      <form
        method="dialog"
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          publish.mutate();
        }}
      >
        <h2 id="publish-title" className="text-lg font-bold">Publish {moduleNoun(project.type)}</h2>
        <ErrorNote message={publish.isError ? errorMessage(publish.error) : null} />
        <label className="block text-sm font-medium">Web address
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
        </label>
        <label className="block text-sm font-medium">What changed? (optional)
          <input className={`${inputClass} mt-1`} maxLength={500} value={summary} onChange={(event) => setSummary(event.target.value)} />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className={secondaryButton} disabled={publish.isPending} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryButton} disabled={publish.isPending}><BusyLabel busy={publish.isPending} busyText="Publishing...">Publish</BusyLabel></button>
        </div>
      </form>
    </dialog>
  );
};
