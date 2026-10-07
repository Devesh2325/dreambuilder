import { create } from 'zustand';
import { ComponentNode, DeviceMode, DocumentModel, StyleProperties, TargetSelectorConfig, NodeInteraction } from '../../types/document';
import { storage } from '../../services/storage';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';

export type LeftPanelTab = 'components' | 'blocks' | 'layers' | 'templates' | 'assets';
export type RightPanelTab = 'content' | 'design' | 'layout' | 'interaction' | 'conditions' | 'responsive';

interface EditorState {
  document: DocumentModel | null;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  activeTabLeft: LeftPanelTab;
  activeTabRight: RightPanelTab;
  deviceMode: DeviceMode;
  zoom: number;
  isPreviewMode: boolean;
  isAiOpen: boolean;
  isPublishModalOpen: boolean;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;

  // History stack for Undo / Redo
  history: DocumentModel[];
  historyIndex: number;

  // Clipboard for copy & paste
  clipboardNode: ComponentNode | null;

  // Target picker mode (for tours & tooltips)
  isTargetPicking: boolean;

  // Store actions
  loadDocument: (docId: string) => void;
  setDocument: (doc: DocumentModel, recordHistory?: boolean) => void;
  selectNode: (nodeId: string | null) => void;
  hoverNode: (nodeId: string | null) => void;
  setActiveTabLeft: (tab: LeftPanelTab) => void;
  setActiveTabRight: (tab: RightPanelTab) => void;
  setDeviceMode: (mode: DeviceMode) => void;
  setZoom: (zoom: number) => void;
  setIsPreviewMode: (isPreview: boolean) => void;
  setIsAiOpen: (isOpen: boolean) => void;
  setIsPublishModalOpen: (isOpen: boolean) => void;
  setIsTargetPicking: (isPicking: boolean) => void;

  // Tree manipulation commands
  insertNode: (parentId: string, node: ComponentNode, index?: number) => void;
  updateNodeProps: (nodeId: string, props: Record<string, any>) => void;
  updateNodeStyles: (nodeId: string, styles: Partial<StyleProperties>) => void;
  updateResponsiveStyles: (nodeId: string, mode: DeviceMode, styles: Partial<StyleProperties>) => void;
  updateNodeTarget: (nodeId: string, target: Partial<TargetSelectorConfig>) => void;
  updateNodeInteraction: (nodeId: string, interaction: Partial<NodeInteraction>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  moveNode: (nodeId: string, targetParentId: string, targetIndex: number) => void;
  copyNode: (nodeId: string) => void;
  pasteNode: (targetParentId?: string) => void;

  // Document Settings updates
  updateDocumentTitle: (title: string) => void;
  updateThemeVariables: (theme: Partial<DocumentModel['themeVariables']>) => void;
  updateExperienceSettings: (settings: Partial<DocumentModel['experienceSettings']>) => void;
  updateTriggerConditions: (triggers: Partial<DocumentModel['triggerConditions']>) => void;

  // History & Persistence
  undo: () => void;
  redo: () => void;
  save: () => void;
  publish: (summary?: string) => void;
}

// Helper functions for immutable tree operations
function findNode(root: ComponentNode, id: string): ComponentNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function findParent(root: ComponentNode, childId: string): ComponentNode | null {
  for (const child of root.children) {
    if (child.id === childId) return root;
    const found = findParent(child, childId);
    if (found) return found;
  }
  return null;
}

function mapTree(root: ComponentNode, transform: (node: ComponentNode) => ComponentNode): ComponentNode {
  const updated = transform(root);
  return {
    ...updated,
    children: updated.children.map(c => mapTree(c, transform)),
  };
}

function cloneNodeWithNewIds(node: ComponentNode): ComponentNode {
  return {
    ...JSON.parse(JSON.stringify(node)),
    id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    children: node.children.map(cloneNodeWithNewIds),
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  document: null,
  selectedNodeId: null,
  hoveredNodeId: null,
  activeTabLeft: 'components',
  activeTabRight: 'content',
  deviceMode: 'desktop',
  zoom: 100,
  isPreviewMode: false,
  isAiOpen: false,
  isPublishModalOpen: false,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  history: [],
  historyIndex: -1,
  clipboardNode: null,
  isTargetPicking: false,

  loadDocument: (docId: string) => {
    let doc = storage.getDocument(docId);
    if (!doc) {
      const proj = storage.getProjectById(docId);
      if (proj) {
        doc = storage.getDocument(proj.documentId);
      }
    }
    if (!doc) {
      const projects = storage.getProjects();
      if (projects.length > 0 && projects[0].documentId) {
        doc = storage.getDocument(projects[0].documentId);
      }
    }
    if (doc) {
      set({
        document: doc,
        selectedNodeId: doc.rootNode.id,
        history: [JSON.parse(JSON.stringify(doc))],
        historyIndex: 0,
        isDirty: false,
        lastSavedAt: doc.updatedAt,
      });
    }
  },

  setDocument: (doc: DocumentModel, recordHistory = true) => {
    const { history, historyIndex } = get();
    let newHistory = history;
    let newIndex = historyIndex;

    if (recordHistory) {
      const sliced = history.slice(0, historyIndex + 1);
      newHistory = [...sliced, JSON.parse(JSON.stringify(doc))];
      // Limit history to 50 states
      if (newHistory.length > 50) newHistory.shift();
      newIndex = newHistory.length - 1;
    }

    set({
      document: doc,
      history: newHistory,
      historyIndex: newIndex,
      isDirty: true,
    });
  },

  selectNode: (nodeId: string | null) => set({ selectedNodeId: nodeId }),
  hoverNode: (nodeId: string | null) => set({ hoveredNodeId: nodeId }),
  setActiveTabLeft: (tab: LeftPanelTab) => set({ activeTabLeft: tab }),
  setActiveTabRight: (tab: RightPanelTab) => set({ activeTabRight: tab }),
  setDeviceMode: (mode: DeviceMode) => set({ deviceMode: mode }),
  setZoom: (zoom: number) => set({ zoom: Math.max(25, Math.min(200, zoom)) }),
  setIsPreviewMode: (isPreview: boolean) => set({ isPreviewMode: isPreview, selectedNodeId: isPreview ? null : get().selectedNodeId }),
  setIsAiOpen: (isOpen: boolean) => set({ isAiOpen: isOpen }),
  setIsPublishModalOpen: (isOpen: boolean) => set({ isPublishModalOpen: isOpen }),
  setIsTargetPicking: (isPicking: boolean) => set({ isTargetPicking: isPicking }),

  insertNode: (parentId: string, node: ComponentNode, index?: number) => {
    const { document, setDocument } = get();
    if (!document) return;

    let targetParentId = parentId;
    let targetIndex = index;

    const targetNode = findNode(document.rootNode, parentId);
    if (targetNode) {
      const def = COMPONENT_REGISTRY[targetNode.type];
      if (def && !def.isContainer) {
        const parentOfTarget = findParent(document.rootNode, targetNode.id);
        if (parentOfTarget) {
          targetParentId = parentOfTarget.id;
          const idx = parentOfTarget.children.findIndex(c => c.id === targetNode.id);
          targetIndex = idx >= 0 ? idx + 1 : undefined;
        } else {
          targetParentId = document.rootNode.id;
        }
      }
    }

    const newRoot = mapTree(document.rootNode, current => {
      if (current.id === targetParentId) {
        const newChildren = [...current.children];
        if (typeof targetIndex === 'number' && targetIndex >= 0) {
          newChildren.splice(targetIndex, 0, node);
        } else {
          newChildren.push(node);
        }
        return { ...current, children: newChildren };
      }
      return current;
    });

    const updatedDoc: DocumentModel = {
      ...document,
      rootNode: newRoot,
      updatedAt: new Date().toISOString(),
    };
    setDocument(updatedDoc);
    set({ selectedNodeId: node.id });
  },

  updateNodeProps: (nodeId: string, props: Record<string, any>) => {
    const { document, setDocument } = get();
    if (!document) return;

    const newRoot = mapTree(document.rootNode, current => {
      if (current.id === nodeId) {
        return {
          ...current,
          props: { ...current.props, ...props },
        };
      }
      return current;
    });

    setDocument({ ...document, rootNode: newRoot });
  },

  updateNodeStyles: (nodeId: string, styles: Partial<StyleProperties>) => {
    const { document, setDocument } = get();
    if (!document) return;

    const newRoot = mapTree(document.rootNode, current => {
      if (current.id === nodeId) {
        return {
          ...current,
          styles: { ...current.styles, ...styles },
        };
      }
      return current;
    });

    setDocument({ ...document, rootNode: newRoot });
  },

  updateResponsiveStyles: (nodeId: string, mode: DeviceMode, styles: Partial<StyleProperties>) => {
    const { document, setDocument } = get();
    if (!document) return;

    const newRoot = mapTree(document.rootNode, current => {
      if (current.id === nodeId) {
        const currentResp = current.responsive || {};
        const deviceStyles = currentResp[mode] || {};
        return {
          ...current,
          responsive: {
            ...currentResp,
            [mode]: { ...deviceStyles, ...styles },
          },
        };
      }
      return current;
    });

    setDocument({ ...document, rootNode: newRoot });
  },

  updateNodeTarget: (nodeId: string, target: Partial<TargetSelectorConfig>) => {
    const { document, setDocument } = get();
    if (!document) return;

    const newRoot = mapTree(document.rootNode, current => {
      if (current.id === nodeId) {
        return {
          ...current,
          target: { ...(current.target || {}), ...target },
        };
      }
      return current;
    });

    setDocument({ ...document, rootNode: newRoot });
  },

  updateNodeInteraction: (nodeId: string, interaction: Partial<NodeInteraction>) => {
    const { document, setDocument } = get();
    if (!document) return;

    const newRoot = mapTree(document.rootNode, current => {
      if (current.id === nodeId) {
        return {
          ...current,
          interaction: { ...(current.interaction || {}), ...interaction },
        };
      }
      return current;
    });

    setDocument({ ...document, rootNode: newRoot });
  },

  deleteNode: (nodeId: string) => {
    const { document, setDocument } = get();
    if (!document || nodeId === document.rootNode.id) return; // Cannot delete root

    const removeRecursive = (parent: ComponentNode): ComponentNode => ({
      ...parent,
      children: parent.children
        .filter(child => child.id !== nodeId)
        .map(removeRecursive),
    });

    const newRoot = removeRecursive(document.rootNode);
    setDocument({ ...document, rootNode: newRoot });
    set({ selectedNodeId: document.rootNode.id });
  },

  duplicateNode: (nodeId: string) => {
    const { document, setDocument } = get();
    if (!document || nodeId === document.rootNode.id) return;

    const parent = findParent(document.rootNode, nodeId);
    const target = findNode(document.rootNode, nodeId);
    if (!parent || !target) return;

    const cloned = cloneNodeWithNewIds(target);
    cloned.name = `${cloned.name} (Copy)`;

    const targetIndex = parent.children.findIndex(c => c.id === nodeId);
    const newRoot = mapTree(document.rootNode, current => {
      if (current.id === parent.id) {
        const newChildren = [...current.children];
        newChildren.splice(targetIndex + 1, 0, cloned);
        return { ...current, children: newChildren };
      }
      return current;
    });

    setDocument({ ...document, rootNode: newRoot });
    set({ selectedNodeId: cloned.id });
  },

  copyNode: (nodeId: string) => {
    const { document } = get();
    if (!document) return;
    const target = findNode(document.rootNode, nodeId);
    if (target) {
      set({ clipboardNode: JSON.parse(JSON.stringify(target)) });
    }
  },

  pasteNode: (targetParentId?: string) => {
    const { document, clipboardNode, selectedNodeId, insertNode } = get();
    if (!document || !clipboardNode) return;

    const parentId = targetParentId || selectedNodeId || document.rootNode.id;
    const targetParent = findNode(document.rootNode, parentId);
    const validParentId = targetParent ? targetParent.id : document.rootNode.id;

    const newNode = cloneNodeWithNewIds(clipboardNode);
    newNode.name = `${newNode.name} (Pasted)`;
    insertNode(validParentId, newNode);
  },

  moveNode: (nodeId: string, targetParentId: string, targetIndex: number) => {
    const { document, setDocument } = get();
    if (!document || nodeId === document.rootNode.id) return;

    const nodeToMove = findNode(document.rootNode, nodeId);
    if (!nodeToMove) return;

    // 1. Remove node from original location
    const strippedRoot = mapTree(document.rootNode, current => ({
      ...current,
      children: current.children.filter(c => c.id !== nodeId),
    }));

    // 2. Insert into new parent
    const finalRoot = mapTree(strippedRoot, current => {
      if (current.id === targetParentId) {
        const newChildren = [...current.children];
        newChildren.splice(targetIndex, 0, nodeToMove);
        return { ...current, children: newChildren };
      }
      return current;
    });

    setDocument({ ...document, rootNode: finalRoot });
  },

  updateDocumentTitle: (title: string) => {
    const { document, setDocument } = get();
    if (!document) return;
    setDocument({ ...document, title });
  },

  updateThemeVariables: (theme) => {
    const { document, setDocument } = get();
    if (!document) return;
    setDocument({
      ...document,
      themeVariables: { ...document.themeVariables, ...theme },
    });
  },

  updateExperienceSettings: (settings) => {
    const { document, setDocument } = get();
    if (!document) return;
    setDocument({
      ...document,
      experienceSettings: { ...document.experienceSettings, ...settings },
    });
  },

  updateTriggerConditions: (triggers) => {
    const { document, setDocument } = get();
    if (!document) return;
    setDocument({
      ...document,
      triggerConditions: { ...document.triggerConditions, ...triggers },
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevDoc = history[historyIndex - 1];
      set({
        document: JSON.parse(JSON.stringify(prevDoc)),
        historyIndex: historyIndex - 1,
        isDirty: true,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextDoc = history[historyIndex + 1];
      set({
        document: JSON.parse(JSON.stringify(nextDoc)),
        historyIndex: historyIndex + 1,
        isDirty: true,
      });
    }
  },

  save: () => {
    const { document } = get();
    if (!document) return;
    set({ isSaving: true });
    try {
      const saved = storage.saveDocument(document);
      set({
        document: saved,
        isDirty: false,
        isSaving: false,
        lastSavedAt: saved.updatedAt,
      });
    } catch (e) {
      console.error('Failed to save document:', e);
      set({ isSaving: false });
    }
  },

  publish: (summary?: string) => {
    const { document, save } = get();
    if (!document) return;
    save();
    const result = storage.publishDocument(document.id, summary);
    set({
      document: result.document,
      isPublishModalOpen: false,
    });
  },
}));
