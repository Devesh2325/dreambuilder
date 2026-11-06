import React, { useState } from 'react';
import { Database, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { DataRow, dataKey, DataSource, fieldsOf, guessFields, isAllowedDataUrl, listsIn, sourceKey } from '../core/dataSources';
import { cloneSubtree } from '../core/tree';
import { loadRows, useDataSources } from '../experience/useDataSources';
import { buildContent, el, El } from '../templates/dsl';
import { fieldClass, labelClass } from './fields';
import { useStudio } from './store';

const smallButton = 'h-8 px-3 inline-flex items-center gap-1.5 text-[13px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 disabled:opacity-50';

/** A section of cards that repeats over the source, with its fields already in place. */
function cardsFor(source: DataSource, sample?: DataRow) {
  const fields = source.fields ?? [];
  const guess = guessFields(fields, sample);
  const token = (field: string) => `{{item.${field}}}`;
  const inside: El[] = [
    ...(guess.image ? [el('Image', { props: { src: token(guess.image), alt: guess.title ? token(guess.title) : '' }, styles: { height: '180px' } })] : []),
    el('Heading', { props: { text: token(guess.title ?? fields[0] ?? 'name'), level: 'h3' } }),
    ...(guess.text ? [el('Text', { props: { text: token(guess.text) }, styles: { color: 'var(--fp-muted)' } })] : []),
    ...(guess.link ? [el('Button', { props: { text: 'Learn more', href: token(guess.link), action: 'link', variant: 'secondary' } })] : []),
  ];
  const content = buildContent('d', [
    el('Section', { name: source.label }, [
      el('Container', { styles: { display: 'flex', flexDirection: 'column', gap: '24px' } }, [
        el('Heading', { props: { text: source.label, level: 'h2' } }),
        el('Grid', { styles: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' }, responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [
          el('Card', { name: `One ${source.label} item`, repeat: { list: dataKey(source.key), as: 'item' }, styles: { display: 'flex', flexDirection: 'column', gap: '12px' } }, inside),
        ]),
      ]),
    ]),
  ]);
  return cloneSubtree(content.nodes, content.nodes[content.rootId].children[0]);
}

const NewSource: React.FC<{ taken: string[]; onSave: (source: DataSource) => void; onCancel: () => void }> = ({ taken, onSave, onCancel }) => {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [paths, setPaths] = useState<string[] | null>(null);
  const [path, setPath] = useState('');
  const [rows, setRows] = useState<DataRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = async (chosenPath: string) => {
    setError(null);
    setRows(null);
    if (!isAllowedDataUrl(url.trim())) {
      setError('Enter the full address, starting with https://');
      return;
    }
    setIsLoading(true);
    try {
      // First the whole response, to find the lists in it, then the chosen one.
      const response = await fetch(url.trim(), { credentials: 'omit', headers: { Accept: 'application/json' } }).then((r) => r.json()).catch(() => null);
      const found = response === null ? [] : listsIn(response);
      setPaths(found);
      const usePath = found.includes(chosenPath) ? chosenPath : found[0] ?? '';
      setPath(usePath);
      setRows(await loadRows({ url: url.trim(), path: usePath }, true));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load that address.');
    } finally {
      setIsLoading(false);
    }
  };

  const fields = rows ? fieldsOf(rows) : [];
  return (
    <form className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3" onSubmit={(event) => {
      event.preventDefault();
      if (!rows || !label.trim()) return;
      onSave({ key: sourceKey(label, taken), label: label.trim(), url: url.trim(), path, fields });
    }}>
      <label className={labelClass}>What is it?
        <input autoFocus required maxLength={60} placeholder="Products" className={`${fieldClass} mt-1`} value={label} onChange={(event) => setLabel(event.target.value)} />
      </label>
      <label className={labelClass}>Address of your API
        <input required placeholder="https://api.yoursite.com/products" className={`${fieldClass} mt-1`} value={url} onChange={(event) => setUrl(event.target.value)} />
      </label>
      <button type="button" className={smallButton} disabled={isLoading || !url.trim()} onClick={() => void load(path)}>
        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
        {isLoading ? 'Loading...' : 'Load it'}
      </button>
      {error && <p role="alert" className="text-[13px] text-rose-600 dark:text-rose-400">{error}</p>}
      {paths && paths.length > 1 && (
        <label className={labelClass}>Which list?
          <select className={`${fieldClass} mt-1`} value={path} onChange={(event) => void load(event.target.value)}>
            {paths.map((item) => <option key={item} value={item}>{item || 'The whole response'}</option>)}
          </select>
        </label>
      )}
      {rows && (
        <div role="status" className="text-[13px] rounded-lg px-2.5 py-2 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
          Found {rows.length} {rows.length === 1 ? 'item' : 'items'}, each with: {fields.slice(0, 8).join(', ')}{fields.length > 8 ? ', and more' : ''}.
        </div>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">Each visitor's browser loads this address directly, so never use one that needs a secret key. Your API must allow other websites to read it, which developers call CORS. Up to 200 items are shown.</p>
      <div className="flex gap-2">
        <button type="submit" disabled={!rows || !label.trim()} className="flex-1 h-9 text-[13px] font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">Save</button>
        <button type="button" className="h-9 px-3 text-[13px] font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

/** Lists from the customer's own API, for websites and pages. */
export const DataSourcesPanel: React.FC = () => {
  const sources = useStudio((s) => s.draft?.settings.dataSources);
  const readOnly = useStudio((s) => s.readOnly);
  const { updateDraft, addNodes } = useStudio.getState();
  const data = useDataSources(sources);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const list = sources ?? [];

  return (
    <section aria-label="Data from your API" className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
      <div>
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white"><Database className="w-4 h-4 text-indigo-500" aria-hidden="true" />Data from your API</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Show a list that lives in your own system, such as products, posts or job openings. It stays up to date by itself.</p>
      </div>
      <ul className="space-y-2">
        {list.map((source) => {
          const rows = data.values[dataKey(source.key)];
          const error = data.errors[source.key];
          return (
            <li key={source.key} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 space-y-2 text-[13px]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{source.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={source.url}>{source.url}</p>
                </div>
                {!readOnly && (
                  <button type="button" aria-label={`Remove ${source.label}`} className="p-1 text-slate-400 hover:text-rose-600" onClick={() => {
                    if (window.confirm(`Stop loading ${source.label}? Blocks that repeat over it will show nothing.`)) updateDraft((d) => { d.settings.dataSources = (d.settings.dataSources ?? []).filter((item) => item.key !== source.key); });
                  }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {error ? <p role="alert" className="text-rose-600 dark:text-rose-400">{error}</p>
                : rows ? <p className="text-emerald-700 dark:text-emerald-400">{rows.length} {rows.length === 1 ? 'item' : 'items'} loaded</p>
                  : <p className="text-slate-500">Loading...</p>}
              {!readOnly && (
                <button type="button" className={smallButton} onClick={() => {
                  const { rootId, nodes } = cardsFor(source, rows?.[0]);
                  const added = addNodes(rootId, nodes);
                  setMessage(added ? `Added a section that shows one card for each of your ${source.label.toLowerCase()}. Click a card to change its look.` : 'Select a section on the page first, then try again.');
                }}>
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  Show on the page
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {message && <p role="status" className="text-[13px] rounded-lg px-2.5 py-2 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">{message} You can also repeat any block over it: open its Behavior tab and choose it under Repeat for each item in.</p>}
      {!readOnly && (isAdding ? (
        <NewSource
          taken={list.map((source) => source.key)}
          onCancel={() => setIsAdding(false)}
          onSave={(source) => {
            updateDraft((d) => { d.settings.dataSources = [...(d.settings.dataSources ?? []), source]; });
            setIsAdding(false);
          }}
        />
      ) : (
        <button type="button" onClick={() => setIsAdding(true)} className="w-full h-9 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors">
          <Plus className="w-4 h-4" aria-hidden="true" />
          Connect an API
        </button>
      ))}
    </section>
  );
};
