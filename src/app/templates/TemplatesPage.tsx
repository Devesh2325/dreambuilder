import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MODULE_LIST, MODULES } from '../../core/modules';
import { PROJECT_TYPES, ProjectType } from '../../core/schema';
import { TEMPLATES } from '../../templates';
import { ROUTES } from '../routes';
import { cardClass, inputClass, PageHeader } from '../shared/ui';
import { LiveThumbnail } from './LiveThumbnail';

export const TemplatesPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const raw = params.get('type');
  const type = PROJECT_TYPES.includes(raw as ProjectType) ? (raw as ProjectType) : null;

  const term = search.trim().toLowerCase();
  const list = TEMPLATES.filter((template) => {
    if (type && template.type !== type) return false;
    if (!term) return true;
    return [template.title, template.description, ...template.tags, MODULES[template.type].label].join(' ').toLowerCase().includes(term);
  });

  return (
    <>
      <PageHeader
        title="Choose a template"
        subtitle="Pick a starting point, fill in your details, and change anything later in the editor."
      />

      <div className="flex flex-col gap-3 mb-6">
        <input
          type="search"
          aria-label="Search templates"
          placeholder="Search templates..."
          className={`${inputClass} max-w-sm`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
          <button
            type="button"
            aria-pressed={!type}
            onClick={() => setParams({})}
            className={`px-3 py-1 text-xs font-semibold rounded-full ${!type ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
          >
            All
          </button>
          {MODULE_LIST.map((m) => (
            <button
              key={m.type}
              type="button"
              aria-pressed={type === m.type}
              onClick={() => setParams({ type: m.type })}
              className={`px-3 py-1 text-xs font-semibold rounded-full ${type === m.type ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              {m.plural}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No templates match your search.</p>}

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((template) => (
          <li key={template.id}>
            <Link to={ROUTES.newFromTemplate(template.id)} className={`${cardClass} block hover:border-indigo-400 transition-colors`}>
              <LiveThumbnail template={template} className="h-48 rounded-t-2xl" />
              <div className="p-4">
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{MODULES[template.type].label}</p>
                <h2 className="mt-0.5 font-semibold">{template.title}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{template.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
};
