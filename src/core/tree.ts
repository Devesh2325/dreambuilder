import { DocContent, DocNode } from './schema';

// These functions mutate the content they receive. The editor calls them on immer
// drafts, which turns each change into patches for undo and redo.

let idCounter = 0;

export function newNodeId(prefix = 'n'): string {
  idCounter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${random}`;
}

export function findParentId(content: DocContent, id: string): string | null {
  for (const node of Object.values(content.nodes)) {
    if (node.children.includes(id)) return node.id;
  }
  return null;
}

export function isDescendant(content: DocContent, ancestorId: string, id: string): boolean {
  const node = content.nodes[ancestorId];
  if (!node) return false;
  return node.children.some((child) => child === id || isDescendant(content, child, id));
}

export function getAncestors(content: DocContent, id: string): string[] {
  const path: string[] = [];
  let current = findParentId(content, id);
  while (current) {
    path.unshift(current);
    current = findParentId(content, current);
  }
  return path;
}

/** Adds a subtree. `nodes` must contain the new root and all its descendants. */
export function insertSubtree(
  content: DocContent,
  parentId: string,
  rootId: string,
  nodes: Record<string, DocNode>,
  index?: number,
): void {
  const parent = content.nodes[parentId];
  if (!parent) throw new Error(`Parent ${parentId} not found`);
  Object.assign(content.nodes, nodes);
  const at = index === undefined ? parent.children.length : clamp(index, 0, parent.children.length);
  parent.children.splice(at, 0, rootId);
}

export function removeNode(content: DocContent, id: string): void {
  if (id === content.rootId) return;
  const parentId = findParentId(content, id);
  if (parentId) {
    const siblings = content.nodes[parentId].children;
    siblings.splice(siblings.indexOf(id), 1);
  }
  const stack = [id];
  while (stack.length > 0) {
    const current = stack.pop()!;
    stack.push(...(content.nodes[current]?.children ?? []));
    delete content.nodes[current];
  }
}

/** Returns false, changing nothing, for moves that would break the tree. */
export function moveNode(content: DocContent, id: string, newParentId: string, index: number): boolean {
  if (id === content.rootId || id === newParentId) return false;
  if (!content.nodes[id] || !content.nodes[newParentId]) return false;
  if (isDescendant(content, id, newParentId)) return false;

  const oldParentId = findParentId(content, id);
  if (!oldParentId) return false;
  const oldSiblings = content.nodes[oldParentId].children;
  const oldIndex = oldSiblings.indexOf(id);
  oldSiblings.splice(oldIndex, 1);

  // Index is given as seen before removal, so a later sibling shifts down by one.
  const adjusted = oldParentId === newParentId && oldIndex < index ? index - 1 : index;
  const newSiblings = content.nodes[newParentId].children;
  newSiblings.splice(clamp(adjusted, 0, newSiblings.length), 0, id);
  return true;
}

/** Copies a subtree with fresh ids, ready for insertSubtree. */
export function cloneSubtree(
  source: Record<string, DocNode>,
  id: string,
): { rootId: string; nodes: Record<string, DocNode> } {
  const nodes: Record<string, DocNode> = {};
  const copy = (currentId: string): string => {
    const original = source[currentId];
    const copyId = newNodeId();
    nodes[copyId] = { ...structuredClone(original), id: copyId, children: original.children.map(copy) };
    return copyId;
  };
  return { rootId: copy(id), nodes };
}

export function duplicateNode(content: DocContent, id: string): string | null {
  const parentId = findParentId(content, id);
  if (!parentId) return null;
  // JSON copy because structuredClone cannot clone immer draft proxies.
  const source = JSON.parse(JSON.stringify(content.nodes)) as Record<string, DocNode>;
  const { rootId, nodes } = cloneSubtree(source, id);
  const index = content.nodes[parentId].children.indexOf(id) + 1;
  insertSubtree(content, parentId, rootId, nodes, index);
  return rootId;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
