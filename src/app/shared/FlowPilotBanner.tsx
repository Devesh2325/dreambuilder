import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MODULES } from '../../core/modules';
import { ProjectType } from '../../core/schema';
import { ExperienceView } from '../../renderer/ExperienceView';
import { RenderContext } from '../../renderer/types';
import { buildContent, el, El } from '../../templates/dsl';
import { THEME_INDIGO } from '../../templates/themes';
import { ROUTES } from '../routes';

export interface BannerAction {
  label: string;
  href: string;
  /** Shown in full color, for the one thing to do next. */
  primary?: boolean;
}

interface FlowPilotBannerProps {
  title: string;
  text: string;
  /** What happens next, as a short numbered list. */
  steps?: string[];
  actions?: BannerAction[];
}

const NO_VARIABLES = {};
const THEME = THEME_INDIGO.theme;

const stepCard = (label: string, index: number): El => el('Box', {
  styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)' },
}, [
  el('Text', {
    props: { text: String(index + 1) },
    styles: { flexShrink: '0', width: '28px', height: '28px', lineHeight: '28px', textAlign: 'center', borderRadius: '999px', background: '#ffffff', color: '#4338ca', fontSize: '13px', fontWeight: '800', margin: '0' },
  }),
  el('Text', { props: { text: label }, styles: { color: '#ffffff', fontSize: '14px', fontWeight: '500', margin: '0', textAlign: 'left' } }),
]);

/**
 * What an empty page shows. It is made of FlowPilot's own blocks and drawn by the renderer
 * customers' banners use, so it looks like what people can build here.
 */
export const FlowPilotBanner: React.FC<FlowPilotBannerProps> = ({ title, text, steps = [], actions = [] }) => {
  const navigate = useNavigate();
  const content = useMemo(() => buildContent('b', [
    el('Section', {
      name: 'Banner',
      styles: { padding: '40px', borderRadius: '20px', background: 'linear-gradient(120deg,#312e81 0%,#4f46e5 55%,#7c3aed 100%)' },
    }, [
      el('Grid', {
        styles: { display: 'grid', gridTemplateColumns: steps.length ? 'minmax(0,1.3fr) minmax(0,1fr)' : '1fr', gap: '32px', alignItems: 'center' },
        responsive: steps.length ? { mobile: { gridTemplateColumns: '1fr' } } : undefined,
      }, [
        el('Box', { styles: { display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' } }, [
          el('Heading', { props: { text: title, level: 'h2' }, styles: { color: '#ffffff', fontSize: '28px', fontWeight: '800', margin: '0' } }),
          el('Text', { props: { text }, styles: { color: '#e0e7ff', fontSize: '15px', margin: '0', maxWidth: '520px' } }),
          ...(actions.length ? [el('Row', { styles: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' } }, actions.map((action) => el('Button', {
            props: { text: action.label, href: action.href, action: 'link', variant: action.primary ? 'primary' : 'secondary' },
            styles: action.primary
              ? { background: '#ffffff', color: '#4338ca', border: '1px solid #ffffff', fontWeight: '700' }
              : { background: 'transparent', color: '#ffffff', border: '1px solid rgba(255,255,255,.5)' },
          })))] : []),
        ]),
        ...(steps.length ? [el('Box', { styles: { display: 'flex', flexDirection: 'column', gap: '8px' } }, steps.map(stepCard))] : []),
      ]),
    ]),
  ]), [title, text, steps, actions]);

  const documents = useMemo(() => [content], [content]);
  const ctx = useMemo<RenderContext>(() => ({ mode: 'live', navigate: (href) => navigate(href) }), [navigate]);

  return (
    <div className="rounded-[20px] overflow-hidden [&_.fp-root]:bg-transparent">
      <ExperienceView documents={documents} theme={THEME} variables={NO_VARIABLES} ctx={ctx} />
    </div>
  );
};

const MODULE_COPY: Record<ProjectType, { text: string; steps: string[] }> = {
  website: {
    text: 'A complete site with its own pages and menu. Pick a design for your industry and your details fill in everywhere.',
    steps: ['Choose a design for your industry', 'Add your business details', 'Publish and share your link'],
  },
  page: {
    text: 'A single page for a campaign or launch. Most people have one ready to share in a few minutes.',
    steps: ['Choose a page design', 'Fill in your offer', 'Publish and share your link'],
  },
  tour: {
    text: 'Walk people through your app, step by step. You can build it by clicking around your own live site.',
    steps: ['Choose a tour layout', 'Open your app and click each step', 'Add one script to your site'],
  },
  form: {
    text: 'Collect leads, bookings and answers. Everything people send arrives here, ready to export.',
    steps: ['Choose a form', 'Change the questions', 'Share the link or place it in your site'],
  },
  demo: {
    text: 'Clickable screens of your product, so people can try it without signing up.',
    steps: ['Upload your screenshots', 'Add a tooltip to each one', 'Share it or place it in your site'],
  },
  banner: {
    text: 'Bars, popups and carousels that get your message seen, on the pages you choose.',
    steps: ['Choose a banner style', 'Write your message', 'Add one script to your site'],
  },
  menu: {
    text: 'A navigation bar you can add to any site, and change here without touching your code.',
    steps: ['Choose a menu', 'Add your links', 'Place it in your site'],
  },
  faq: {
    text: 'Answer common questions in one place, and cut down the same emails.',
    steps: ['Choose an FAQ layout', 'Add your questions', 'Share it or place it in your site'],
  },
};

export const ModuleEmptyBanner: React.FC<{ type: ProjectType; canCreate?: boolean }> = ({ type, canCreate = true }) => {
  const module = MODULES[type];
  const copy = MODULE_COPY[type];
  const actions = useMemo<BannerAction[]>(() => [
    ...(canCreate ? [{ label: 'Choose a template', href: ROUTES.create(type), primary: true }] : []),
    { label: 'Read the guide', href: ROUTES.doc(type) },
  ], [canCreate, type]);
  return <FlowPilotBanner title={`No ${module.plural.toLowerCase()} yet`} text={copy.text} steps={copy.steps} actions={actions} />;
};
