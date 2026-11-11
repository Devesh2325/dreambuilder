import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DEFAULT_THEME, PROJECT_TYPES, ProjectType } from '../../core/schema';
import { createPublicApi } from '../../data/publicApi';
import { PublishedSnapshot } from '../../data/services';
import { initialValues, projectFromTemplate, templatesFor } from '../../templates';

const snapshotsBySlug = new Map<string, PublishedSnapshot>();

vi.mock('../../data', () => ({
  getPublicApi: () => ({
    getPublishedSite: async (slug: string) => snapshotsBySlug.get(slug) ?? null,
    getPublishedSiteByDomain: async () => null,
    getPublishedExperience: async (id: string) =>
      [...snapshotsBySlug.values()].find((s) => s.project.id === id) ?? null,
    submitForm: async () => undefined,
    trackEvents: async () => undefined,
  }),
}));

const { PublicSitePage } = await import('../../app/public/PublicSitePage');

function makeSnapshot(type: ProjectType, slug: string): PublishedSnapshot {
  const template = templatesFor(type)[0];
  const draft = projectFromTemplate(template, 'org-1', initialValues(template), template.themes[0]?.theme ?? DEFAULT_THEME);
  const projectId = `proj-${type}`;
  return {
    project: {
      id: projectId,
      type,
      title: `${type} demo`,
      slug,
      variables: draft.variables,
      theme: draft.theme,
      settings: draft.settings,
    },
    documents: draft.documents.map((doc, idx) => ({
      id: `doc-${type}-${idx}`,
      projectId,
      kind: doc.kind,
      title: doc.title,
      slug: idx === 0 && type === 'website' ? 'home' : doc.slug,
      position: idx,
      seo: doc.seo ?? {},
      content: doc.content,
      revision: 1,
      updatedAt: new Date().toISOString(),
    })),
  };
}

describe('publicApi fallback storage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('resolves flowpilot_db_fallback and handles missing form/analytics RPCs gracefully', async () => {
    const snap = makeSnapshot('form', 'fallback-form');
    localStorage.setItem(
      'flowpilot_db_fallback',
      JSON.stringify({
        projects: [{ ...snap.project, status: 'published' }],
        documents: snap.documents,
        versions: [{ id: 'v1', projectId: snap.project.id, versionNumber: 1, snapshot: snap }],
      }),
    );

    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            code: 'PGRST202',
            message: 'Could not find the function public.get_published_site(p_slug) in the schema cache',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        ),
    );

    const api = createPublicApi('https://example.supabase.co', 'anon');
    const bySlug = await api.getPublishedSite('fallback-form');
    expect(bySlug?.project.id).toBe(snap.project.id);

    const byId = await api.getPublishedExperience(snap.project.id);
    expect(byId?.project.slug).toBe('fallback-form');

    await expect(api.submitForm(snap.project.id, { email: 'test@example.com' })).resolves.toBeUndefined();
    await expect(api.trackEvents(snap.project.id, [])).resolves.toBeUndefined();
  });
});

describe('PublicSitePage across all 8 modules', () => {
  afterEach(() => {
    snapshotsBySlug.clear();
    cleanup();
  });

  it.each(PROJECT_TYPES)('renders published %s on /s/:slug', async (type) => {
    const slug = `pub-${type}`;
    snapshotsBySlug.set(slug, makeSnapshot(type, slug));

    const { container } = render(
      <MemoryRouter initialEntries={[`/s/${slug}`]}>
        <Routes>
          <Route path="/s/:slug/*" element={<PublicSitePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(container.querySelector('.fp-root')).not.toBeNull();
    });
    expect(screen.queryByText("We couldn't load this page")).toBeNull();
    expect(screen.queryByText('Page not found')).toBeNull();
  });

  it('shows a Replay card instead of a blank page when a tour or banner is dismissed', async () => {
    const slug = 'pub-tour-replay';
    snapshotsBySlug.set(slug, makeSnapshot('tour', slug));

    render(
      <MemoryRouter initialEntries={[`/s/${slug}`]}>
        <Routes>
          <Route path="/s/:slug/*" element={<PublicSitePage />} />
        </Routes>
      </MemoryRouter>,
    );

    const skipBtn = await screen.findByRole('button', { name: 'Skip' });
    fireEvent.click(skipBtn);

    const replayBtn = await screen.findByRole('button', { name: 'Replay' });
    expect(replayBtn).toBeTruthy();
    fireEvent.click(replayBtn);

    expect(await screen.findByRole('button', { name: 'Skip' })).toBeTruthy();
  });
});

