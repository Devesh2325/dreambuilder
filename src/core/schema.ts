import { z } from 'zod';

export const PROJECT_TYPES = [
  'website', 'page', 'tour', 'form', 'demo', 'banner', 'menu', 'faq', 'popup',
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const DEVICES = ['desktop', 'tablet', 'mobile'] as const;
export type Device = (typeof DEVICES)[number];

// Node ids end up in CSS class names, so the character set is restricted.
const nodeId = z.string().regex(/^[A-Za-z0-9_-]+$/);
const styleMap = z.record(z.string(), z.union([z.string(), z.number()]));

export const nodeSchema = z.object({
  id: nodeId,
  type: z.string().min(1),
  name: z.string().optional(),
  props: z.record(z.string(), z.unknown()),
  styles: styleMap,
  responsive: z.object({ tablet: styleMap.optional(), mobile: styleMap.optional() }).optional(),
  children: z.array(nodeId),
  /** Renders this node once per item of a list variable. */
  repeat: z.object({ list: z.string().min(1), as: z.string().regex(/^[a-z][a-zA-Z0-9]*$/) }).optional(),
  /** Variable that must be truthy for the node to render. A leading ! negates it. */
  showIf: z.string().optional(),
  hidden: z.boolean().optional(),
  locked: z.boolean().optional(),
});
export type DocNode = z.infer<typeof nodeSchema>;

export const contentSchema = z.object({
  rootId: nodeId,
  nodes: z.record(z.string(), nodeSchema),
});
export type DocContent = z.infer<typeof contentSchema>;

export const themeSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  muted: z.string(),
  radius: z.string(),
  fontHeading: z.string(),
  fontBody: z.string(),
});
export type Theme = z.infer<typeof themeSchema>;

export const DEFAULT_THEME: Theme = {
  primary: '#4f46e5',
  secondary: '#0f172a',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#0f172a',
  muted: '#64748b',
  radius: '10px',
  fontHeading: 'Inter',
  fontBody: 'Inter',
};

export const urlRuleSchema = z.object({
  type: z.enum(['exact', 'contains', 'starts_with']),
  value: z.string(),
});

export const triggersSchema = z.object({
  urlRules: z.array(urlRuleSchema),
  delaySeconds: z.number().min(0),
  scrollPercent: z.number().min(0).max(100).optional(),
  exitIntent: z.boolean().optional(),
  frequency: z.enum(['always', 'once_per_session', 'once_per_visitor', 'until_completed']),
  devices: z.array(z.enum(DEVICES)).optional(),
});
export type Triggers = z.infer<typeof triggersSchema>;

export const DEFAULT_TRIGGERS: Triggers = { urlRules: [], delaySeconds: 0, frequency: 'once_per_visitor' };

export interface ProjectSettings {
  triggers?: Triggers;
  /** Banner position. */
  position?: 'top' | 'bottom';
  /** Web address that receives form submissions. */
  webhookUrl?: string;
}

export type DocumentKind = 'page' | 'global' | 'experience';

export interface SeoSettings {
  title?: string;
  description?: string;
}

/** Slugs of the shared sections that wrap every page of a website. */
export const GLOBAL_HEADER_SLUG = 'global-header';
export const GLOBAL_FOOTER_SLUG = 'global-footer';

/** Parses untrusted content, also checking the node graph is one valid tree. */
export function parseContent(value: unknown): DocContent {
  const content = contentSchema.parse(value);
  const problem = findTreeProblem(content);
  if (problem) throw new Error(`Invalid document: ${problem}`);
  return content;
}

export function findTreeProblem(content: DocContent): string | null {
  const seen = new Set<string>();
  const stack = [content.rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (seen.has(id)) return `node ${id} appears twice`;
    seen.add(id);
    const node = content.nodes[id];
    if (!node) return `node ${id} is missing`;
    if (node.id !== id) return `node key ${id} does not match its id ${node.id}`;
    stack.push(...node.children);
  }
  for (const id of Object.keys(content.nodes)) {
    if (!seen.has(id)) return `node ${id} is not connected to the tree`;
  }
  return null;
}
