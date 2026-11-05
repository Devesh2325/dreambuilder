import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react';
import { ROUTES } from '../app/routes';
import { useServices } from '../app/session';
import { useWorkspace } from '../app/workspace';
import { MODULE_LIST, MODULES } from '../core/modules';
import { DocNode } from '../core/schema';
import { ProjectRecord } from '../data/services';
import { BlockField } from '../renderer/types';
import { fieldClass, labelClass } from './fields';
import { useStudio } from './store';

/** Only things that fit inside a page. A whole website doesn't. */
export const canBeEmbedded = (project: ProjectRecord) => MODULES[project.type].delivery !== 'site';

export function useEmbeddableProjects() {
  const { projects } = useServices();
  const { workspace } = useWorkspace();
  const currentId = useStudio((s) => s.project?.id);
  const organizationId = workspace?.organizationId;
  const query = useQuery({ queryKey: ['projects', organizationId], queryFn: () => projects.list(organizationId!), enabled: Boolean(organizationId) });
  return { ...query, data: query.data?.filter((project) => canBeEmbedded(project) && project.id !== currentId) };
}

/** Choose which of the workspace's projects a block shows. */
export const ProjectField: React.FC<{ node: DocNode; field: BlockField }> = ({ node, field }) => {
  const readOnly = useStudio((s) => s.readOnly);
  const list = useEmbeddableProjects();
  const value = String(node.props[field.key] ?? '');
  const chosen = list.data?.find((project) => project.id === value);
  const id = `prop-${node.id}-${field.key}`;

  return (
    <div>
      <label htmlFor={id} className={`${labelClass} mb-1`}>{field.label}</label>
      <select id={id} disabled={readOnly} className={fieldClass} value={value} onChange={(event) => useStudio.getState().updateProps(node.id, { [field.key]: event.target.value })}>
        <option value="">Choose a project</option>
        {MODULE_LIST.map((module) => {
          const own = list.data?.filter((project) => project.type === module.type) ?? [];
          return own.length > 0 && (
            <optgroup key={module.type} label={module.plural}>
              {own.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
            </optgroup>
          );
        })}
      </select>
      {field.help && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{field.help}</p>}
      {chosen && chosen.status !== 'published' && (
        <p role="status" className="mt-2 flex items-start gap-1.5 text-[13px] rounded-lg px-2.5 py-2 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <TriangleAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span>"{chosen.title}" isn't published yet, so visitors won't see it. <Link to={ROUTES.project(chosen.id)} target="_blank" className="font-semibold underline">Publish it</Link></span>
        </p>
      )}
      {chosen && <Link to={ROUTES.studio(chosen.id)} target="_blank" className="mt-2 inline-block text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Edit "{chosen.title}"</Link>}
      {list.isSuccess && list.data?.length === 0 && <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">You don't have any forms, demos, banners, FAQs, menus or tours yet. Create one first, and it appears here.</p>}
    </div>
  );
};
