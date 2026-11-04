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
  isChecklistItemDone?: (id: string) => boolean;
  toggleChecklistItem?: (id: string) => void;
  checklistDone?: number;
  checklistTotal?: number;
  track?: (eventType: string, metadata?: Record<string, unknown>) => void;
}

export interface BlockRenderProps {
  node: RenderNode;
  /** Must be spread on the block's outer element: class for styles, data attribute for the editor. */
  attrs: { className: string; 'data-fp-node': string; 'data-fp-key': string };
  children: ReactNode[];
  ctx: RenderContext;
}

export type FieldType = 'text' | 'longtext' | 'number' | 'boolean' | 'select' | 'color' | 'image' | 'url';

export interface BlockField {
  key: string;
  label: string;
  type: FieldType;
  options?: { label: string; value: string }[];
  help?: string;
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
