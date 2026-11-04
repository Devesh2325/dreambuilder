// Separate from variables.ts so the embed script, which only renders, doesn't bundle zod.
import { z } from 'zod';
import { isSafeImageUrl, isSafeUrl, VariableDef, VariableValues } from './variables';

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
      return text(
        z.string().trim().refine((value) => isSafeUrl(value) && value !== '', `${def.label} must be a valid link`),
      );
    case 'image':
      return text(
        z.string().trim().refine((value) => isSafeImageUrl(value) && value !== '', `${def.label} must be a valid image link`),
      );    case 'color':
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
