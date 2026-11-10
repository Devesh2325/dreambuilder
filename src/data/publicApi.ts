import { PublicApi, PublishedSnapshot } from './services';

/**
 * Calls Supabase's REST endpoint with fetch rather than supabase-js, so the embed
 * script that visitors download stays small. Used by public sites too.
 */
export function createPublicApi(url: string, anonKey: string): PublicApi {
  const rpc = async <T>(name: string, body: unknown): Promise<T> => {
    const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new Error(payload?.message ?? 'Something went wrong. Please try again.');
    }
    return payload as T;
  };

  return {
    getPublishedSite: async (slug) => {
      try {
        return await rpc<PublishedSnapshot | null>('get_published_site', { p_slug: slug });
      } catch (err) {
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('flowpilot_fallback_db_v1') || localStorage.getItem('flowpilot_local_storage_db_v1');
            if (raw) {
              const parsed = JSON.parse(raw);
              const project = parsed.projects?.find((p: { slug?: string; status?: string }) => p.slug === slug && p.status === 'published');
              if (project) {
                const latestVersion = parsed.versions
                  ?.filter((v: { projectId: string }) => v.projectId === project.id)
                  ?.sort((a: { versionNumber: number }, b: { versionNumber: number }) => b.versionNumber - a.versionNumber)?.[0];
                if (latestVersion?.snapshot) return latestVersion.snapshot as PublishedSnapshot;
                const docs = parsed.documents?.filter((d: { projectId: string }) => d.projectId === project.id) ?? [];
                return { project, documents: docs } as PublishedSnapshot;
              }
            }
          } catch {
            // Ignore parse errors and fall through to rethrow
          }
        }
        throw err;
      }
    },
    getPublishedSiteByDomain: (domain) => rpc<PublishedSnapshot | null>('get_published_site_by_domain', { p_domain: domain }),
    getPublishedExperience: async (projectId) => {
      try {
        return await rpc<PublishedSnapshot | null>('get_published_experience', { p_project: projectId });
      } catch (err) {
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('flowpilot_fallback_db_v1') || localStorage.getItem('flowpilot_local_storage_db_v1');
            if (raw) {
              const parsed = JSON.parse(raw);
              const project = parsed.projects?.find((p: { id: string; status?: string }) => p.id === projectId && p.status === 'published');
              if (project) {
                const latestVersion = parsed.versions
                  ?.filter((v: { projectId: string }) => v.projectId === project.id)
                  ?.sort((a: { versionNumber: number }, b: { versionNumber: number }) => b.versionNumber - a.versionNumber)?.[0];
                if (latestVersion?.snapshot) return latestVersion.snapshot as PublishedSnapshot;
                const docs = parsed.documents?.filter((d: { projectId: string }) => d.projectId === project.id) ?? [];
                return { project, documents: docs } as PublishedSnapshot;
              }
            }
          } catch {
            // Ignore parse errors and fall through to rethrow
          }
        }
        throw err;
      }
    },
    submitForm: async (projectId, data, visitorId) => {
      await rpc('submit_form', { p_project: projectId, p_data: data, p_visitor: visitorId ?? null });
    },
    trackEvents: async (projectId, events) => {
      await rpc('track_events', { p_project: projectId, p_events: events });
    },
  };
}
