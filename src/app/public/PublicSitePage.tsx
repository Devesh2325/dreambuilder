import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DocumentKind } from '../../core/schema';
import { MODULES } from '../../core/modules';
import { resolveString } from '../../core/variables';
import { getPublicApi } from '../../data';
import { PublishedSnapshot } from '../../data/services';
import { ExperiencePlayer, PlayerHost } from '../../experience/ExperiencePlayer';
import { pagesOf, SiteView } from '../../experience/SiteView';
import { deviceName, getSessionId, getVisitorId } from '../../experience/visitor';
import { googleFontsUrl } from '../../renderer/css';
import { FormSubmitResult } from '../../renderer/types';

const api = getPublicApi();

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

/** A published project at /s/:slug, open to anyone without logging in. */
export const PublicSitePage: React.FC = () => {
  const params = useParams();
  const slug = params.slug!;
  const pagePath = params['*'] ?? '';
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<PublishedSnapshot | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    setState('loading');
    api.getPublishedSite(slug)
      .then((result) => {
        if (!active) return;
        setSnapshot(result);
        setState(result ? 'ready' : 'missing');
      })
      .catch(() => {
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const project = snapshot?.project;

  const track = useMemo(() => (eventType: string, metadata?: Record<string, unknown>) => {
    if (!project) return;
    // Analytics must never interfere with the page.
    api.trackEvents(project.id, [{
      type: eventType,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      device: deviceName(window.innerWidth),
      url: window.location.pathname,
      metadata,
    }]).catch(() => undefined);
  }, [project]);

  const submitForm = useMemo(() => async (data: Record<string, unknown>): Promise<FormSubmitResult> => {
    if (!project) return { ok: false, error: 'This form is not available.' };
    try {
      await api.submitForm(project.id, data, getVisitorId());
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Could not send. Please try again.' };
    }
  }, [project]);

  const documents = useMemo(() => (snapshot?.documents ?? []).map((doc) => ({ ...doc, kind: doc.kind as DocumentKind })), [snapshot]);
  const isSite = project ? MODULES[project.type].delivery === 'site' : false;
  const page = pagesOf(documents).find((doc) => doc.slug === pagePath);

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

  const host = useMemo<PlayerHost>(() => ({ targetDocument: document, submitForm, track }), [submitForm, track]);

  if (state === 'loading') return <div role="status" aria-label="Loading" style={{ minHeight: '100vh', background: '#fff' }} />;
  if (state === 'error') return <Message title="We couldn't load this page">Please check your connection and try again.</Message>;
  if (state === 'missing' || !project) return <Message title="Page not found">This site doesn't exist or isn't published.</Message>;

  if (isSite) {
    if (!page) return <Message title="Page not found" />;
    return (
      <SiteView
        documents={documents}
        slug={pagePath}
        theme={project.theme}
        variables={project.variables}
        ctx={{
          mode: 'live',
          submitForm,
          track,
          navigate: (href) => {
            const target = href.slice(1);
            if (pagesOf(documents).some((doc) => doc.slug === target)) {
              window.scrollTo(0, 0);
              navigate(target ? `/s/${slug}/${target}` : `/s/${slug}`);
            } else {
              window.location.href = href;
            }
          },
        }}
      />
    );
  }

  return (
    <div style={MODULES[project.type].delivery === 'inline' ? { padding: 16, background: project.theme.background, minHeight: '100vh' } : { minHeight: '100vh', background: '#f1f5f9' }}>
      <ExperiencePlayer
        type={project.type}
        content={documents[0].content}
        theme={project.theme}
        variables={project.variables}
        settings={project.settings}
        host={host}
      />
    </div>
  );
};

export default PublicSitePage;
