import { PublicApi, PublishedSnapshot } from './services';

const FALLBACK_KEYS = ['flowpilot_db_fallback', 'flowpilot_fallback_db_v1', 'flowpilot_local_storage_db_v1'];

const isMissingRpc = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message.toLowerCase() : '';
  return msg.includes('schema cache') || msg.includes('could not find the function') || msg.includes('pgrst202');
};

interface FallbackStore {
  projects?: (PublishedSnapshot['project'] & { status?: string })[];
  documents?: (PublishedSnapshot['documents'][number] & { projectId: string })[];
  versions?: { projectId: string; versionNumber: number; snapshot?: PublishedSnapshot }[];
}

const readFallbackStore = (): FallbackStore | null => {
  if (typeof window === 'undefined') return null;
  for (const key of FALLBACK_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as FallbackStore;
    } catch {
      // Ignore malformed storage entries
    }
  }
  return null;
};

const findFallbackSnapshot = (
  match: (project: PublishedSnapshot['project'] & { status?: string }) => boolean,
): PublishedSnapshot | null => {
  const parsed = readFallbackStore();
  if (!parsed) return null;
  const project = parsed.projects?.find((p) => p.status === 'published' && match(p));
  if (!project) return null;
  const latestVersion = parsed.versions
    ?.filter((v) => v.projectId === project.id)
    ?.sort((a, b) => b.versionNumber - a.versionNumber)?.[0];
  if (latestVersion?.snapshot) return latestVersion.snapshot;
  const docs = parsed.documents?.filter((d) => d.projectId === project.id) ?? [];
  return { project, documents: docs };
};

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
        const snapshot = findFallbackSnapshot((p) => p.slug === slug);
        if (snapshot) return snapshot;
        throw err;
      }
    },
    getPublishedSiteByDomain: (domain) => rpc<PublishedSnapshot | null>('get_published_site_by_domain', { p_domain: domain }),
    getPublishedExperience: async (projectId) => {
      try {
        return await rpc<PublishedSnapshot | null>('get_published_experience', { p_project: projectId });
      } catch (err) {
        const snapshot = findFallbackSnapshot((p) => p.id === projectId);
        if (snapshot) return snapshot;
        throw err;
      }
    },
    submitForm: async (projectId, data, visitorId) => {
      try {
        await rpc('submit_form', { p_project: projectId, p_data: data, p_visitor: visitorId ?? null });
      } catch (err) {
        if (isMissingRpc(err) && findFallbackSnapshot((p) => p.id === projectId)) return;
        throw err;
      }
    },
    trackEvents: async (projectId, events) => {
      try {
        await rpc('track_events', { p_project: projectId, p_events: events });
      } catch (err) {
        if (isMissingRpc(err)) return;
        throw err;
      }
    },
  };
}
