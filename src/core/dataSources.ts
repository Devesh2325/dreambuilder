// Lists loaded from a customer's own API, shown with the same repeat used for list variables.
// Visitors' browsers load them directly, so nothing secret may go in the address.

import type { DataSource } from './schema';
import type { VariableDef } from './variables';

export type { DataSource };

export type DataRow = Record<string, string | number | boolean>;

/** Each source is a list variable under this prefix, such as data.products. */
export const dataKey = (key: string) => `data.${key}`;

export const MAX_ROWS = 200;

/** https only, except a developer's own machine while they build their API. */
export function isAllowedDataUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.username || url.password) return false;
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname));
  } catch {
    return false;
  }
}

/** Field names end up inside {{tokens}}, so they only use the characters tokens allow. */
export function fieldKey(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  return /^[a-zA-Z]/.test(clean) ? clean : `f_${clean || 'value'}`;
}

/** The name of a source, as a token-safe key. */
export const sourceKey = (label: string, taken: string[]) => {
  const base = fieldKey(label.toLowerCase()).toLowerCase();
  let key = base;
  for (let n = 2; taken.includes(key); n += 1) key = `${base}_${n}`;
  return key;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Paths to every list of items in a response, so people can choose one without knowing JSON. */
export function listsIn(body: unknown, prefix = '', depth = 0): string[] {
  if (Array.isArray(body)) return body.some(isRecord) ? [prefix] : [];
  if (!isRecord(body) || depth > 3) return [];
  return Object.entries(body).flatMap(([name, value]) => listsIn(value, prefix ? `${prefix}.${name}` : name, depth + 1));
}

export function pickList(body: unknown, path = ''): unknown[] | null {
  let value: unknown = body;
  for (const part of path.split('.').filter(Boolean)) value = isRecord(value) ? value[part] : undefined;
  return Array.isArray(value) ? value : null;
}

/** Plain values only: nested objects become name_part fields, and lists of words are joined. */
export function toRows(list: unknown[]): DataRow[] {
  const flatten = (value: unknown, prefix: string, row: DataRow, depth: number) => {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') row[fieldKey(prefix)] = value;
    else if (Array.isArray(value)) {
      const simple = value.filter((item) => ['string', 'number'].includes(typeof item));
      if (simple.length) row[fieldKey(prefix)] = simple.join(', ');
    } else if (isRecord(value) && depth < 2) {
      for (const [name, inner] of Object.entries(value)) flatten(inner, prefix ? `${prefix}_${name}` : name, row, depth + 1);
    }
  };
  return list.slice(0, MAX_ROWS).filter(isRecord).map((item) => {
    const row: DataRow = {};
    flatten(item, '', row, 0);
    return row;
  });
}

export const fieldsOf = (rows: DataRow[]) => [...new Set(rows.slice(0, 20).flatMap((row) => Object.keys(row)))];

export class DataSourceError extends Error {}

export async function fetchRows(source: Pick<DataSource, 'url' | 'path'>, signal?: AbortSignal): Promise<DataRow[]> {
  if (!isAllowedDataUrl(source.url)) throw new DataSourceError('The address must start with https://');
  let response: Response;
  try {
    // No cookies or saved logins are sent, so a visitor's own accounts are never involved.
    response = await fetch(source.url, { credentials: 'omit', headers: { Accept: 'application/json' }, signal });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    throw new DataSourceError("Couldn't reach that address. If it works in your browser, your API needs to allow other websites to read it, which developers call CORS.");
  }
  if (!response.ok) throw new DataSourceError(`That address answered with an error (${response.status}).`);
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new DataSourceError("That address didn't send JSON data.");
  }
  const list = pickList(body, source.path);
  if (!list) throw new DataSourceError(source.path ? `There's no list at "${source.path}" in that data.` : 'That data has no list of items. Choose where the list is.');
  return toRows(list);
}

/** A source as a list variable, so blocks can repeat over it and show its fields. */
export const dataSourceDefs = (sources: DataSource[] | undefined): VariableDef[] =>
  (sources ?? []).map((source) => ({
    key: dataKey(source.key),
    label: `${source.label} (from your API)`,
    type: 'list',
    group: 'Data from your API',
    itemFields: (source.fields ?? []).map((field) => ({ key: field, label: field, type: 'text' as const })),
  }));

/** Field names that probably hold a picture, a title, words or a link. */
export function guessFields(fields: string[], sample?: DataRow) {
  const find = (pattern: RegExp, test?: (value: unknown) => boolean) =>
    fields.find((field) => pattern.test(field) && (!test || !sample || test(sample[field])));
  const isUrl = (value: unknown) => typeof value === 'string' && /^https?:\/\//.test(value);
  const image = find(/image|img|photo|picture|thumbnail|avatar|logo/i, isUrl);
  const isLink = (value: unknown) => isUrl(value);
  const link = fields.find((field) => /^(url|link|href|permalink)$/i.test(field) && field !== image && (!sample || isLink(sample[field])))
    ?? fields.find((field) => /_url$|link/i.test(field) && field !== image && (!sample || isLink(sample[field])));
  return {
    image,
    title: find(/^(title|name|heading|label)$/i) ?? find(/title|name/i),
    text: find(/description|summary|excerpt|body|text|content|bio|role/i),
    link,
  };
}
