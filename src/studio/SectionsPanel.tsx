import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DocContent, ProjectType } from '../core/schema';
import { cloneSubtree } from '../core/tree';
import { useServices } from '../app/session';
import { Skeleton } from '../app/shared/ui';
import { LazyPreview } from '../app/templates/LiveThumbnail';
import { useWorkspace } from '../app/workspace';
import { teamSection } from '../templates/library';
import { SECTION_LIBRARY, sectionNodes, SectionNodes } from '../templates/sections';
import { useStudio } from './store';

interface Entry {
  id: string;
  title: string;
  category: string;
  /** Fresh ids each time, so one section can be added many times. */
  build: () => SectionNodes;
}

const asContent = ({ rootId, nodes }: SectionNodes): DocContent => {
  const pageId = 'preview_root';
  return { rootId: pageId, nodes: { ...nodes, [pageId]: { id: pageId, type: 'Root', props: {}, styles: {}, children: [rootId] } } };
};

const SectionCard: React.FC<{ entry: Entry; onMessage: (text: string | null) => void }> = ({ entry, onMessage }) => {
  const readOnly = useStudio((s) => s.readOnly);
  const theme = useStudio((s) => s.draft?.theme);
  const { addNodes, setDragging } = useStudio.getState();
  const documents = useMemo(() => [{ kind: 'page' as const, title: entry.title, slug: '', position: 0, content: asContent(entry.build()) }], [entry]);
  if (!theme) return null;

  const add = () => {
    if (readOnly) return;
    const { rootId, nodes } = entry.build();
    const added = addNodes(rootId, nodes);
    onMessage(added ? null : `${entry.title} can't go there. Select a different block first.`);
  };

  return (
    <div
      role="button"
      tabIndex={readOnly ? -1 : 0}
      aria-disabled={readOnly}
      aria-label={`Add ${entry.title}`}
      draggable={!readOnly}
      onDragStart={(event) => {
        const { rootId, nodes } = entry.build();
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('text/plain', entry.title);
        useStudio.getState().beginDrag({ kind: 'nodes', rootId, nodes });
      }}
      onDragEnd={() => setDragging(null)}
      onClick={add}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          add();
        }
      }}
      className="group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:shadow-md cursor-grab active:cursor-grabbing transition-all"
    >
      <LazyPreview boxClassName="h-28 pointer-events-none" scale={0.24} type="page" documents={documents} theme={theme} variables={{}} settings={{}} title={`${entry.title} preview`} />
      <p className="px-2.5 py-2 text-[13px] font-medium border-t border-slate-100 dark:border-slate-800 truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{entry.title}</p>
    </div>
  );
};

const BUILT_IN: Entry[] = SECTION_LIBRARY.map((section) => ({ id: section.id, title: section.title, category: section.category, build: () => sectionNodes(section) }));

/** Modules whose pages are made of sections. */
export const usesSections = (type: ProjectType | undefined) => type === 'website' || type === 'page';

/** Ready-made sections: the built-in ones and those the team has saved. */
export const SectionsPanel: React.FC = () => {
  const { library } = useServices();
  const { workspace } = useWorkspace();
  const organizationId = workspace?.organizationId;
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const saved = useQuery({
    queryKey: ['library', organizationId, 'section'],
    queryFn: () => library.list(organizationId!, 'section'),
    enabled: Boolean(organizationId),
  });

  const team = useMemo<Entry[]>(() => (saved.data ?? []).flatMap((item) => {
    const section = teamSection(item);
    return section ? [{ id: item.id, title: item.name, category: 'Team', build: () => cloneSubtree(section.nodes, section.rootId) }] : [];
  }), [saved.data]);

  const entries = [...team, ...BUILT_IN];
  const categories = [...new Set(entries.map((entry) => entry.category))];
  const visible = entries.filter((entry) => !category || entry.category === category);

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-slate-500 dark:text-slate-400">Drag onto the canvas, or click to add below the selected section.</p>
      {message && <p role="alert" className="text-[13px] text-rose-600 dark:text-rose-400">{message}</p>}
      <div role="group" aria-label="Section type" className="flex flex-wrap gap-1">
        {[null, ...categories].map((item) => (
          <button key={item ?? 'all'} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}
            className={`px-2.5 h-7 text-xs font-medium rounded-full transition-colors ${category === item ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
            {item ?? 'All'}
          </button>
        ))}
      </div>
      {saved.isLoading && <Skeleton className="h-36 rounded-xl" />}
      <div className="space-y-3">
        {visible.map((entry) => <SectionCard key={entry.id} entry={entry} onMessage={setMessage} />)}
      </div>
    </div>
  );
};
