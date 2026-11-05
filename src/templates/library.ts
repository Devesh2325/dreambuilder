import { z } from 'zod';
import { contentSchema, DEFAULT_THEME, DocContent, DocNode, PROJECT_TYPES, ProjectSettings, ProjectType, Theme, themeSchema } from '../core/schema';
import { newNodeId } from '../core/tree';
import { expandContent, RenderNode, VariableDef, VariableValues } from '../core/variables';
import { LibraryItem } from '../data/services';
import { TemplateDefinition, TemplatePage } from './dsl';
import { TEAM_TEMPLATE_PREFIX } from './index';
import { SectionNodes } from './sections';

/**
 * A saved section works in any project, which won't have this project's variables. So it
 * stores what's drawn right now: values filled in, lists repeated out, hidden blocks left out.
 */
export function sectionFromNode(content: DocContent, nodeId: string, values: VariableValues): SectionNodes | null {
  const find = (node: RenderNode): RenderNode | null => {
    if (node.sourceId === nodeId) return node;
    for (const child of node.children) {
      const found = find(child);
      if (found) return found;
    }
    return null;
  };
  const tree = expandContent(content, values);
  const start = tree ? find(tree) : null;
  if (!start) return null;

  const nodes: Record<string, DocNode> = {};
  const add = (node: RenderNode): string => {
    const id = newNodeId();
    nodes[id] = {
      id,
      type: node.type,
      name: node.name,
      props: node.props,
      styles: node.styles,
      ...(node.responsive ? { responsive: node.responsive } : {}),
      children: node.children.map(add),
    };
    return id;
  };
  return { rootId: add(start), nodes };
}

export interface TeamTemplateDefinition {
  type: ProjectType;
  theme: Theme;
  variables: VariableDef[];
  settings: ProjectSettings;
  pages: TemplatePage[];
}

interface ProjectSnapshot {
  type: ProjectType;
  theme: Theme;
  variables: VariableValues;
  settings: ProjectSettings;
  defs: VariableDef[];
  documents: TemplatePage[];
}

/** A project as a template: tokens stay, and today's values become the starting values. */
export function templateFromProject({ type, theme, variables, settings, defs, documents }: ProjectSnapshot): TeamTemplateDefinition {
  // The webhook stays behind: projects made from this must not send answers to this project's address.
  const { triggers, position } = settings;
  return {
    type,
    theme,
    variables: defs.map((def) => ({ ...def, default: variables[def.key] ?? def.default })),
    settings: { ...(triggers ? { triggers } : {}), ...(position ? { position } : {}) },
    pages: documents.map(({ kind, title, slug, seo, content }) => ({ kind, title, slug, ...(seo ? { seo } : {}), content })),
  };
}

const variableSchema = z.object({
  key: z.string().regex(/^[a-zA-Z][\w.]*$/),
  label: z.string(),
  type: z.string(),
}).passthrough();

const teamTemplateSchema = z.object({
  type: z.enum(PROJECT_TYPES),
  theme: themeSchema,
  variables: z.array(variableSchema),
  settings: z.record(z.string(), z.unknown()),
  pages: z.array(z.object({
    kind: z.enum(['page', 'global', 'experience']),
    title: z.string(),
    slug: z.string(),
    seo: z.record(z.string(), z.unknown()).optional(),
    content: contentSchema,
  })).min(1),
});

/** Null when what's stored doesn't have the expected shape, so one bad row can't break the page. */
export function teamTemplate(item: LibraryItem): TemplateDefinition | null {
  const parsed = teamTemplateSchema.safeParse(item.definition);
  if (!parsed.success) return null;
  const definition = parsed.data as unknown as TeamTemplateDefinition;
  return {
    id: `${TEAM_TEMPLATE_PREFIX}${item.id}`,
    type: definition.type,
    version: 1,
    title: item.name,
    description: item.description,
    tags: ['team'],
    category: item.category || 'Team',
    variables: definition.variables,
    themes: [{ name: 'Saved theme', theme: definition.theme ?? DEFAULT_THEME }],
    settings: definition.settings,
    pages: definition.pages,
  };
}

const sectionSchema = z.object({ rootId: z.string(), nodes: z.record(z.string(), z.unknown()) });

export function teamSection(item: LibraryItem): SectionNodes | null {
  const parsed = sectionSchema.safeParse(item.definition);
  if (!parsed.success) return null;
  const content = contentSchema.safeParse({ rootId: parsed.data.rootId, nodes: parsed.data.nodes });
  return content.success ? (content.data as SectionNodes) : null;
}
