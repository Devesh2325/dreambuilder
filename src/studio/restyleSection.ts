import { DocContent, DocNode } from '../core/schema';
import { BLOCK_META } from '../renderer/blockMeta';

/** What carries over from one design to another: the words, links and pictures, never the look. */
const CONTENT_PROPS: Record<string, string[]> = {
  Heading: ['text'],
  Text: ['text'],
  Button: ['text', 'href', 'action'],
  PaymentButton: ['text', 'price', 'provider', 'url'],
  Image: ['src', 'alt'],
  Video: ['url', 'title'],
  Accordion: ['question', 'answer'],
};

type Nodes = Record<string, DocNode>;

export interface RestyleResult {
  rootId: string;
  nodes: Nodes;
  /** Content from the old design that this one has no place for. */
  leftOut: string[];
  /** Pictures from the new design that are kept because there was none to put there. */
  samplePictures: number;
}

/** Content blocks under `rootId`, top to bottom, leaving out the branch at `skip`. */
const contentBlocks = (nodes: Nodes, rootId: string, skip?: string): DocNode[] => {
  const found: DocNode[] = [];
  const walk = (id: string) => {
    const node = nodes[id];
    if (!node || id === skip) return;
    if (CONTENT_PROPS[node.type]) found.push(node);
    node.children.forEach(walk);
  };
  walk(rootId);
  return found;
};

const firstRepeated = (nodes: Nodes, rootId: string): DocNode | undefined => {
  const queue = [...(nodes[rootId]?.children ?? [])];
  while (queue.length) {
    const node = nodes[queue.shift()!];
    if (!node) continue;
    if (node.repeat) return node;
    queue.push(...node.children);
  }
  return undefined;
};

/** A row of alike containers, such as three cards: where a repeating list can go. */
const findGroup = (nodes: Nodes, rootId: string): DocNode | undefined => {
  const queue = [rootId];
  while (queue.length) {
    const node = nodes[queue.shift()!];
    if (!node) continue;
    const kids = node.children.map((id) => nodes[id]).filter(Boolean);
    if (kids.length >= 2 && kids.every((kid) => kid.type === kids[0].type && BLOCK_META[kid.type]?.isContainer)) return node;
    queue.push(...node.children);
  }
  return undefined;
};

const dropBranch = (nodes: Nodes, id: string) => {
  for (const child of nodes[id]?.children ?? []) dropBranch(nodes, child);
  delete nodes[id];
};

const detach = (nodes: Nodes, id: string) => {
  for (const node of Object.values(nodes)) node.children = node.children.filter((child) => child !== id);
  dropBranch(nodes, id);
};

const describe = (node: DocNode): string => {
  if (node.type === 'Image') return 'A picture';
  if (node.type === 'Video') return 'A video';
  // A variable shows as its name in brackets, as the editor shows it elsewhere.
  const words = String(node.props.text ?? node.props.question ?? '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, '[$1]').trim();
  const kind = BLOCK_META[node.type]?.label ?? node.type;
  return words ? `${kind}: ${words.length > 60 ? `${words.slice(0, 57)}...` : words}` : kind;
};

/**
 * Puts what one section says into another section's design. Each heading, text, button,
 * picture and so on goes to the next place of the same kind in the new design, so a title
 * stays a title. Variable tokens are copied as they are, so the content stays linked.
 */
export function restyleSection(old: DocContent, oldId: string, design: { rootId: string; nodes: Nodes }): RestyleResult {
  const nodes: Nodes = structuredClone(design.nodes);
  const { rootId } = design;
  const oldNodes = old.nodes;
  const leftOver: DocNode[] = [];
  const leftOut: string[] = [];
  const filled = new Set<string>();

  const fill = (from: DocNode[], to: DocNode[]) => {
    const waiting = new Map<string, DocNode[]>();
    for (const node of from) waiting.set(node.type, [...(waiting.get(node.type) ?? []), node]);
    for (const slot of to) {
      const source = waiting.get(slot.type)?.shift();
      if (!source) continue;
      for (const key of CONTENT_PROPS[slot.type]) {
        if (source.props[key] !== undefined) slot.props[key] = structuredClone(source.props[key]);
      }
      if (source.showIf) slot.showIf = source.showIf;
      if (source.hidden) slot.hidden = true;
      filled.add(slot.id);
    }
    for (const rest of waiting.values()) leftOver.push(...rest);
  };

  // A repeating list keeps repeating, in the new design's row of cards.
  const repeated = firstRepeated(oldNodes, oldId);
  const group = repeated ? findGroup(nodes, rootId) : undefined;
  let itemId: string | undefined;
  if (repeated && group) {
    [itemId] = group.children;
    for (const extra of group.children.slice(1)) dropBranch(nodes, extra);
    group.children = [itemId];
    nodes[itemId].repeat = structuredClone(repeated.repeat);
    fill(contentBlocks(oldNodes, repeated.id), contentBlocks(nodes, itemId));
  } else if (repeated) {
    leftOut.push(`${describe(repeated)} (a repeating list)`);
  }
  fill(contentBlocks(oldNodes, oldId, repeated?.id), contentBlocks(nodes, rootId, itemId));

  // Some designs show their photo as a background. A picture with nowhere else to go
  // belongs there, rather than the design's sample photo.
  for (const node of Object.values(nodes)) {
    const key = ['backgroundImage', 'background'].find((name) => String(node.styles[name] ?? '').includes('url('));
    if (!key) continue;
    const background = String(node.styles[key]);
    const index = leftOver.findIndex((item) => item.type === 'Image' && typeof item.props.src === 'string' && item.props.src);
    if (index < 0) break;
    const [picture] = leftOver.splice(index, 1);
    node.styles[key] = background.replace(/url\((['"]?)[^)'"]*\1\)/, `url("${String(picture.props.src)}")`);
  }
  leftOut.push(...leftOver.map(describe));

  // The design's own sample words would read as if they were the customer's, so they go.
  // Its pictures stay, since a layout built around a picture falls apart without one.
  let samplePictures = 0;
  for (const node of contentBlocks(nodes, rootId)) {
    if (filled.has(node.id)) continue;
    if (node.type === 'Image') samplePictures += 1;
    else detach(nodes, node.id);
  }

  // A card with nothing left in it would show as an empty box.
  const designContainers = new Set(Object.values(design.nodes).filter((node) => node.children.length > 0).map((node) => node.id));
  let removed = true;
  while (removed) {
    removed = false;
    for (const node of Object.values(nodes)) {
      if (node.id !== rootId && designContainers.has(node.id) && node.children.length === 0) {
        detach(nodes, node.id);
        removed = true;
      }
    }
  }

  // What belongs to the section itself, rather than its look.
  const oldRoot = oldNodes[oldId];
  const root = nodes[rootId];
  if (oldRoot?.props.anchor) root.props.anchor = oldRoot.props.anchor;
  if (oldRoot?.showIf) root.showIf = oldRoot.showIf;
  if (oldRoot?.hideOn) root.hideOn = [...oldRoot.hideOn];

  return { rootId, nodes, leftOut, samplePictures };
}

/** The section a block sits in: the page's own child that contains it. */
export function sectionOf(content: DocContent, nodeId: string): string | null {
  const page = content.nodes[content.rootId];
  for (const childId of page?.children ?? []) {
    const stack = [childId];
    while (stack.length) {
      const id = stack.pop()!;
      if (id === nodeId) return content.nodes[childId]?.type === 'Section' ? childId : null;
      stack.push(...(content.nodes[id]?.children ?? []));
    }
  }
  return null;
}
