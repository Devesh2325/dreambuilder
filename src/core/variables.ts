import { z } from 'zod';
import { DocContent, DocNode } from './schema';

export type VariableType =
  | 'text' | 'longtext' | 'color' | 'image' | 'url' | 'email' | 'number' | 'boolean' | 'select' | 'list';

export interface VariableDef {
  key: string;
  label: string;
  type: VariableType;
  /** Form section this field appears in. */
  group?: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  default?: unknown;
  options?: { label: string; value: string }[];
  /** For lists: the fields of each item. */
  itemFields?: VariableDef[];
  /** For lists. */
  minItems?: number;
  maxItems?: number;
}

export type VariableValues = Record<string, unknown>;

const TOKEN = /\{\{\s*([a-zA-Z][\w.]*)\s*\}\}/g;
const WHOLE_TOKEN = /^\{\{\s*([a-zA-Z][\w.]*)\s*\}\}$/;

export function hasToken(value: unknown): boolean {
  return typeof value === 'string' && /\{\{\s*[a-zA-Z][\w.]*\s*\}\}/.test(value);
}

export function resolveString(text: string, scope: VariableValues): unknown {
  // A string that is only a token keeps the value's type, so lists and booleans work.
  const whole = text.match(WHOLE_TOKEN);
  if (whole) return scope[whole[1]] ?? '';
  return text.replace(TOKEN, (_, key: string) => {
    const value = scope[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

export function resolveValue(value: unknown, scope: VariableValues): unknown {
  if (typeof value === 'string') return resolveString(value, scope);
  if (Array.isArray(value)) return value.map((item) => resolveValue(item, scope));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveValue(item, scope)]));
  }
  return value;
}

export function isTruthyValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim() !== '' && value !== 'false';
  return Boolean(value);
}

export function evaluateShowIf(expression: string | undefined, scope: VariableValues): boolean {
  if (!expression) return true;
  const negate = expression.startsWith('!');
  const result = isTruthyValue(scope[negate ? expression.slice(1) : expression]);
  return negate ? !result : result;
}

/** Variable keys a node refers to, for checking templates. Loop aliases are excluded by the caller. */
export function tokensIn(value: unknown, found = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    for (const match of value.matchAll(TOKEN)) found.add(match[1]);
  } else if (Array.isArray(value)) {
    value.forEach((item) => tokensIn(item, found));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => tokensIn(item, found));
  }
  return found;
}

export function defaultValues(defs: VariableDef[]): VariableValues {
  const values: VariableValues = {};
  for (const def of defs) {
    if (def.default !== undefined) values[def.key] = structuredClone(def.default);
    else if (def.type === 'list') values[def.key] = [];
    else if (def.type === 'boolean') values[def.key] = false;
    else values[def.key] = '';
  }
  return values;
}

function fieldSchema(def: VariableDef): z.ZodType {
  const text = (schema: z.ZodString) =>
    def.required ? schema : z.union([z.literal(''), schema]);

  switch (def.type) {
    case 'text':
    case 'longtext': {
      const schema = z.string();
      return def.required ? schema.trim().min(1, `${def.label} is required`) : schema;
    }
    case 'email':
      return text(z.string().trim().email(`${def.label} must be a valid email address`));
    case 'url':
    case 'image':
      return text(
        z.string().trim().refine((value) => isSafeUrl(value) && value !== '', `${def.label} must be a valid link`),
      );
    case 'color':
      return text(z.string().trim().regex(/^#[0-9a-fA-F]{3,8}$/, `${def.label} must be a hex color`));
    case 'number':
      return z.coerce.number({ error: `${def.label} must be a number` });
    case 'boolean':
      return z.boolean();
    case 'select': {
      const allowed = (def.options ?? []).map((option) => option.value);
      return z.string().refine((value) => allowed.includes(value) || (!def.required && value === ''), {
        message: `Choose a value for ${def.label}`,
      });
    }
    case 'list': {
      const item = z.object(Object.fromEntries((def.itemFields ?? []).map((field) => [field.key, fieldSchema(field)])));
      let schema = z.array(item);
      if (def.minItems !== undefined) schema = schema.min(def.minItems, `${def.label} needs at least ${def.minItems}`);
      if (def.maxItems !== undefined) schema = schema.max(def.maxItems, `${def.label} allows at most ${def.maxItems}`);
      return schema;
    }
  }
}

export interface ValidationResult {
  ok: boolean;
  values: VariableValues;
  /** Error messages by variable key. List errors use key.index.field. */
  errors: Record<string, string>;
}

export function validateValues(defs: VariableDef[], values: VariableValues): ValidationResult {
  const shape = Object.fromEntries(defs.map((def) => [def.key, fieldSchema(def)]));
  const result = z.object(shape).safeParse(values);
  if (result.success) return { ok: true, values: { ...values, ...result.data }, errors: {} };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    errors[key] ??= issue.message;
  }
  return { ok: false, values, errors };
}

const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/** Blocks javascript: and data: links. Relative links and anchors are allowed. */
export function isSafeUrl(url: string): boolean {
  // Browsers ignore control characters and spaces inside the scheme: "java\nscript:".
  // eslint-disable-next-line no-control-regex
  const cleaned = url.replace(/[\u0000- ]/g, '');
  const scheme = cleaned.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  return !scheme || SAFE_PROTOCOLS.includes(`${scheme[1].toLowerCase()}:`);
}

export function safeUrl(value: unknown, fallback = '#'): string {
  return typeof value === 'string' && value !== '' && isSafeUrl(value) ? value : fallback;
}

export interface RenderNode {
  /** Unique per rendered instance: repeated nodes get an index suffix. */
  key: string;
  sourceId: string;
  type: string;
  name?: string;
  props: Record<string, unknown>;
  styles: DocNode['styles'];
  responsive?: DocNode['responsive'];
  children: RenderNode[];
}

export interface ExpandOptions {
  /** The editor keeps hidden and conditional nodes visible so they can be selected. */
  includeHidden?: boolean;
}

/** Turns a stored document into the tree to draw: resolves tokens, repeats and conditions. */
export function expandContent(
  content: DocContent,
  values: VariableValues,
  options: ExpandOptions = {},
): RenderNode | null {
  const expandOne = (id: string, scope: VariableValues, suffix: string): RenderNode[] => {
    const node = content.nodes[id];
    if (!node) return [];
    if (node.hidden && !options.includeHidden) return [];
    if (!options.includeHidden && !evaluateShowIf(node.showIf, scope)) return [];

    const build = (nodeScope: VariableValues, instanceSuffix: string): RenderNode => ({
      key: `${id}${instanceSuffix}`,
      sourceId: id,
      type: node.type,
      name: node.name,
      props: resolveValue(node.props, nodeScope) as Record<string, unknown>,
      styles: resolveValue(node.styles, nodeScope) as DocNode['styles'],
      responsive: node.responsive
        ? (resolveValue(node.responsive, nodeScope) as DocNode['responsive'])
        : undefined,
      children: node.children.flatMap((child) => expandOne(child, nodeScope, instanceSuffix)),
    });

    if (node.repeat) {
      const list = scope[node.repeat.list];
      if (!Array.isArray(list)) return [];
      const as = node.repeat.as;
      return list.map((item, index) => {
        const itemScope: VariableValues = { ...scope, [`${as}.index`]: index + 1 };
        if (item && typeof item === 'object') {
          for (const [key, value] of Object.entries(item)) itemScope[`${as}.${key}`] = value;
        } else {
          itemScope[as] = item;
        }
        return build(itemScope, `${suffix}__${index}`);
      });
    }
    return [build(scope, suffix)];
  };

  return expandOne(content.rootId, values, '')[0] ?? null;
}
