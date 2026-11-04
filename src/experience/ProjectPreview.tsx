import React, { useEffect, useMemo, useState } from 'react';
import { MODULES } from '../core/modules';
import { ProjectSettings, ProjectType, Theme } from '../core/schema';
import { VariableValues } from '../core/variables';
import { Frame } from '../renderer/Frame';
import { ExperiencePlayer, PlayerHost } from './ExperiencePlayer';
import { pagesOf, SiteDocument, SiteView } from './SiteView';

export const DEVICE_WIDTHS = { desktop: '100%', tablet: '768px', mobile: '390px' } as const;

/** A stand-in page, so overlays and tours have something to sit on. */
const SampleHostPage: React.FC = () => (
  <div style={{ fontFamily: 'system-ui, sans-serif', color: '#334155', background: '#f1f5f9', minHeight: '100vh' }}>
    <nav style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '14px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
      <strong>Your site</strong>
      <span>Dashboard</span>
      <span>Reports</span>
      <button type="button" style={{ marginLeft: 'auto', padding: '8px 14px' }}>Create</button>
    </nav>
    <main style={{ padding: 24, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
      {[1, 2, 3, 4].map((n) => <div key={n} style={{ height: 120, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }} />)}
    </main>
  </div>
);

interface ProjectPreviewProps {
  type: ProjectType;
  documents: SiteDocument[];
  theme: Theme;
  variables: VariableValues;
  settings: ProjectSettings;
  device?: keyof typeof DEVICE_WIDTHS;
  /** Which page to show first. */
  initialSlug?: string;
  className?: string;
  /** When false, clicks inside are ignored: used for gallery thumbnails. */
  interactive?: boolean;
  title?: string;
}

export const ProjectPreview: React.FC<ProjectPreviewProps> = ({
  type, documents, theme, variables, settings, device = 'desktop', initialSlug, className, interactive = true, title = 'Preview',
}) => {
  const delivery = MODULES[type].delivery;
  const [doc, setDoc] = useState<Document | null>(null);
  const [slug, setSlug] = useState(initialSlug ?? '');
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    if (initialSlug !== undefined) setSlug(initialSlug);
  }, [initialSlug]);

  const host = useMemo<PlayerHost | null>(
    () => (doc ? { targetDocument: doc, submitForm: async () => ({ ok: true }) } : null),
    [doc],
  );

  const pages = pagesOf(documents);
  const pageExists = pages.some((page) => page.slug === slug);

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', width: '100%' }}>
      {delivery !== 'site' && interactive && (
        <button
          type="button"
          onClick={() => setRunKey(runKey + 1)}
          className="self-end mb-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Replay
        </button>
      )}
      <Frame
        title={title}
        theme={theme}
        onDocument={setDoc}
        style={{ width: DEVICE_WIDTHS[device], maxWidth: '100%', flex: 1, background: '#fff', pointerEvents: interactive ? undefined : 'none' }}
      >
        {delivery === 'site' ? (
          <SiteView
            documents={documents}
            slug={pageExists ? slug : (pages[0]?.slug ?? '')}
            theme={theme}
            variables={variables}
            ctx={{
              mode: 'preview',
              submitForm: async () => ({ ok: true }),
              // Only internal pages navigate. A preview must not leave the app.
              navigate: (href) => {
                const target = href.slice(1);
                if (pages.some((page) => page.slug === target)) setSlug(target);
              },
            }}
          />
        ) : (
          <>
            {delivery === 'overlay' && settings.position !== 'inline' && <SampleHostPage />}
            {host && documents[0] && (
              <div style={delivery === 'inline' ? { padding: 16 } : undefined}>
                <ExperiencePlayer
                  key={runKey}
                  type={type}
                  content={documents[0].content}
                  theme={theme}
                  variables={variables}
                  settings={settings}
                  host={host}
                  mode="preview"
                />
              </div>
            )}
          </>
        )}
      </Frame>
    </div>
  );
};
