import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '../app/session';
import { BusyLabel, ErrorNote, errorMessage, inputClass, primaryButton, secondaryButton } from '../app/shared/ui';
import { useWorkspace } from '../app/workspace';
import { LibraryKind } from '../data/services';

interface SaveToLibraryProps {
  kind: LibraryKind;
  initialName: string;
  /** Called when saving, so it captures the latest edits. */
  buildDefinition: () => Promise<unknown>;
  onClose: () => void;
  /** More to decide before saving. */
  extra?: React.ReactNode;
}

/** Names a template or section, and adds it to the team's library. */
export const SaveToLibrary: React.FC<SaveToLibraryProps> = ({ kind, initialName, buildDefinition, onClose, extra }) => {
  const { library } = useServices();
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const isTemplate = kind === 'template';

  useEffect(() => {
    dialogRef.current?.showModal?.();
  }, []);

  const save = useMutation({
    mutationFn: async () => library.create(workspace!.organizationId, {
      kind,
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      definition: await buildDefinition(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      onClose();
    },
  });

  return (
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby="library-title" className="rounded-2xl p-6 w-full max-w-xl max-h-[calc(100vh-32px)] overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 backdrop:bg-slate-900/60">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <div>
          <h2 id="library-title" className="text-lg font-bold">Save as {isTemplate ? 'a team template' : 'a team section'}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isTemplate
              ? 'Everyone in your workspace can start new projects from it. Its variables and current values come along.'
              : 'Everyone in your workspace can add it from Add, under Sections.'}
          </p>
        </div>
        <ErrorNote message={save.isError ? errorMessage(save.error) : null} />
        <label className="block text-sm font-medium">Name
          <input required autoFocus maxLength={120} className={`${inputClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        {isTemplate && (
          <>
            <label className="block text-sm font-medium">Category (optional)
              <input maxLength={60} placeholder="Campaigns" className={`${inputClass} mt-1`} value={category} onChange={(event) => setCategory(event.target.value)} />
            </label>
            <label className="block text-sm font-medium">Description (optional)
              <input maxLength={500} className={`${inputClass} mt-1`} value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
          </>
        )}
        {extra}
        <div className="sticky -bottom-6 -mx-6 -mb-6 px-6 py-4 flex justify-end gap-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <button type="button" className={secondaryButton} onClick={onClose}>Cancel</button>
          <button type="submit" className={primaryButton} disabled={save.isPending}>
            <BusyLabel busy={save.isPending} busyText="Saving...">Save to library</BusyLabel>
          </button>
        </div>
      </form>
    </dialog>
  );
};
