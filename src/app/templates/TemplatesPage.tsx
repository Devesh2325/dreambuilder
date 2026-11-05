import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { MODULE_LIST, moduleNoun, MODULES } from '../../core/modules';
import { PROJECT_TYPES, ProjectType } from '../../core/schema';
import { blankProject, TEAM_TEMPLATE_PREFIX, TEMPLATES } from '../../templates';
import { teamSection } from '../../templates/library';
import { SECTION_LIBRARY } from '../../templates/sections';
import { ROUTES } from '../routes';
import { useServices } from '../session';
import { BusyIcon, BusyLabel, cardClass, CardsSkeleton, EmptyState, ErrorNote, errorMessage, inputClass, LoadingNote, PageHeader, primaryButton, secondaryButton } from '../shared/ui';
import { useWorkspace } from '../workspace';
import { useTeamTemplates } from './CreatePage';
import { LiveThumbnail } from './LiveThumbnail';

const NewTemplate: React.FC = () => {
  const { projects } = useServices();
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<ProjectType>('page');
  const [name, setName] = useState('');
  const create = useMutation({
    mutationFn: () => projects.create(blankProject(type, workspace!.organizationId, name.trim() || `New ${moduleNoun(type)} template`)),
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(ROUTES.studio(id), { state: { buildingTemplate: true } });
    },
  });

  if (!isOpen) {
    return (
      <button type="button" className={primaryButton} onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4" aria-hidden="true" />
        Create template
      </button>
    );
  }
  return (
    <form className="flex flex-wrap items-center gap-2" onSubmit={(event) => {
      event.preventDefault();
      create.mutate();
    }}>
      <input aria-label="Template name" autoFocus maxLength={120} placeholder="Template name" className={`${inputClass} !w-52`} value={name} onChange={(event) => setName(event.target.value)} />
      <select aria-label="Template type" className={`${inputClass} !w-auto`} value={type} onChange={(event) => setType(event.target.value as ProjectType)}>
        {PROJECT_TYPES.map((value) => <option key={value} value={value}>{MODULES[value].label}</option>)}
      </select>
      <button type="submit" className={primaryButton} disabled={create.isPending}><BusyLabel busy={create.isPending} busyText="Creating...">Start building</BusyLabel></button>
      <button type="button" className={secondaryButton} disabled={create.isPending} onClick={() => setIsOpen(false)}>Cancel</button>
      {create.isError && <ErrorNote message={errorMessage(create.error)} />}
    </form>
  );
};

type Tab = 'all' | 'team' | 'sections';

/** Everything people can start from: built-in templates, and what the team has saved. */
export const TemplatesPage: React.FC = () => {
  const { library } = useServices();
  const { workspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const organizationId = workspace?.organizationId;
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<ProjectType | null>(null);
  const team = useTeamTemplates();
  const sections = useQuery({
    queryKey: ['library', organizationId, 'section'],
    queryFn: () => library.list(organizationId!, 'section'),
    enabled: Boolean(organizationId),
  });
  const remove = useMutation({
    mutationFn: (id: string) => library.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['library'] }),
  });
  const canEdit = can('edit:project');

  const term = search.trim().toLowerCase();
  const list = useMemo(() => TEMPLATES.filter((template) => {
    if (type && template.type !== type) return false;
    if (!term) return true;
    return [template.title, template.description, template.category ?? '', ...template.tags, MODULES[template.type].label].join(' ').toLowerCase().includes(term);
  }), [type, term]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: `All templates (${TEMPLATES.length})` },
    { id: 'team', label: `Team templates (${team.templates.length})` },
    { id: 'sections', label: `Sections (${SECTION_LIBRARY.length + (sections.data?.length ?? 0)})` },
  ];

  const deleteButton = (id: string, name: string) => canEdit && (
    <button
      type="button"
      aria-label={`Delete ${name}`}
      title="Delete"
      disabled={remove.isPending}
      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
      onClick={() => {
        if (window.confirm(`Delete "${name}" from the library? Projects already made from it won't change.`)) remove.mutate(id);
      }}
    >
      <BusyIcon busy={remove.isPending && remove.variables === id}><Trash2 className="w-4 h-4" /></BusyIcon>
    </button>
  );

  return (
    <>
      <PageHeader
        title="Template library"
        subtitle="Start a project from a template, or build your own for the whole team to reuse."
        actions={can('create:project') && <NewTemplate />}
      />
      <ErrorNote message={remove.isError ? errorMessage(remove.error) : null} />

      <div role="tablist" aria-label="Library" className="flex gap-5 mb-5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {tabs.map((item) => (
          <button key={item.id} role="tab" type="button" aria-selected={tab === item.id} onClick={() => setTab(item.id)}
            className={`pb-2.5 -mb-px whitespace-nowrap text-sm font-medium border-b-2 transition-colors ${tab === item.id ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'all' && (
        <>
          <div className="flex flex-col gap-3 mb-6">
            <input type="search" aria-label="Search templates" placeholder="Search templates..." className={`${inputClass} max-w-sm`} value={search} onChange={(event) => setSearch(event.target.value)} />
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
              <button type="button" aria-pressed={!type} onClick={() => setType(null)} className={`px-3 py-1 text-xs font-semibold rounded-full ${!type ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>All</button>
              {MODULE_LIST.map((m) => (
                <button key={m.type} type="button" aria-pressed={type === m.type} onClick={() => setType(m.type)} className={`px-3 py-1 text-xs font-semibold rounded-full ${type === m.type ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>{m.plural}</button>
              ))}
            </div>
          </div>
          {list.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No templates match your search.</p>}
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {list.map((template) => (
              <li key={template.id}>
                <Link to={ROUTES.newFromTemplate(template.id)} className={`${cardClass} block overflow-hidden hover:border-indigo-400 transition-colors`}>
                  <LiveThumbnail template={template} className="h-48" />
                  <div className="p-4">
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{MODULES[template.type].label}{template.category ? `  ·  ${template.category}` : ''}</p>
                    <h2 className="mt-0.5 font-semibold">{template.title}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{template.description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === 'team' && (
        <>
          {team.isLoading && <CardsSkeleton count={3} />}
          {team.isError && <ErrorNote message="We couldn't load your team's templates." />}
          {team.isSuccess && team.templates.length === 0 && (
            <EmptyState title="No team templates yet" icon="LayoutTemplate">
              Click <strong>Create template</strong>, build it from sections in the editor, then choose <strong>Save as template</strong>. Any project can be saved this way too.
            </EmptyState>
          )}
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {team.templates.map((template) => (
              <li key={template.id} className={`${cardClass} overflow-hidden`}>
                <LiveThumbnail template={template} className="h-48" />
                <div className="p-4">
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{MODULES[template.type].label}{template.category ? `  ·  ${template.category}` : ''}</p>
                  <h2 className="mt-0.5 font-semibold">{template.title}</h2>
                  {template.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{template.description}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <Link to={ROUTES.newFromTemplate(template.id)} className={`${secondaryButton} !py-1.5`}>Use template</Link>
                    {deleteButton(template.id.slice(TEAM_TEMPLATE_PREFIX.length), template.title)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === 'sections' && (
        <div className="space-y-6">
          <section aria-labelledby="team-sections" className={`${cardClass} p-5`}>
            <h2 id="team-sections" className="font-semibold">Saved by your team</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Select any block in the editor, open its Advanced tab and choose Save to team library.</p>
            {sections.isLoading && <LoadingNote />}
            {sections.isError && <ErrorNote message="We couldn't load your team's sections." />}
            {sections.isSuccess && sections.data.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Nothing saved yet.</p>}
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {sections.data?.filter((item) => teamSection(item)).map((item) => (
                <li key={item.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium truncate">{item.name}</span>
                  {deleteButton(item.id, item.name)}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="built-in-sections" className={`${cardClass} p-5`}>
            <h2 id="built-in-sections" className="font-semibold mb-1">Built in</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Available in every website and page, from Add in the editor, under Sections.</p>
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {SECTION_LIBRARY.map((section) => (
                <li key={section.id} className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm">
                  <span className="block font-medium">{section.title}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{section.category}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
};
