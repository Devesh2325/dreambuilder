import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DocumentKind } from '../../core/schema';
import { MODULES } from '../../core/modules';
import { resolveString } from '../../core/variables';
import { getPublicApi } from '../../data';
import { PublishedSnapshot } from '../../data/services';
import { liveEmbedRenderer } from '../../experience/EmbeddedProject';
import { useVariablesWithData } from '../../experience/useDataSources';
import { ExperiencePlayer, PlayerHost } from '../../experience/ExperiencePlayer';
import { pagesOf, SiteView } from '../../experience/SiteView';
import { deviceName, getSessionId, getVisitorId } from '../../experience/visitor';
import { googleFontsUrl } from '../../renderer/css';
import { FormSubmitResult } from '../../renderer/types';

const api = getPublicApi();

const sendEvent = (projectId: string, eventType: string, metadata?: Record<string, unknown>) => {
  // Analytics must never interfere with the page.
  api.trackEvents(projectId, [{
    type: eventType,
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    device: deviceName(window.innerWidth),
    url: window.location.pathname,
    metadata,
  }]).catch(() => undefined);
};

const sendForm = async (projectId: string, data: Record<string, unknown>): Promise<FormSubmitResult> => {
  try {
    await api.submitForm(projectId, data, getVisitorId());
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Could not send. Please try again.' };
  }
};

// Answers and activity belong to the embedded project, so they show up under it.
const renderEmbed = liveEmbedRenderer((id) => api.getPublishedExperience(id), sendForm, sendEvent);

const Message: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', color: '#334155', background: '#fff', padding: 24, textAlign: 'center' }}>
    <h1 style={{ fontSize: 24, fontWeight: 700 }}>{title}</h1>
    {children && <p style={{ marginTop: 8 }}>{children}</p>}
  </main>
);

const setMeta = (name: string, content: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
};

/** A published project at /s/:slug, or at its own domain, open to anyone without logging in. */
export const PublicSitePage: React.FC<{ domain?: string }> = ({ domain }) => {
  const params = useParams();
  const slug = params.slug ?? '';
  const pagePath = params['*'] ?? '';
  // Links between pages stay on the domain, or under /s/slug.
  const base = domain ? '' : `/s/${slug}`;
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<PublishedSnapshot | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [finishedReason, setFinishedReason] = useState<'closed' | 'completed' | null>(null);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState('loading');
    setErrorMessage(null);
    setFinishedReason(null);
    (domain ? api.getPublishedSiteByDomain(domain) : api.getPublishedSite(slug))
      .then((result) => {
        if (!active) return;
        setSnapshot(result);
        setState(result ? 'ready' : 'missing');
      })
      .catch((err) => {
        if (active) {
          setErrorMessage(err instanceof Error ? err.message : null);
          setState('error');
        }
      });
    return () => {
      active = false;
    };
  }, [slug, domain]);

  const project = snapshot?.project;
  const variables = useVariablesWithData(project?.variables, project?.settings);

  const track = useMemo(() => (eventType: string, metadata?: Record<string, unknown>) => {
    if (project) sendEvent(project.id, eventType, metadata);
  }, [project]);

  const submitForm = useMemo(() => async (data: Record<string, unknown>): Promise<FormSubmitResult> => {
    if (!project) return { ok: false, error: 'This form is not available.' };
    return sendForm(project.id, data);
  }, [project]);

  const documents = useMemo(() => (snapshot?.documents ?? []).map((doc) => ({ ...doc, kind: doc.kind as DocumentKind })), [snapshot]);
  const delivery = project ? MODULES[project.type].delivery : 'inline';
  const isSite = delivery === 'site';
  const sitePages = pagesOf(documents);
  const page = sitePages.find((doc) => doc.slug === pagePath) ?? (!pagePath ? sitePages[0] : undefined);

  useEffect(() => {
    if (!project) return;
    const seo = page?.seo ?? {};
    const resolve = (text: string | undefined) => (text ? String(resolveString(text, project.variables)) : '');
    document.title = resolve(seo.title) || project.title;
    setMeta('description', resolve(seo.description));
  }, [project, page]);

  useEffect(() => {
    if (project && (!isSite || page)) track('page_viewed', { page: pagePath });
  }, [project, isSite, page, pagePath, track]);

  useEffect(() => {
    if (!project) return undefined;
    const url = googleFontsUrl(project.theme);
    if (!url) return undefined;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
    return () => link.remove();
  }, [project]);

  const host = useMemo<PlayerHost>(() => ({
    targetDocument: document,
    standalone: true,
    submitForm,
    track,
    onFinish: delivery === 'overlay' ? (reason) => setFinishedReason(reason) : undefined,
  }), [submitForm, track, delivery]);

  if (state === 'loading') return <div role="status" aria-label="Loading" style={{ minHeight: '100vh', background: '#fff' }} />;
  if (state === 'error') {
    const isMissingRpc = errorMessage?.toLowerCase().includes('schema cache') || errorMessage?.toLowerCase().includes('get_published_site');
    return (
      <Message title="We couldn't load this page">
        {isMissingRpc ? (
          <span style={{ display: 'block', maxWidth: 520, margin: '8px auto 0', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
            The database publication function <code>get_published_site</code> is not in the schema cache yet.
            <br />
            If you are the administrator, run <code>supabase/RUN_ALL_MIGRATIONS.sql</code> (or <code>supabase/FIX_PUBLISHED_SITE_RPC.sql</code>) in your Supabase SQL Editor.
          </span>
        ) : (
          errorMessage || 'Please check your connection and try again.'
        )}
      </Message>
    );
  }
  if (state === 'missing' || !project) return <Message title="Page not found">This site doesn't exist or isn't published.</Message>;

  if (isSite) {
    if (!page) return <Message title="Page not found" />;
    return (
      <SiteView
        documents={documents}
        slug={page.slug}
        theme={project.theme}
        variables={variables}
        ctx={{
          mode: 'live',
          renderEmbed,
          submitForm,
          track,
          navigate: (href) => {
            const target = href.slice(1);
            if (pagesOf(documents).some((doc) => doc.slug === target)) {
              window.scrollTo(0, 0);
              navigate(target ? `${base}/${target}` : base || '/');
            } else {
              window.location.href = href;
            }
          },
        }}
      />
    );
  }

  if (!documents[0]) return <Message title="Page not found" />;

  if (delivery === 'overlay' && finishedReason) {
    return (
      <Message title={project.title}>
        <span style={{ display: 'block', marginTop: 4, color: '#64748b' }}>
          {finishedReason === 'completed' ? 'You completed this experience.' : 'This experience was dismissed.'}
        </span>
        <button
          type="button"
          onClick={() => {
            setFinishedReason(null);
            setReplayKey((k) => k + 1);
          }}
          style={{
            marginTop: 20,
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: project.theme.primary || '#6366f1',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.9375rem',
            cursor: 'pointer',
          }}
        >
          Replay
        </button>
      </Message>
    );
  }

  return (
    <div style={delivery === 'inline' ? { padding: 16, background: project.theme.background, minHeight: '100vh' } : { minHeight: '100vh', background: '#f1f5f9' }}>
      <ExperiencePlayer
        key={replayKey}
        type={project.type}
        content={documents[0].content}
        theme={project.theme}
        variables={variables}
        settings={project.settings}
        host={host}
      />
    </div>
  );
};

export default PublicSitePage;
