import { create } from 'zustand';
import { applyPatches, Draft, enablePatches, Patch, produceWithPatches } from 'immer';
import { Device, DocContent, DocNode, GLOBAL_FOOTER_SLUG, GLOBAL_HEADER_SLUG, ProjectSettings, SeoSettings, Theme } from '../core/schema';
import { MODULES } from '../core/modules';
import { duplicateNode, findParentId, insertSubtree, moveNode, newNodeId, removeNode } from '../core/tree';
import { VariableValues } from '../core/variables';
import { AppServices, DocumentRecord, ProjectRecord } from '../data/services';
import { BLOCK_META, canContain } from '../renderer/blockMeta';
import { pagesOf } from '../experience/SiteView';

enablePatches();

export interface ProjectDraft {
  title: string;
  variables: VariableValues;
  theme: Theme;
  settings: ProjectSettings;
}

type HistoryTarget = { kind: 'document'; id: string } | { kind: 'project' };

interface HistoryEntry {
  target: HistoryTarget;
  patches: Patch[];
  inverse: Patch[];
  /** Consecutive edits with the same key within COALESCE_MS form one undo step. */
  key?: string;
  at: number;
}

export type StudioTool = 'edit' | 'details' | 'add' | 'layers' | 'pages' | 'theme';
export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'conflict' | 'error';
export type DragPayload = { kind: 'block'; type: string } | { kind: 'node'; id: string };

const COALESCE_MS = 1000;
const AUTOSAVE_MS = 1200;
const HISTORY_LIMIT = 200;

interface StudioState {
  services: AppServices | null;
  project: ProjectRecord | null;
  draft: ProjectDraft | null;
  documents: DocumentRecord[];
  activeDocumentId: string | null;
  selectedId: string | null;
  hoveredId: string | null;
  device: Device;
  zoom: number;
  readOnly: boolean;
  past: HistoryEntry[];
  future: HistoryEntry[];
  dirtyDocuments: string[];
  isProjectDirty: boolean;
  status: SaveStatus;
  saveError: string | null;
  dragging: DragPayload | null;
  /** The one open side panel, or null when closed to give the canvas more room. */
  tool: StudioTool | null;
  setTool: (tool: StudioTool | null) => void;
  /** Stays the same across blocks and tools, so you can style one block after another. */
  inspectorTab: 'content' | 'style' | 'advanced';
  setInspectorTab: (tab: 'content' | 'style' | 'advanced') => void;

  load: (services: AppServices, project: ProjectRecord, documents: DocumentRecord[], readOnly: boolean) => void;
  reset: () => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setDevice: (device: Device) => void;
  setZoom: (zoom: number) => void;
  setDragging: (payload: DragPayload | null) => void;
  /**
   * For use in dragstart handlers. Chrome cancels a drag if the page changes while it
   * starts, and this state changes the overlay, so it waits one tick.
   */
  beginDrag: (payload: DragPayload, select?: string) => void;

  /** The documents drawn on the canvas right now. */
  visibleDocuments: () => DocumentRecord[];
  documentOfNode: (nodeId: string) => DocumentRecord | null;
  getNode: (nodeId: string) => DocNode | null;

  addBlock: (type: string, parentId?: string, index?: number) => string | null;
  moveBlock: (id: string, parentId: string, index: number) => boolean;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  updateProps: (id: string, patch: Record<string, unknown>) => void;
  /** An empty value removes the style. */
  updateStyle: (id: string, property: string, value: string | number) => void;
  updateNode: (id: string, patch: Partial<Pick<DocNode, 'name' | 'hidden' | 'locked' | 'showIf' | 'repeat'>>) => void;

  updateDraft: (change: (draft: Draft<ProjectDraft>) => void, key?: string) => void;

  setActiveDocument: (id: string) => void;
  /** Opens the new page, unless the caller is working elsewhere and asks it not to. */
  addPage: (title: string, slug: string, options?: { open?: boolean }) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  updatePage: (id: string, patch: { title?: string; slug?: string; seo?: SeoSettings }) => void;

  undo: () => void;
  redo: () => void;
  saveNow: () => Promise<void>;
  /** After a conflict: replace local work with what's on the server. */
  reloadFromServer: () => Promise<void>;
  /** After a conflict: save local work over what's on the server. */
  overwriteServer: () => Promise<void>;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let isSaving = false;
let saveAgain = false;

const clearSaveTimer = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
};

export function nodeFromBlock(type: string): DocNode | null {
  const meta = BLOCK_META[type];
  if (!meta) return null;
  return {
    id: newNodeId(),
    type,
    name: meta.label,
    props: structuredClone(meta.defaultProps),
    styles: structuredClone(meta.defaultStyles ?? {}),
    children: [],
  };
}

const initialState = {
  services: null,
  project: null,
  draft: null,
  documents: [],
  activeDocumentId: null,
  selectedId: null,
  hoveredId: null,
  device: 'desktop' as Device,
  zoom: 100,
  readOnly: false,
  past: [],
  future: [],
  dirtyDocuments: [],
  isProjectDirty: false,
  status: 'saved' as SaveStatus,
  saveError: null,
  dragging: null,
  tool: 'details' as StudioTool | null,
  inspectorTab: 'content' as const,
};

export const useStudio = create<StudioState>((set, get) => {
  const scheduleSave = () => {
    clearSaveTimer();
    saveTimer = setTimeout(() => void get().saveNow(), AUTOSAVE_MS);
  };

  const replaceDocument = (id: string, change: (doc: DocumentRecord) => DocumentRecord) =>
    set((state) => ({ documents: state.documents.map((doc) => (doc.id === id ? change(doc) : doc)) }));

  const markDocumentDirty = (id: string) => {
    set((state) => ({
      dirtyDocuments: state.dirtyDocuments.includes(id) ? state.dirtyDocuments : [...state.dirtyDocuments, id],
      status: state.status === 'conflict' ? 'conflict' : 'dirty',
    }));
    scheduleSave();
  };

  const pushHistory = (target: HistoryTarget, patches: Patch[], inverse: Patch[], key?: string) => {
    const now = Date.now();
    set((state) => {
      const last = state.past[state.past.length - 1];
      const sameTarget = last && last.target.kind === target.kind && (target.kind === 'project' || (last.target.kind === 'document' && last.target.id === target.id));
      if (key && last?.key === key && sameTarget && now - last.at < COALESCE_MS) {
        const merged: HistoryEntry = { ...last, patches: [...last.patches, ...patches], inverse: [...inverse, ...last.inverse], at: now };
        return { past: [...state.past.slice(0, -1), merged], future: [] };
      }
      return { past: [...state.past, { target, patches, inverse, key, at: now }].slice(-HISTORY_LIMIT), future: [] };
    });
  };

  const editDocument = (documentId: string, recipe: (content: DocContent) => void, key?: string) => {
    const state = get();
    if (state.readOnly) return;
    const doc = state.documents.find((d) => d.id === documentId);
    if (!doc) return;
    const [content, patches, inverse] = produceWithPatches(doc.content, recipe as (draft: Draft<DocContent>) => void);
    if (patches.length === 0) return;
    replaceDocument(documentId, (d) => ({ ...d, content }));
    pushHistory({ kind: 'document', id: documentId }, patches, inverse, key);
    markDocumentDirty(documentId);
  };

  const applyHistory = (entry: HistoryEntry, patches: Patch[]): boolean => {
    if (entry.target.kind === 'project') {
      const draft = get().draft;
      if (!draft) return false;
      set({ draft: applyPatches(draft, patches), isProjectDirty: true, status: 'dirty' });
      scheduleSave();
      return true;
    }
    const { id } = entry.target;
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return false;
    replaceDocument(id, (d) => ({ ...d, content: applyPatches(d.content, patches) }));
    markDocumentDirty(id);
    // Undo can remove the block that was selected.
    const { selectedId, getNode } = get();
    if (selectedId && !getNode(selectedId)) set({ selectedId: null });
    return true;
  };

  /** Finds a valid place for a new block, starting from the current selection. */
  const resolveInsertion = (type: string): { documentId: string; parentId: string; index?: number } | null => {
    const state = get();
    const active = state.documents.find((d) => d.id === state.activeDocumentId);
    if (!active) return null;

    if (state.selectedId) {
      const doc = state.documentOfNode(state.selectedId);
      const selected = doc?.content.nodes[state.selectedId];
      if (doc && selected) {
        if (canContain(selected.type, type)) return { documentId: doc.id, parentId: selected.id };
        // Walks up until a parent accepts it, placing it right after that branch.
        let childId = selected.id;
        let parentId = findParentId(doc.content, childId);
        while (parentId) {
          const parent = doc.content.nodes[parentId];
          if (canContain(parent.type, type)) {
            return { documentId: doc.id, parentId, index: parent.children.indexOf(childId) + 1 };
          }
          childId = parentId;
          parentId = findParentId(doc.content, parentId);
        }
      }
    }
    const root = active.content.nodes[active.content.rootId];
    return canContain(root.type, type) ? { documentId: active.id, parentId: root.id } : null;
  };

  return {
    ...initialState,

    load: (services, project, documents, readOnly) => {
      clearSaveTimer();
      const sorted = [...documents].sort((a, b) => a.position - b.position);
      const firstPage = pagesOf(sorted)[0] ?? sorted[0];
      set({
        ...initialState,
        services,
        project,
        readOnly,
        documents: sorted,
        activeDocumentId: firstPage?.id ?? null,
        draft: { title: project.title, variables: project.variables, theme: project.theme, settings: project.settings },
        // Templates start on their details form, and blank projects on blocks to add.
        // Small screens start closed, leaving the room to the canvas.
        tool: window.innerWidth < 1100 ? null : project.templateId ? 'details' : 'add',
      });
    },

    reset: () => {
      clearSaveTimer();
      set(initialState);
    },

    select: (id) => set({ selectedId: id }),
    hover: (id) => {
      if (get().hoveredId !== id) set({ hoveredId: id });
    },
    setDevice: (device) => set({ device }),
    setZoom: (zoom) => set({ zoom: Math.max(25, Math.min(200, zoom)) }),
    setDragging: (dragging) => set({ dragging }),
    beginDrag: (dragging, selectId) => {
      window.setTimeout(() => set(selectId ? { dragging, selectedId: selectId } : { dragging }), 0);
    },
    setTool: (tool) => set({ tool }),
    setInspectorTab: (inspectorTab) => set({ inspectorTab }),

    visibleDocuments: () => {
      const { documents, activeDocumentId } = get();
      const active = documents.find((d) => d.id === activeDocumentId);
      if (!active) return [];
      if (active.kind !== 'page') return [active];
      const find = (slug: string) => documents.filter((d) => d.slug === slug);
      return [...find(GLOBAL_HEADER_SLUG), active, ...find(GLOBAL_FOOTER_SLUG)];
    },

    documentOfNode: (nodeId) => get().visibleDocuments().find((doc) => doc.content.nodes[nodeId]) ?? null,

    getNode: (nodeId) => get().documentOfNode(nodeId)?.content.nodes[nodeId] ?? null,

    addBlock: (type, parentId, index) => {
      const node = nodeFromBlock(type);
      if (!node || get().readOnly) return null;

      let target: { documentId: string; parentId: string; index?: number } | null = null;
      if (parentId) {
        const doc = get().documentOfNode(parentId);
        if (doc && canContain(doc.content.nodes[parentId].type, type)) target = { documentId: doc.id, parentId, index };
      } else {
        target = resolveInsertion(type);
      }
      if (!target) return null;

      const { documentId, parentId: finalParent, index: finalIndex } = target;
      editDocument(documentId, (content) => insertSubtree(content, finalParent, node.id, { [node.id]: node }, finalIndex));
      set({ selectedId: node.id });
      return node.id;
    },

    moveBlock: (id, parentId, index) => {
      const doc = get().documentOfNode(id);
      if (!doc || !doc.content.nodes[parentId]) return false;
      const node = doc.content.nodes[id];
      if (node.locked || !canContain(doc.content.nodes[parentId].type, node.type)) return false;
      let moved = false;
      editDocument(doc.id, (content) => {
        moved = moveNode(content, id, parentId, index);
      });
      return moved;
    },

    removeBlock: (id) => {
      const doc = get().documentOfNode(id);
      if (!doc || id === doc.content.rootId || doc.content.nodes[id]?.locked) return;
      editDocument(doc.id, (content) => removeNode(content, id));
      if (get().selectedId === id) set({ selectedId: null });
    },

    duplicateBlock: (id) => {
      const doc = get().documentOfNode(id);
      if (!doc || id === doc.content.rootId) return;
      let copy: string | null = null;
      editDocument(doc.id, (content) => {
        copy = duplicateNode(content, id);
      });
      if (copy) set({ selectedId: copy });
    },

    updateProps: (id, patch) => {
      const doc = get().documentOfNode(id);
      if (!doc) return;
      editDocument(doc.id, (content) => {
        Object.assign(content.nodes[id].props, patch);
      }, `props:${id}:${Object.keys(patch).join(',')}`);
    },

    updateStyle: (id, property, value) => {
      const state = get();
      const doc = state.documentOfNode(id);
      if (!doc) return;
      const { device } = state;
      editDocument(doc.id, (content) => {
        const node = content.nodes[id];
        let styles: DocNode['styles'] = node.styles;
        if (device !== 'desktop') {
          node.responsive ??= {};
          node.responsive[device] ??= {};
          styles = node.responsive[device]!;
        }
        if (value === '') delete styles[property];
        else styles[property] = value;
      }, `style:${id}:${device}:${property}`);
    },

    updateNode: (id, patch) => {
      const doc = get().documentOfNode(id);
      if (!doc) return;
      editDocument(doc.id, (content) => {
        Object.assign(content.nodes[id], patch);
      // Only typing a name merges into one undo step. Each toggle is its own.
      }, 'name' in patch ? `node:${id}:name` : undefined);
    },

    updateDraft: (change, key) => {
      const { draft, readOnly } = get();
      if (!draft || readOnly) return;
      const [next, patches, inverse] = produceWithPatches(draft, change);
      if (patches.length === 0) return;
      set({ draft: next, isProjectDirty: true, status: get().status === 'conflict' ? 'conflict' : 'dirty' });
      pushHistory({ kind: 'project' }, patches, inverse, key);
      scheduleSave();
    },

    setActiveDocument: (id) => set({ activeDocumentId: id, selectedId: null, hoveredId: null }),

    addPage: async (title, slug, options = {}) => {
      const { services, project, documents } = get();
      if (!services || !project) throw new Error('Editor is not ready');
      await get().saveNow();
      const rootId = newNodeId('root');
      const sectionId = newNodeId();
      const containerId = newNodeId();
      const content: DocContent = {
        rootId,
        nodes: {
          [rootId]: { id: rootId, type: 'Root', props: {}, styles: {}, children: [sectionId] },
          [sectionId]: { id: sectionId, type: 'Section', name: 'Section', props: {}, styles: {}, children: [containerId] },
          [containerId]: { id: containerId, type: 'Container', name: 'Container', props: {}, styles: {}, children: [] },
        },
      };
      const position = Math.max(0, ...documents.map((d) => d.position)) + 1;
      const record = await services.projects.createDocument(project, { kind: 'page', title, slug, content }, position);
      if (options.open === false) set((state) => ({ documents: [...state.documents, record] }));
      else set((state) => ({ documents: [...state.documents, record], activeDocumentId: record.id, selectedId: null }));
    },

    deletePage: async (id) => {
      const { services, documents, activeDocumentId } = get();
      if (!services) return;
      if (pagesOf(documents).length <= 1) throw new Error('A website needs at least one page.');
      await services.projects.removeDocument(id);
      const remaining = documents.filter((d) => d.id !== id);
      set((state) => ({
        documents: remaining,
        activeDocumentId: activeDocumentId === id ? pagesOf(remaining)[0].id : activeDocumentId,
        selectedId: activeDocumentId === id ? null : state.selectedId,
        // Undo can't bring a deleted page back, so its history goes with it.
        past: state.past.filter((entry) => !(entry.target.kind === 'document' && entry.target.id === id)),
        future: state.future.filter((entry) => !(entry.target.kind === 'document' && entry.target.id === id)),
        dirtyDocuments: state.dirtyDocuments.filter((docId) => docId !== id),
      }));
    },

    updatePage: (id, patch) => {
      if (get().readOnly) return;
      replaceDocument(id, (doc) => ({ ...doc, ...patch }));
      markDocumentDirty(id);
    },

    undo: () => {
      const { past, future } = get();
      const entry = past[past.length - 1];
      if (!entry) return;
      set({ past: past.slice(0, -1), future: [entry, ...future] });
      applyHistory(entry, entry.inverse);
    },

    redo: () => {
      const { past, future } = get();
      const entry = future[0];
      if (!entry) return;
      set({ past: [...past, { ...entry, key: undefined }], future: future.slice(1) });
      applyHistory(entry, entry.patches);
    },

    saveNow: async () => {
      clearSaveTimer();
      if (isSaving) {
        // Run again afterwards, or edits made during this save would wait for no timer.
        saveAgain = true;
        return;
      }
      const start = get();
      if (!start.services || !start.project || start.status === 'conflict') return;
      if (start.dirtyDocuments.length === 0 && !start.isProjectDirty) {
        if (start.status !== 'saved') set({ status: 'saved', saveError: null });
        return;
      }

      isSaving = true;
      set({ status: 'saving', saveError: null });
      try {
        const { services, project } = start;

        if (start.isProjectDirty && start.draft) {
          const sent = start.draft;
          set({ isProjectDirty: false });
          try {
            await services.projects.update(project.id, sent);
          } catch (error) {
            set({ isProjectDirty: true });
            throw error;
          }
        }

        for (const id of start.dirtyDocuments) {
          const doc = get().documents.find((d) => d.id === id);
          if (!doc) continue;
          const result = await services.projects.saveDocument(
            id,
            { content: doc.content, title: doc.title, slug: doc.slug, seo: doc.seo },
            doc.revision,
          );
          if (result.status === 'conflict') {
            set({ status: 'conflict' });
            return;
          }
          const current = get().documents.find((d) => d.id === id);
          const changedMeanwhile = current !== doc && current?.revision === doc.revision &&
            (current.content !== doc.content || current.title !== doc.title || current.slug !== doc.slug || current.seo !== doc.seo);
          replaceDocument(id, (d) => ({ ...d, revision: result.revision, updatedAt: result.updatedAt }));
          if (!changedMeanwhile) {
            set((state) => ({ dirtyDocuments: state.dirtyDocuments.filter((docId) => docId !== id) }));
          }
        }

        const end = get();
        set({ status: end.dirtyDocuments.length > 0 || end.isProjectDirty ? 'dirty' : 'saved' });
        if (end.dirtyDocuments.length > 0 || end.isProjectDirty) scheduleSave();
      } catch (error) {
        set({ status: 'error', saveError: error instanceof Error ? error.message : 'Could not save your changes.' });
      } finally {
        isSaving = false;
        if (saveAgain) {
          saveAgain = false;
          void get().saveNow();
        }
      }
    },

    reloadFromServer: async () => {
      const { services, project, readOnly, activeDocumentId } = get();
      if (!services || !project) return;
      const [fresh, documents] = await Promise.all([services.projects.get(project.id), services.projects.listDocuments(project.id)]);
      if (!fresh) return;
      get().load(services, fresh, documents, readOnly);
      if (activeDocumentId && documents.some((d) => d.id === activeDocumentId)) set({ activeDocumentId });
    },

    overwriteServer: async () => {
      const { services, project, documents, dirtyDocuments } = get();
      if (!services || !project) return;
      const fresh = await services.projects.listDocuments(project.id);
      set({
        status: 'dirty',
        documents: documents.map((doc) => {
          const latest = fresh.find((f) => f.id === doc.id);
          return latest ? { ...doc, revision: latest.revision } : doc;
        }),
        dirtyDocuments,
      });
      await get().saveNow();
    },
  };
});

export const isExperienceProject = (project: ProjectRecord) => MODULES[project.type].delivery !== 'site';
