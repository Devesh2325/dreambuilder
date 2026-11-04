import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import { MODULE_LIST, MODULES } from '../../core/modules';
import { ProjectType } from '../../core/schema';
import { blankProject, templatesFor } from '../../templates';
import { ROUTES } from '../routes';
import { useServices } from '../session';
import { Icon } from '../shared/Icon';
import { ErrorNote, errorMessage, inputClass, primaryButton } from '../shared/ui';
import { useWorkspace } from '../workspace';
import { LiveThumbnail } from './LiveThumbnail';

const Dialog: React.FC<{ initialType?: ProjectType; onClose: () => void }> = ({ initialType, onClose }) => {
  const { projects } = useServices();
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<ProjectType | null>(initialType ?? null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [blankName, setBlankName] = useState('');
  const module = type ? MODULES[type] : null;

  useEffect(() => {
    dialogRef.current?.showModal?.();
  }, []);

  const createBlank = useMutation({
    mutationFn: () => projects.create(blankProject(type!, workspace!.organizationId, blankName.trim() || `Untitled ${MODULES[type!].label.toLowerCase()}`)),
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-details'] });
      onClose();
      navigate(ROUTES.studio(id));
    },
  });

  const openTemplate = (id: string) => {
    onClose();
    navigate(ROUTES.newFromTemplate(id));
  };

  const term = search.trim().toLowerCase();
  const moduleTemplates = type ? templatesFor(type) : [];
  const categories = [...new Set(moduleTemplates.flatMap((t) => (t.category ? [t.category] : [])))];
  const templates = moduleTemplates.filter((t) =>
    (!category || t.category === category)
    && (!term || [t.title, t.description, t.category ?? '', ...t.tags].join(' ').toLowerCase().includes(term)));

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="create-title"
      className="w-[min(960px,calc(100vw-32px))] h-[min(720px,calc(100vh-32px))] p-0 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 backdrop:bg-slate-900/60 open:flex flex-col overflow-hidden"
    >
      <header className="shrink-0 flex items-center gap-2 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        {module && !initialType && (
          <button type="button" aria-label="Back to all types" className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setType(null)}>
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="min-w-0">
          <h2 id="create-title" className="font-bold">{module ? `New ${module.label.toLowerCase()}` : 'What do you want to create?'}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{module ? 'Start from a template, or from a blank canvas.' : 'Choose a type to see its templates.'}</p>
        </div>
        <button type="button" aria-label="Close" className="ml-auto p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
      </header>

      {!module ? (
        <ul className="flex-1 min-h-0 overflow-y-auto p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 content-start">
          {MODULE_LIST.map((m) => (
            <li key={m.type}>
              <button
                type="button"
                onClick={() => setType(m.type)}
                className="w-full h-full flex items-start gap-3 p-4 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors"
              >
                <span className="shrink-0 p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"><Icon name={m.icon} /></span>
                <span>
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className="block mt-0.5 text-xs text-slate-500 dark:text-slate-400">{m.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto p-5">
            <input
              type="search"
              aria-label="Search templates"
              placeholder="Search templates..."
              className={`${inputClass} max-w-xs mb-3`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {categories.length > 1 && (
              <div role="group" aria-label="Filter templates" className="flex flex-wrap gap-1.5 mb-4">
                {[null, ...categories].map((item) => (
                  <button
                    key={item ?? 'all'}
                    type="button"
                    aria-pressed={category === item}
                    onClick={() => setCategory(item)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${category === item ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                  >
                    {item ?? 'All'}
                  </button>
                ))}
              </div>
            )}
            {templates.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No templates match your search.</p>}
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <li key={template.id}>
                  <button
                    type="button"
                    onClick={() => openTemplate(template.id)}
                    className="group w-full text-left rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:shadow-md transition-all"
                  >
                    <LiveThumbnail template={template} className="h-40" />
                    <span className="block p-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                        {template.title}
                        <ArrowRight className="w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      </span>
                      <span className="block mt-0.5 text-xs text-slate-500 dark:text-slate-400">{template.description}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <form
            className="shrink-0 flex flex-wrap items-center gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40"
            onSubmit={(event) => {
              event.preventDefault();
              createBlank.mutate();
            }}
          >
            <label htmlFor="blank-name" className="text-sm font-medium">Or start blank:</label>
            <input
              id="blank-name"
              maxLength={200}
              placeholder={`Name your ${module.label.toLowerCase()}`}
              className={`${inputClass} !w-56`}
              value={blankName}
              onChange={(event) => setBlankName(event.target.value)}
            />
            <button type="submit" className={primaryButton} disabled={createBlank.isPending}>
              {createBlank.isPending ? 'Creating...' : 'Create blank'}
            </button>
            {createBlank.isError && <ErrorNote message={errorMessage(createBlank.error)} />}
          </form>
        </>
      )}
    </dialog>
  );
};

interface CreateButtonProps {
  /** Limits the dialog to one module's templates. */
  type?: ProjectType;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}

export const CreateButton: React.FC<CreateButtonProps> = ({ type, label, className = primaryButton, iconOnly }) => {
  const { can } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  if (!can('create:project')) return null;
  const text = label ?? (type ? `New ${MODULES[type].label.toLowerCase()}` : 'Create new');

  return (
    <>
      <button type="button" className={className} aria-label={iconOnly ? text : undefined} title={iconOnly ? text : undefined} onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4" aria-hidden="true" />
        {!iconOnly && text}
      </button>
      {isOpen && <Dialog initialType={type} onClose={() => setIsOpen(false)} />}
    </>
  );
};
