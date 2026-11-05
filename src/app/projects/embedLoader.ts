import { useCallback } from 'react';
import { EmbedLoader } from '../../experience/EmbeddedProject';
import { useServices } from '../session';

/** For the editor and previews: the team sees a project's latest draft, published or not. */
export function useDraftEmbedLoader(): EmbedLoader {
  const { projects } = useServices();
  return useCallback(async (projectId) => {
    const [project, documents] = await Promise.all([projects.get(projectId), projects.listDocuments(projectId)]);
    if (!project) return null;
    return { project: { ...project, slug: project.slug ?? '' }, documents };
  }, [projects]);
}
