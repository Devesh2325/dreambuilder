import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MODULE_LIST, MODULES } from '../../core/modules';
import { PROJECT_TYPES, ProjectType } from '../../core/schema';
import { ProjectPreview } from '../../experience/ProjectPreview';
import { blankProject, initialValues, TEMPLATES, TemplateDefinition } from '../../templates';
import { ROUTES } from '../routes';
import { useServices } from '../session';
import { cardClass, ErrorNote, errorMessage, inputClass, PageHeader, secondaryButton } from '../shared/ui';
import { useWorkspace } from '../workspace';

/** Iframes are heavy, so a thumbnail only renders once it scrolls into view. */
const LiveThumbnail: React.FC<{ template: TemplateDefinition }> = ({ template }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = 0.33;
  return (
    <div ref={ref} aria-hidden="true" className="h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-t-2xl relative">
      {isVisible && (
        <div style={{ width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <ProjectPreview
            type={template.type}
            documents={template.pages.map((page, position) => ({ ...page, position }))}
            theme={template.themes[0].theme}
            variables={initialValues(template)}
            settings={template.settings ?? {}}
            interactive={false}
            title={`${template.title} preview`}
          />
        </div>
      )}
    </div>
  );
};

export const TemplatesPage: React.FC = () => {
  const { projects } = useServices();
  const { workspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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

  const createBlank = useMutation({
    mutationFn: async (blankType: ProjectType) =>
      projects.create(blankProject(blankType, workspace!.organizationId, `Untitled ${MODULES[blankType].label.toLowerCase()}`)),
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(ROUTES.studio(id));
    },
  });

  return (
    <>
      <PageHeader
        title="Choose a template"
        subtitle="Pick a starting point, fill in your details, and change anything later in the editor."
        actions={type && can('create:project') && (
          <button type="button" className={secondaryButton} disabled={createBlank.isPending} onClick={() => createBlank.mutate(type)}>
            Start blank
          </button>
        )}
      />
      <ErrorNote message={createBlank.isError ? errorMessage(createBlank.error) : null} />

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
              <LiveThumbnail template={template} />
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
