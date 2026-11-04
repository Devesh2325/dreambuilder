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
    getPublishedSite: (slug) => rpc<PublishedSnapshot | null>('get_published_site', { p_slug: slug }),
    getPublishedExperience: (projectId) => rpc<PublishedSnapshot | null>('get_published_experience', { p_project: projectId }),
    submitForm: async (projectId, data, visitorId) => {
      await rpc('submit_form', { p_project: projectId, p_data: data, p_visitor: visitorId ?? null });
    },
    getChecklistProgress: (projectId, visitorId) =>
      rpc<string[]>('get_checklist_progress', { p_project: projectId, p_visitor: visitorId }),
    saveChecklistProgress: async (projectId, visitorId, completed) => {
      await rpc('save_checklist_progress', { p_project: projectId, p_visitor: visitorId, p_completed: completed });
    },
    trackEvents: async (projectId, events) => {
      await rpc('track_events', { p_project: projectId, p_events: events });
    },
  };
}
