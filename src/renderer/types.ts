import { ReactNode } from 'react';
import { Theme } from '../core/schema';
import { RenderNode, VariableValues } from '../core/variables';

export type RenderMode = 'edit' | 'preview' | 'live';

export interface NavLink {
  label: string;
  href: string;
  current?: boolean;
}

export type FormSubmitResult = { ok: true } | { ok: false; error: string };

/** What blocks can ask of whoever is hosting them. All optional except mode. */
export interface RenderContext {
  mode: RenderMode;
  /** Pages of the website, for navigation blocks. */
  navLinks?: NavLink[];
  /** Internal link handling, so a site's pages navigate without a reload. */
  navigate?: (href: string) => void;
  submitForm?: (data: Record<string, unknown>) => Promise<FormSubmitResult>;
  /** Experience controls: next, prev, close, goto. */
  onAction?: (action: string, value?: unknown) => void;
  track?: (eventType: string, metadata?: Record<string, unknown>) => void;
  /** Editor only: of this parent's step children, draw only the given one. */
  visibleStep?: { parentKey: string; stepType: string; key: string };
  /** The block selected in the editor, so a carousel can show the slide it's on. */
  selectedId?: string;
  /** Draws another of the workspace's projects inside this page. */
  renderEmbed?: (projectId: string) => ReactNode;
  /** What a tour draws around its steps: progress and a close button. */
  tourChrome?: { label?: string; canClose?: boolean };
}

export interface BlockRenderProps {
  node: RenderNode;
  /** Must be spread on the block's outer element: class for styles, data attribute for the editor. */
  attrs: { className: string; 'data-fp-node': string; 'data-fp-key': string };
  children: ReactNode[];
  ctx: RenderContext;
}

export type FieldType = 'text' | 'longtext' | 'number' | 'boolean' | 'select' | 'color' | 'image' | 'url' | 'menu' | 'placement' | 'project';

export interface BlockField {
  key: string;
  label: string;
  type: FieldType;
  options?: { label: string; value: string }[];
  help?: string;
  /** A technical value typed by hand, so it offers no variables. */
  plain?: boolean;
  /** Only letters, numbers and hyphens are kept as it's typed. */
  slug?: boolean;
}

export interface BlockMeta {
  type: string;
  label: string;
  category: 'layout' | 'content' | 'form' | 'tour' | 'demo' | 'interactive';
  /** Lucide icon name, used by the editor only. */
  icon: string;
  isContainer?: boolean;
  /** Parent block type this one must be placed in. */
  parentType?: string;
  defaultProps: Record<string, unknown>;
  defaultStyles?: Record<string, string | number>;
  fields: BlockField[];
}

export interface ExperienceData {
  theme: Theme;
  variables: VariableValues;
}
