import { DocContent, DocNode, DocumentKind, ProjectSettings, ProjectType, SeoSettings, Theme } from '../core/schema';
import { VariableDef } from '../core/variables';
import { BLOCK_META } from '../renderer/blockMeta';

export interface TemplatePage {
  kind: DocumentKind;
  title: string;
  slug: string;
  seo?: SeoSettings;
  content: DocContent;
}

export interface ThemePreset {
  name: string;
  theme: Theme;
}

export interface TemplateDefinition {
  id: string;
  type: ProjectType;
  /** Stored with projects so templates can change later without confusing older projects. */
  version: number;
  title: string;
  description: string;
  tags: string[];
  /** The variable used to title the project. */
  titleVariable?: string;
  variables: VariableDef[];
  themes: ThemePreset[];
  settings?: ProjectSettings;
  pages: TemplatePage[];
}

/** A template tree before it gets ids. Authors write these with the el() helper. */
export interface El {
  type: string;
  name?: string;
  props?: Record<string, unknown>;
  styles?: DocNode['styles'];
  responsive?: DocNode['responsive'];
  repeat?: DocNode['repeat'];
  showIf?: string;
  children?: El[];
}

type ElOptions = Omit<El, 'type' | 'children'>;

export function el(type: string, options: ElOptions = {}, children: El[] = []): El {
  return { type, ...options, children };
}

// Shorthand for the most common blocks in templates.
export const heading = (text: string, level = 'h2', styles?: DocNode['styles']) => el('Heading', { props: { text, level }, styles });
export const text = (value: string, styles?: DocNode['styles'], showIf?: string) => el('Text', { props: { text: value }, styles, showIf });
export const button = (label: string, href = '#', variant = 'primary', showIf?: string) =>
  el('Button', { props: { text: label, href, variant, action: 'link' }, showIf });
export const actionButton = (label: string, action: string, variant = 'primary') =>
  el('Button', { props: { text: label, action, variant, href: '#' } });
export const image = (src: string, alt = '', styles?: DocNode['styles'], showIf?: string) => el('Image', { props: { src, alt }, styles, showIf });
export const section = (children: El[], styles?: DocNode['styles'], options: ElOptions = {}) =>
  el('Section', { styles, ...options }, [el('Container', { styles: { display: 'flex', flexDirection: 'column', gap: '24px' } }, children)]);

/** Turns a template tree into a stored document. Ids are stable, so tests and diffs stay readable. */
export function buildContent(prefix: string, children: El[], rootStyles: DocNode['styles'] = {}): DocContent {
  const nodes: DocContent['nodes'] = {};
  let counter = 0;

  const add = (element: El): string => {
    counter += 1;
    const id = `${prefix}${counter}`;
    const meta = BLOCK_META[element.type];
    if (!meta) throw new Error(`Template uses unknown block ${element.type}`);
    nodes[id] = {
      id,
      type: element.type,
      name: element.name,
      props: { ...structuredClone(meta.defaultProps), ...element.props },
      styles: element.styles ?? {},
      children: [],
    };
    if (element.responsive) nodes[id].responsive = element.responsive;
    if (element.repeat) nodes[id].repeat = element.repeat;
    if (element.showIf) nodes[id].showIf = element.showIf;
    nodes[id].children = (element.children ?? []).map(add);
    return id;
  };

  const rootId = add(el('Root', { styles: rootStyles }, children));
  return { rootId, nodes };
}

export const experience = (children: El[], rootStyles?: DocNode['styles']): TemplatePage => ({
  kind: 'experience',
  title: 'Main',
  slug: '',
  content: buildContent('n', children, rootStyles),
});
