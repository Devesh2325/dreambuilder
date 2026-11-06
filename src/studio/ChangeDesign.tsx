import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { LayoutTemplate, X } from 'lucide-react';
import { useServices } from '../app/session';
import { LazyPreview } from '../app/templates/LiveThumbnail';
import { useWorkspace } from '../app/workspace';
import { DocContent } from '../core/schema';
import { cloneSubtree } from '../core/tree';
import { teamSection } from '../templates/library';
import { SECTION_LIBRARY, sectionNodes, SectionNodes } from '../templates/sections';
import { restyleSection, RestyleResult } from './restyleSection';
import { useStudio } from './store';

interface Design {
  id: string;
  title: string;
  category: string;
  build: () => SectionNodes;
}

const BUILT_IN: Design[] = SECTION_LIBRARY
  .filter((section) => section.category !== 'Layout')
  .map((section) => ({ id: section.id, title: section.title, category: section.category, build: () => sectionNodes(section) }));

const pageOf = ({ rootId, nodes }: SectionNodes): DocContent => {
  const pageId = 'preview_root';
  return { rootId: pageId, nodes: { ...nodes, [pageId]: { id: pageId, type: 'Root', props: {}, styles: {}, children: [rootId] } } };
};

export interface DesignChange {
  sectionId: string;
  title: string;
  leftOut: string[];
  samplePictures: number;
}

/** The last change, shown while that section stays selected. */
export const useDesignChange = create<{ change: DesignChange | null; setChange: (change: DesignChange | null) => void }>((set) => ({
  change: null,
  setChange: (change) => set({ change }),
}));

const DesignCard: React.FC<{ design: Design; result: RestyleResult; onChoose: () => void }> = ({ design, result, onChoose }) => {
  const theme = useStudio((s) => s.draft?.theme);
  const variables = useStudio((s) => s.draft?.variables);
  const documents = useMemo(() => [{ kind: 'page' as const, title: design.title, slug: '', position: 0, content: pageOf(result) }], [design.title, result]);
  if (!theme || !variables) return null;
  return (
    <li>
      <button type="button" aria-label={`Use the ${design.title} design`} onClick={onChoose} className="group w-full text-left rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:shadow-lg transition-all">
        <LazyPreview boxClassName="h-44 pointer-events-none bg-white" scale={0.3} type="page" documents={documents} theme={theme} variables={variables} settings={{}} title={`${design.title} with your content`} />
        <span className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-sm font-medium truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{design.title}</span>
          {result.leftOut.length > 0 && <span className="shrink-0 text-[11px] text-amber-700 dark:text-amber-300">{result.leftOut.length} won't fit</span>}
        </span>
      </button>
    </li>
  );
};

/**
 * Shows every section design filled with this section's own words and pictures, so
 * choosing one changes only the look.
 */
export const ChangeDesignDialog: React.FC<{ sectionId: string; onClose: (change?: DesignChange) => void }> = ({ sectionId, onClose }) => {
  const { library } = useServices();
  const { workspace } = useWorkspace();
  const organizationId = workspace?.organizationId;
  const owner = useStudio.getState().documentOfNode(sectionId);
  const isFirst = owner?.content.nodes[owner.content.rootId]?.children[0] === sectionId;
  const [category, setCategory] = useState<string | null>(isFirst ? 'Hero' : null);
  const saved = useQuery({ queryKey: ['library', organizationId, 'section'], queryFn: () => library.list(organizationId!, 'section'), enabled: Boolean(organizationId) });

  const designs = useMemo<Design[]>(() => [
    ...(saved.data ?? []).flatMap((item) => {
      const section = teamSection(item);
      return section ? [{ id: item.id, title: item.name, category: 'Team', build: () => cloneSubtree(section.nodes, section.rootId) }] : [];
    }),
    ...BUILT_IN,
  ], [saved.data]);

  const results = useMemo(() => {
    if (!owner) return new Map<string, RestyleResult>();
    return new Map(designs.map((design) => [design.id, restyleSection(owner.content, sectionId, design.build())]));
  }, [designs, owner, sectionId]);

  const categories = [...new Set(designs.map((design) => design.category))];
  const visible = designs.filter((design) => !category || design.category === category);

  const choose = (design: Design) => {
    const result = results.get(design.id);
    if (!result || !useStudio.getState().replaceBlock(sectionId, result.rootId, result.nodes)) return;
    onClose({ sectionId: result.rootId, title: design.title, leftOut: result.leftOut, samplePictures: result.samplePictures });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="change-design-title" className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl" onKeyDown={(event) => event.key === 'Escape' && onClose()}>
        <div className="shrink-0 flex items-start justify-between gap-3 px-6 pt-5 pb-3">
          <div>
            <h2 id="change-design-title" className="flex items-center gap-2 text-lg font-semibold"><LayoutTemplate className="w-5 h-5 text-indigo-600" aria-hidden="true" />Change this section's design</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Each design below already shows your own words and pictures. Only the look changes, and variables stay linked. You can undo it.</p>
          </div>
          <button type="button" aria-label="Close" autoFocus className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => onClose()}><X className="w-4 h-4" /></button>
        </div>
        <div role="group" aria-label="Section type" className="shrink-0 flex flex-wrap gap-1 px-6 pb-3">
          {[null, ...categories].map((item) => (
            <button key={item ?? 'all'} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}
              className={`px-3 h-7 text-xs font-medium rounded-full transition-colors ${category === item ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
              {item ?? 'All'}
            </button>
          ))}
        </div>
        <ul className="flex-1 min-h-0 overflow-y-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-3 content-start px-6 pb-6">
          {visible.map((design) => {
            const result = results.get(design.id);
            return result ? <DesignCard key={design.id} design={design} result={result} onChoose={() => choose(design)} /> : null;
          })}
        </ul>
      </div>
    </div>
  );
};
