import { GLOBAL_FOOTER_SLUG, GLOBAL_HEADER_SLUG } from '../core/schema';
import { VariableDef } from '../core/variables';
import { photo } from './assets';
import { buildContent, button, el, El, heading, image, section, TemplateDefinition, TemplatePage, text, ThemePreset } from './dsl';
import { ALL_THEMES, THEME_CORAL, THEME_EMERALD, THEME_INDIGO, THEME_MIDNIGHT, THEME_MONO, THEME_OCEAN, THEME_TERRACOTTA } from './themes';

// ---- Custom Themes with Apidog Aesthetic ------------------------------------

export const THEME_APIDOG_DEVTOOLS: ThemePreset = {
  name: 'Apidog Cyberpunk',
  theme: {
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    background: '#0b0f19',
    surface: '#131b2e',
    text: '#f8fafc',
    muted: '#94a3b8',
    radius: '12px',
    fontHeading: 'Space Grotesk',
    fontBody: 'Inter',
  },
};

export const THEME_APIDOG_FINTECH: ThemePreset = {
  name: 'FinTech Emerald Obsidian',
  theme: {
    primary: '#10b981',
    secondary: '#eab308',
    background: '#090d16',
    surface: '#111827',
    text: '#f9fafb',
    muted: '#9ca3af',
    radius: '10px',
    fontHeading: 'Space Grotesk',
    fontBody: 'Inter',
  },
};

export const THEME_APIDOG_AI: ThemePreset = {
  name: 'AI Electric Violet',
  theme: {
    primary: '#6366f1',
    secondary: '#ec4899',
    background: '#080c14',
    surface: '#151928',
    text: '#f8fafc',
    muted: '#94a3b8',
    radius: '14px',
    fontHeading: 'Outfit',
    fontBody: 'Inter',
  },
};

export const THEME_APIDOG_HEALTHCARE: ThemePreset = {
  name: 'HealthTech Cyan',
  theme: {
    primary: '#06b6d4',
    secondary: '#14b8a6',
    background: '#0b1320',
    surface: '#121e33',
    text: '#f8fafc',
    muted: '#94a3b8',
    radius: '12px',
    fontHeading: 'Plus Jakarta Sans',
    fontBody: 'Inter',
  },
};

export const THEME_APIDOG_SECURITY: ThemePreset = {
  name: 'Security Crimson Glow',
  theme: {
    primary: '#ef4444',
    secondary: '#f59e0b',
    background: '#0d0b14',
    surface: '#191526',
    text: '#f8fafc',
    muted: '#a1a1aa',
    radius: '10px',
    fontHeading: 'Space Grotesk',
    fontBody: 'Inter',
  },
};

export const THEME_APIDOG_ECOMMERCE: ThemePreset = {
  name: 'Commerce Purple Coral',
  theme: {
    primary: '#7c3aed',
    secondary: '#f97316',
    background: '#0a0e1a',
    surface: '#14192b',
    text: '#f8fafc',
    muted: '#94a3b8',
    radius: '12px',
    fontHeading: 'Plus Jakarta Sans',
    fontBody: 'Inter',
  },
};

// ---- Helpers for Apidog Block Components ------------------------------------

interface ApidogIndustryConfig {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  theme: ThemePreset;
  brand: [name: string, tagline: string];
  pillBadge: string;
  hero: {
    headline: string;
    subheadline: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  apiPreview: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    status: string;
    latency: string;
    code: string;
    response: string;
  };
  stats: { value: string; label: string }[];
  features: { title: string; description: string; tag: string }[];
  comparison: { feature: string; apidog: string; legacy: string }[];
  testimonials: { quote: string; author: string; role: string; company: string }[];
  pricing: { tier: string; price: string; description: string; popular?: boolean; features?: string[] }[];
  faq: { question: string; answer: string }[];
}

const apidogHeader = (): TemplatePage => ({
  kind: 'global',
  title: 'Header',
  slug: GLOBAL_HEADER_SLUG,
  content: buildContent('h', [
    el('Navbar', {
      props: {
        brand: '{{brand.name}}',
        logo: '{{brand.logo}}',
        ctaText: '{{hero.ctaPrimary}}',
        ctaHref: '#pricing',
      },
      styles: {
        backgroundColor: 'var(--fp-background)',
      },
    }),
    el('Divider'),
  ]),
});

const apidogFooter = (): TemplatePage => ({
  kind: 'global',
  title: 'Footer',
  slug: GLOBAL_FOOTER_SLUG,
  content: buildContent('f', [
    section(
      [
        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '32px' },
          responsive: {
            tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
            mobile: { gridTemplateColumns: 'minmax(0, 1fr)' },
          },
        }, [
          el('Box', { styles: { gap: '12px' } }, [
            heading('{{brand.name}}', 'h4'),
            text('{{brand.tagline}}', { color: 'var(--fp-muted)' }),
            el('Badge', { props: { text: '⚡ Apidog Engine v4.2', tone: 'primary' } }),
            text('© 2026 {{brand.name}}. All rights reserved.', { fontSize: '0.8125rem', color: 'var(--fp-muted)' }),
          ]),
          el('Box', { styles: { gap: '8px', alignItems: 'flex-start' } }, [
            heading('Product', 'h4'),
            button('API Design & Spec', '#features', 'link'),
            button('Automated Testing', '#features', 'link'),
            button('Smart Mock Servers', '#features', 'link'),
            button('Interactive Console', '#api-preview', 'link'),
            button('Pricing & Plans', '#pricing', 'link'),
          ]),
          el('Box', { styles: { gap: '8px', alignItems: 'flex-start' } }, [
            heading('Resources', 'h4'),
            button('Documentation', '/docs', 'link'),
            button('API Reference', '/features', 'link'),
            button('Developer Community', '#', 'link'),
            button('System Status (99.99%)', '#', 'link'),
            button('Security & Compliance', '#', 'link'),
          ]),
          el('Box', { styles: { gap: '8px', alignItems: 'flex-start' } }, [
            heading('Contact & Sales', 'h4'),
            text('{{contact.email}}', {}, 'contact.email'),
            text('{{contact.phone}}', {}, 'contact.phone'),
            text('{{contact.address}}', {}, 'contact.address'),
            button('Schedule Technical Demo', '/contact', 'secondary'),
          ]),
        ]),
      ],
      {
        backgroundColor: 'var(--fp-surface)',
        paddingTop: '64px',
        paddingBottom: '64px',
      },
    ),
  ]),
});

function createApidogWebsite(config: ApidogIndustryConfig): TemplateDefinition {
  const variables: VariableDef[] = [
    { key: 'brand.name', label: 'Platform name', type: 'text', group: 'Brand', required: true, default: config.brand[0] },
    { key: 'brand.tagline', label: 'Tagline', type: 'text', group: 'Brand', required: true, default: config.brand[1] },
    { key: 'brand.logo', label: 'Logo', type: 'image', group: 'Brand' },

    { key: 'pill.badge', label: 'Eyebrow pill text', type: 'text', group: 'Hero', required: true, default: config.pillBadge },
    { key: 'hero.headline', label: 'Main headline', type: 'text', group: 'Hero', required: true, default: config.hero.headline },
    { key: 'hero.subheadline', label: 'Supporting subheadline', type: 'longtext', group: 'Hero', default: config.hero.subheadline },
    { key: 'hero.ctaPrimary', label: 'Primary button label', type: 'text', group: 'Hero', required: true, default: config.hero.ctaPrimary },
    { key: 'hero.ctaSecondary', label: 'Secondary button label', type: 'text', group: 'Hero', required: true, default: config.hero.ctaSecondary },

    { key: 'api.method', label: 'API method', type: 'text', group: 'API Workspace', default: config.apiPreview.method },
    { key: 'api.endpoint', label: 'API endpoint', type: 'text', group: 'API Workspace', default: config.apiPreview.endpoint },
    { key: 'api.status', label: 'HTTP Status', type: 'text', group: 'API Workspace', default: config.apiPreview.status },
    { key: 'api.latency', label: 'Latency', type: 'text', group: 'API Workspace', default: config.apiPreview.latency },
    { key: 'api.code', label: 'Request code / JSON', type: 'longtext', group: 'API Workspace', default: config.apiPreview.code },
    { key: 'api.response', label: 'Response body', type: 'longtext', group: 'API Workspace', default: config.apiPreview.response },

    {
      key: 'stats', label: 'Platform metrics', type: 'list', group: 'Metrics', minItems: 1, maxItems: 6,
      default: config.stats,
      itemFields: [
        { key: 'value', label: 'Value', type: 'text', required: true },
        { key: 'label', label: 'Label', type: 'text', required: true },
      ],
    },
    {
      key: 'features', label: 'Core feature pillars', type: 'list', group: 'Features', minItems: 1, maxItems: 8,
      default: config.features,
      itemFields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'longtext', required: true },
        { key: 'tag', label: 'Tag', type: 'text', required: true },
      ],
    },
    {
      key: 'comparison', label: 'Platform comparison', type: 'list', group: 'Comparison', minItems: 1, maxItems: 8,
      default: config.comparison,
      itemFields: [
        { key: 'feature', label: 'Capability', type: 'text', required: true },
        { key: 'apidog', label: 'This Platform', type: 'text', required: true },
        { key: 'legacy', label: 'Legacy Tools', type: 'text', required: true },
      ],
    },
    {
      key: 'testimonials', label: 'Developer testimonials', type: 'list', group: 'Testimonials', minItems: 1, maxItems: 6,
      default: config.testimonials,
      itemFields: [
        { key: 'quote', label: 'Quote', type: 'longtext', required: true },
        { key: 'author', label: 'Author name', type: 'text', required: true },
        { key: 'role', label: 'Role', type: 'text', required: true },
        { key: 'company', label: 'Company', type: 'text', required: true },
      ],
    },
    {
      key: 'pricing', label: 'Pricing tiers', type: 'list', group: 'Pricing', minItems: 1, maxItems: 4,
      default: config.pricing,
      itemFields: [
        { key: 'tier', label: 'Plan name', type: 'text', required: true },
        { key: 'price', label: 'Price', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'text', required: true },
      ],
    },
    {
      key: 'faq', label: 'Frequently asked questions', type: 'list', group: 'FAQ', minItems: 1, maxItems: 8,
      default: config.faq,
      itemFields: [
        { key: 'question', label: 'Question', type: 'text', required: true },
        { key: 'answer', label: 'Answer', type: 'longtext', required: true },
      ],
    },

    { key: 'contact.email', label: 'Email', type: 'email', group: 'Contact', required: true, default: 'sales@example.com' },
    { key: 'contact.phone', label: 'Phone', type: 'text', group: 'Contact', default: '+1 (888) 555-0199' },
    { key: 'contact.address', label: 'Address', type: 'text', group: 'Contact', default: '500 Howard Street, Suite 400, San Francisco, CA' },
  ];

  // Home Page
  const homePage: TemplatePage = {
    kind: 'page',
    title: 'Home',
    slug: '',
    content: buildContent('p', [
      // 1. Hero Section with Glow & Pill
      section([
        el('Box', { styles: { alignItems: 'center', textAlign: 'center', gap: '20px', maxWidth: '840px', marginLeft: 'auto', marginRight: 'auto' } }, [
          el('Badge', { props: { text: '{{pill.badge}}', tone: 'primary' }, styles: { padding: '6px 14px', fontSize: '0.875rem' } }),
          heading('{{hero.headline}}', 'h1', { fontSize: '3rem', lineHeight: '1.15', fontWeight: 800 }),
          text('{{hero.subheadline}}', { fontSize: '1.25rem', color: 'var(--fp-muted)', lineHeight: '1.6' }),
          el('Row', { styles: { gap: '16px', justifyContent: 'center', marginTop: '12px' } }, [
            button('{{hero.ctaPrimary}}', '#pricing', 'primary'),
            button('{{hero.ctaSecondary}}', '#api-preview', 'secondary'),
          ]),
        ]),

        // 2. Signature Apidog Code & API Workspace Card
        el('Card', {
          styles: {
            background: 'var(--fp-surface)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '24px',
            marginTop: '36px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.15)',
          },
        }, [
          // Window Control Bar + Endpoint Bar
          el('Row', { styles: { justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' } }, [
            el('Row', { styles: { gap: '8px', alignItems: 'center' } }, [
              el('Box', { styles: { width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' } }),
              el('Box', { styles: { width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' } }),
              el('Box', { styles: { width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' } }),
              text('API Console & Live Playground', { fontSize: '0.8125rem', color: 'var(--fp-muted)', marginLeft: '12px' }),
            ]),
            el('Row', { styles: { gap: '8px', alignItems: 'center' } }, [
              el('Badge', { props: { text: '{{api.status}}', tone: 'success' } }),
              el('Badge', { props: { text: '{{api.latency}}', tone: 'neutral' } }),
            ]),
          ]),

          // Endpoint URL Input Simulation
          el('Row', { styles: { alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '10px 16px', borderRadius: '8px', marginTop: '16px' } }, [
            el('Badge', { props: { text: '{{api.method}}', tone: 'primary' } }),
            text('{{api.endpoint}}', { fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: 600 }),
          ]),

          // Side-by-Side Request & Response Code
          el('Grid', {
            styles: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', marginTop: '16px' },
            responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
          }, [
            el('Box', { styles: { gap: '8px' } }, [
              text('Request Body / Schema', { fontSize: '0.75rem', fontWeight: 700, color: 'var(--fp-muted)', textTransform: 'uppercase' }),
              el('CodeBlock', { props: { code: '{{api.code}}', language: 'json' } }),
            ]),
            el('Box', { styles: { gap: '8px' } }, [
              text('Live Mock Response', { fontSize: '0.75rem', fontWeight: 700, color: 'var(--fp-muted)', textTransform: 'uppercase' }),
              el('CodeBlock', { props: { code: '{{api.response}}', language: 'json' } }),
            ]),
          ]),
        ]),
      ], { paddingTop: '80px', paddingBottom: '40px' }),

      // 3. Stats / Metrics Band
      section([
        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '24px' },
          responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        }, [
          el('Box', { repeat: { list: 'stats', as: 'stat' }, styles: { textAlign: 'center', gap: '6px' } }, [
            heading('{{stat.value}}', 'h2', { fontSize: '2.5rem', fontWeight: 800, color: 'var(--fp-primary)' }),
            text('{{stat.label}}', { color: 'var(--fp-muted)', fontSize: '0.9375rem' }),
          ]),
        ]),
      ], { backgroundColor: 'var(--fp-surface)', paddingTop: '40px', paddingBottom: '40px' }),

      // 4. Feature Pillars Section
      section([
        el('Box', { styles: { textAlign: 'center', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', gap: '12px', marginBottom: '32px' } }, [
          el('Badge', { props: { text: 'Why Choose Us', tone: 'primary' } }),
          heading('Engineered for High-Velocity Teams', 'h2', { fontSize: '2.25rem', fontWeight: 700 }),
          text('Consolidate your disparate toolchain into one cohesive, automated platform.', { color: 'var(--fp-muted)', fontSize: '1.125rem' }),
        ]),
        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' },
          responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        }, [
          el('Card', {
            repeat: { list: 'features', as: 'feature' },
            styles: {
              background: 'var(--fp-surface)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '24px',
              gap: '14px',
              borderRadius: '12px',
            },
          }, [
            el('Badge', { props: { text: '{{feature.tag}}', tone: 'neutral' } }),
            heading('{{feature.title}}', 'h3', { fontSize: '1.25rem', fontWeight: 600 }),
            text('{{feature.description}}', { color: 'var(--fp-muted)', lineHeight: '1.6' }),
          ]),
        ]),
      ], { paddingTop: '64px', paddingBottom: '64px' }),

      // 5. How It Compares Section
      section([
        el('Box', { styles: { textAlign: 'center', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', gap: '12px', marginBottom: '32px' } }, [
          el('Badge', { props: { text: 'Unified Superiority', tone: 'primary' } }),
          heading('Modern Architecture vs Legacy Toolchains', 'h2', { fontSize: '2.25rem', fontWeight: 700 }),
          text('See how a single unified platform eliminates context switching and data drift.', { color: 'var(--fp-muted)', fontSize: '1.125rem' }),
        ]),
        el('Card', {
          styles: {
            background: 'var(--fp-surface)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '24px',
            borderRadius: '16px',
            maxWidth: '900px',
            marginLeft: 'auto',
            marginRight: 'auto',
            width: '100%',
          },
        }, [
          el('Grid', { styles: { gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', fontWeight: 700 } }, [
            text('Platform Feature / Requirement', { fontWeight: 700 }),
            text('{{brand.name}}', { color: 'var(--fp-primary)', fontWeight: 700 }),
            text('Fragmented Legacy Tools', { color: 'var(--fp-muted)', fontWeight: 700 }),
          ]),
          el('Box', { repeat: { list: 'comparison', as: 'row' }, styles: { gap: '0' } }, [
            el('Grid', { styles: { gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' } }, [
              text('{{row.feature}}', { fontWeight: 600 }),
              el('Row', { styles: { gap: '6px', alignItems: 'center' } }, [
                el('Badge', { props: { text: '✓ {{row.apidog}}', tone: 'success' } }),
              ]),
              text('{{row.legacy}}', { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
            ]),
          ]),
        ]),
      ], { backgroundColor: 'var(--fp-surface)', paddingTop: '64px', paddingBottom: '64px' }),

      // 6. Testimonials Section
      section([
        el('Box', { styles: { textAlign: 'center', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', gap: '12px', marginBottom: '32px' } }, [
          el('Badge', { props: { text: 'Social Proof', tone: 'primary' } }),
          heading('Loved by Engineering Leaders Worldwide', 'h2', { fontSize: '2.25rem', fontWeight: 700 }),
          text('Hear how developers ship rock-solid software with zero downtime.', { color: 'var(--fp-muted)', fontSize: '1.125rem' }),
        ]),
        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' },
          responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        }, [
          el('Card', {
            repeat: { list: 'testimonials', as: 'item' },
            styles: {
              background: 'var(--fp-surface)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '24px',
              borderRadius: '12px',
              gap: '16px',
            },
          }, [
            text('"{{item.quote}}"', { fontSize: '1.0625rem', lineHeight: '1.6', fontStyle: 'italic' }),
            el('Box', { styles: { gap: '4px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' } }, [
              text('{{item.author}}', { fontWeight: 700 }),
              text('{{item.role}} · {{item.company}}', { fontSize: '0.8125rem', color: 'var(--fp-muted)' }),
            ]),
          ]),
        ]),
      ], { paddingTop: '64px', paddingBottom: '64px' }),

      // 7. Pricing Section
      section([
        el('Box', { styles: { textAlign: 'center', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', gap: '12px', marginBottom: '36px' } }, [
          el('Badge', { props: { text: 'Transparent Pricing', tone: 'primary' } }),
          heading('Predictable Plans for Any Stage', 'h2', { fontSize: '2.25rem', fontWeight: 700 }),
          text('Start for free with zero credit card required. Upgrade as your team scales.', { color: 'var(--fp-muted)', fontSize: '1.125rem' }),
        ]),
        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px', maxWidth: '1000px', marginLeft: 'auto', marginRight: 'auto' },
          responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        }, [
          el('Card', {
            repeat: { list: 'pricing', as: 'tier' },
            styles: {
              background: 'var(--fp-surface)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '32px 24px',
              borderRadius: '16px',
              gap: '16px',
              textAlign: 'center',
              hoverEffect: 'lift',
              animation: 'fp-slide-up',
              transition: 'all 0.25s ease',
            },
          }, [
            el('Rating', { props: { value: 5, max: 5, min: 1, color: '#f59e0b', showText: true, text: '★ 4.9 Developer Rating' } }),
            heading('{{tier.tier}}', 'h3', { fontSize: '1.5rem', fontWeight: 700 }),
            heading('{{tier.price}}', 'h2', { fontSize: '2.5rem', fontWeight: 800, color: 'var(--fp-primary)' }),
            text('{{tier.description}}', { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
            button('Start with {{tier.tier}}', '/contact', 'primary'),
          ]),
        ]),
      ], { backgroundColor: 'var(--fp-surface)', paddingTop: '64px', paddingBottom: '64px' }),

      // 8. FAQ Section
      section([
        el('Box', { styles: { textAlign: 'center', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', gap: '12px', marginBottom: '32px' } }, [
          el('Badge', { props: { text: 'Got Questions?', tone: 'primary' } }),
          heading('Frequently Asked Questions', 'h2', { fontSize: '2.25rem', fontWeight: 700 }),
          text('Everything you need to know about setup, security, and migration.', { color: 'var(--fp-muted)', fontSize: '1.125rem' }),
        ]),
        el('Box', { styles: { maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto', width: '100%', gap: '12px' } }, [
          el('Accordion', {
            repeat: { list: 'faq', as: 'item' },
            props: { question: '{{item.question}}', answer: '{{item.answer}}' },
          }),
        ]),
      ], { paddingTop: '64px', paddingBottom: '64px' }),

      // 9. High-Impact Gradient CTA Band
      section([
        el('Box', { styles: { alignItems: 'center', textAlign: 'center', gap: '20px', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' } }, [
          heading('Ready to Elevate Your Engineering Speed?', 'h2', { fontSize: '2.5rem', fontWeight: 800 }),
          text('Join over 500,000 developers worldwide who build, test, and ship with confidence.', { fontSize: '1.125rem', color: 'rgba(255,255,255,0.9)' }),
          el('Row', { styles: { gap: '16px', justifyContent: 'center' } }, [
            button('Get Started for Free', '#pricing', 'primary'),
            button('Talk to Engineering Team', '/contact', 'secondary'),
          ]),
        ]),
      ], {
        background: 'linear-gradient(135deg, var(--fp-primary), var(--fp-secondary))',
        paddingTop: '64px',
        paddingBottom: '64px',
      }),
    ]),
  };

  // Features Deep-Dive Page
  const featuresPage: TemplatePage = {
    kind: 'page',
    title: 'Features',
    slug: 'features',
    content: buildContent('f_p', [
      section([
        el('Box', { styles: { textAlign: 'center', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto', gap: '16px' } }, [
          el('Badge', { props: { text: 'Full Platform Capabilities', tone: 'primary' } }),
          heading('The Complete API Lifecycle in One Place', 'h1', { fontSize: '2.75rem', fontWeight: 800 }),
          text('From visual API schema design to automated CI/CD regression suites and instant documentation.', { color: 'var(--fp-muted)', fontSize: '1.25rem' }),
        ]),
      ], { paddingTop: '64px', paddingBottom: '32px' }),

      section([
        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '32px' },
          responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        }, [
          el('Card', { styles: { background: 'var(--fp-surface)', padding: '32px', borderRadius: '16px', gap: '16px' } }, [
            el('Badge', { props: { text: 'API Design & Modeling', tone: 'primary' } }),
            heading('Zero-Code Visual Schema Modeler', 'h3', { fontSize: '1.5rem', fontWeight: 700 }),
            text('Design REST, GraphQL, and gRPC contracts collaboratively. Two-way synchronization with OpenAPI 3.0 / 3.1 and Swagger specs.', { color: 'var(--fp-muted)' }),
            el('CodeBlock', { props: { code: '{\n  "openapi": "3.1.0",\n  "info": { "title": "Petstore API", "version": "1.0.0" },\n  "paths": { ... }\n}', language: 'json' } }),
          ]),
          el('Card', { styles: { background: 'var(--fp-surface)', padding: '32px', borderRadius: '16px', gap: '16px' } }, [
            el('Badge', { props: { text: 'Smart Mock Engine', tone: 'success' } }),
            heading('Realistic Dynamic Mocking', 'h3', { fontSize: '1.5rem', fontWeight: 700 }),
            text('Generate frontend and mobile stubs with Faker.js data generators, simulated network latency, and conditional status codes without writing backend code.', { color: 'var(--fp-muted)' }),
            el('CodeBlock', { props: { code: '// Dynamic Mock Rule\n{\n  "status": 200,\n  "data|5-10": [{\n    "id": "@id",\n    "name": "@name",\n    "email": "@email"\n  }]\n}', language: 'json' } }),
          ]),
        ]),
      ], { paddingBottom: '64px' }),
    ]),
  };

  // Documentation / Quickstart Page
  const docsPage: TemplatePage = {
    kind: 'page',
    title: 'Documentation',
    slug: 'docs',
    content: buildContent('d_p', [
      section([
        el('Box', { styles: { textAlign: 'center', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto', gap: '16px' } }, [
          el('Badge', { props: { text: 'Developer Docs & SDKs', tone: 'primary' } }),
          heading('Developer Quickstart & Guides', 'h1', { fontSize: '2.75rem', fontWeight: 800 }),
          text('Integrate our endpoints, SDKs, and webhook relays into your application in minutes.', { color: 'var(--fp-muted)', fontSize: '1.25rem' }),
        ]),
      ], { paddingTop: '64px', paddingBottom: '32px' }),

      section([
        el('Card', { styles: { background: 'var(--fp-surface)', padding: '32px', borderRadius: '16px', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto', width: '100%', gap: '16px' } }, [
          heading('Authentication Header', 'h3', { fontSize: '1.25rem' }),
          text('Pass your API key in the Authorization header of every request:', { color: 'var(--fp-muted)' }),
          el('CodeBlock', { props: { code: 'curl -X GET "https://api.v4/v1/health" \\\n  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \\\n  -H "Content-Type: application/json"', language: 'bash' } }),
          el('Callout', { props: { title: 'Security Best Practice', text: 'Never commit secret keys to public client bundles or version control.', tone: 'warning' } }),
        ]),
      ], { paddingBottom: '64px' }),
    ]),
  };

  // Contact Page
  const contactPage: TemplatePage = {
    kind: 'page',
    title: 'Contact',
    slug: 'contact',
    content: buildContent('c_p', [
      section([
        el('Box', { styles: { textAlign: 'center', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto', gap: '14px' } }, [
          el('Badge', { props: { text: 'Talk with Us', tone: 'primary' } }),
          heading('Connect with Our Engineering Specialists', 'h1', { fontSize: '2.5rem', fontWeight: 800 }),
          text('Have questions about enterprise SLAs, custom on-prem deployments, or migration?', { color: 'var(--fp-muted)', fontSize: '1.125rem' }),
        ]),
      ], { paddingTop: '64px', paddingBottom: '32px' }),

      section([
        el('Card', { styles: { background: 'var(--fp-surface)', padding: '36px', borderRadius: '16px', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto', width: '100%', gap: '18px' } }, [
          el('Form', {}, [
            el('FormField', { props: { name: 'fullName', label: 'Full name', inputType: 'text', required: true } }),
            el('FormField', { props: { name: 'workEmail', label: 'Work email', inputType: 'email', required: true } }),
            el('FormField', { props: { name: 'company', label: 'Company name', inputType: 'text', required: true } }),
            el('FormField', { props: { name: 'teamSize', label: 'Engineering team size', inputType: 'select', options: ['1-10 developers', '11-50 developers', '51-200 developers', '200+ developers'] } }),
            el('FormField', { props: { name: 'notes', label: 'How can we help your team?', inputType: 'textarea' } }),
            el('Button', { props: { text: 'Request Architecture Consultation', action: 'submit', variant: 'primary' } }),
          ]),
        ]),
      ], { paddingBottom: '64px' }),
    ]),
  };

  return {
    id: config.id,
    type: 'website',
    version: 1,
    title: config.title,
    description: config.description,
    category: config.category,
    tags: config.tags,
    titleVariable: 'brand.name',
    themes: [config.theme, THEME_MIDNIGHT, THEME_INDIGO, THEME_EMERALD, THEME_MONO],
    variables,
    pages: [homePage, featuresPage, docsPage, contactPage, apidogHeader(), apidogFooter()],
  };
}

// ---- 6 Industry Website Templates -------------------------------------------

// 1. Developer Tools & API Management Platform
export const TEMPLATE_APIDOG_DEVTOOLS = createApidogWebsite({
  id: 'website-apidog-devtools',
  title: 'Apidog - All-in-One API Development Platform',
  description: 'Design, debug, mock, test, and document APIs 10x faster in one unified developer workspace.',
  category: 'Developer Tools',
  tags: ['apidog', 'api', 'developer', 'devtools', 'testing', 'mocking', 'documentation'],
  theme: THEME_APIDOG_DEVTOOLS,
  brand: ['Apidog Studio', 'The All-in-One API Platform'],
  pillBadge: '⚡ Next-Gen All-in-One API Platform — v4.2 Released',
  hero: {
    headline: 'Stop Juggling 5 API Tools. Meet the Unified Platform.',
    subheadline: 'Design OpenAPI specifications, execute live debugging, spin up smart mock servers, and run automated CI/CD testing — all in one lightning-fast developer hub.',
    ctaPrimary: 'Get Started for Free',
    ctaSecondary: 'Explore Interactive Demo',
  },
  apiPreview: {
    method: 'POST',
    endpoint: 'https://api.v4/v1/workspaces/verify-schema',
    status: '200 OK',
    latency: '24ms',
    code: '{\n  "spec": "openapi:3.1.0",\n  "validateStrict": true,\n  "autoMock": true\n}',
    response: '{\n  "valid": true,\n  "endpointsCount": 48,\n  "mockServerUrl": "https://mock.apidog.run/p12"\n}',
  },
  stats: [
    { value: '1,000,000+', label: 'Active Developers' },
    { value: '10x', label: 'Faster API Iteration' },
    { value: '99.99%', label: 'Mock Server Uptime' },
    { value: '50M+', label: 'Requests Tested Daily' },
  ],
  features: [
    { tag: 'Design', title: 'Visual OpenAPI Modeler', description: 'Collaboratively construct schema trees with full OpenAPI 3.1 & Swagger bidirectional syncing.' },
    { tag: 'Debug', title: 'Real-Time API Debugger', description: 'Zero-latency request execution, dynamic environment variables, and visual assertion inspectors.' },
    { tag: 'Mock', title: 'Smart Virtual Mock Server', description: 'Instant mock servers generating lifelike Faker.js payloads without writing a single line of backend stub code.' },
    { tag: 'Test', title: 'Automated CI/CD Test Suites', description: 'Execute comprehensive regression, performance, and boundary tests directly within GitHub Actions.' },
    { tag: 'Docs', title: 'Gorgeous Interactive Docs', description: 'Auto-publish branded, responsive API documentation with one-click interactive try-it-out consoles.' },
    { tag: 'Gateway', title: 'Protocol Agnostic', description: 'Seamlessly test REST, GraphQL, WebSocket, gRPC, and SSE protocols in one unified client.' },
  ],
  comparison: [
    { feature: 'All-in-One Workspace', apidog: 'Design + Debug + Mock + Test + Docs', legacy: '5 disparate disconnected tools' },
    { feature: 'Real-Time Schema Sync', apidog: 'Automatic across all team members', legacy: 'Manual copy-pasting JSON files' },
    { feature: 'Smart Dynamic Mocking', apidog: 'Zero-code Faker.js engine built-in', legacy: 'Requires complex local mock servers' },
    { feature: 'CI/CD Automation', apidog: 'Native CLI & GitHub Action', legacy: 'Fragile third-party script integrations' },
    { feature: 'Per-Seat Pricing', apidog: 'Transparent flat team pricing', legacy: 'Expensive per-user penalties' },
  ],
  testimonials: [
    { quote: 'Apidog eliminated 4 separate subscriptions and slashed our API onboarding time from 3 days to under 20 minutes.', author: 'Alex Chen', role: 'Head of Infrastructure', company: 'HyperScale Systems' },
    { quote: 'The smart mock engine allows our frontend and iOS teams to build months ahead of backend implementation.', author: 'Sarah Jenkins', role: 'Staff Software Architect', company: 'CloudFlow Labs' },
    { quote: 'Automated regression test suites catch breaking schema changes before pull requests even land in staging.', author: 'Marcus Vance', role: 'VP of Engineering', company: 'FinPulse Tech' },
  ],
  pricing: [
    { tier: 'Starter', price: '$0', description: 'Free forever for individual engineers and open source contributors.' },
    { tier: 'Team Pro', price: '$12/mo', description: 'Ideal for fast-moving engineering teams needing shared workspaces.' },
    { tier: 'Enterprise', price: '$49/mo', description: 'Dedicated SSO, audit logs, on-prem runner nodes, and 99.99% SLA.' },
  ],
  faq: [
    { question: 'Can I import my existing Postman collections and OpenAPI files?', answer: 'Yes! Apidog imports Postman, Swagger, Insomnia, and HAR collections with full environment variables and script compatibility in one click.' },
    { question: 'Does the mock server require running local background processes?', answer: 'No. Apidog provides both instant cloud mock URLs and local CLI mock daemon options depending on your security policy.' },
    { question: 'Is Apidog compliant with SOC2 and GDPR?', answer: 'Yes, Apidog is fully SOC2 Type II certified, GDPR compliant, and encrypts all stored credentials using AES-256 GCM.' },
  ],
});

// 2. FinTech & Banking API Hub
export const TEMPLATE_APIDOG_FINTECH = createApidogWebsite({
  id: 'website-apidog-fintech',
  title: 'FinVault - Banking & Payments Infrastructure API',
  description: 'Bank-grade payment rails, double-entry ledgers, and PCI-DSS Level 1 compliant financial APIs.',
  category: 'Finance and FinTech',
  tags: ['fintech', 'banking', 'payments', 'api', 'pci-dss', 'ledger', 'apidog'],
  theme: THEME_APIDOG_FINTECH,
  brand: ['FinVault Systems', 'Next-Gen Banking Rails'],
  pillBadge: '⚡ PCI-DSS Level 1 Certified Banking Infrastructure',
  hero: {
    headline: 'Programmatic Financial Infrastructure for Modern Global Scale',
    subheadline: 'Issue virtual cards, execute instant cross-border settlement, and automate ledger reconciliation with sub-millisecond bank-grade APIs.',
    ctaPrimary: 'Access Developer Sandbox',
    ctaSecondary: 'Read API Specification',
  },
  apiPreview: {
    method: 'POST',
    endpoint: 'https://api.finvault.io/v2/transfers/instant',
    status: '201 Created',
    latency: '18ms',
    code: '{\n  "sourceAccount": "acc_vault_8892",\n  "destination": "iban_eu_4402",\n  "amount": 250000,\n  "currency": "EUR"\n}',
    response: '{\n  "transferId": "tr_99182a",\n  "status": "SETTLED_INSTANT",\n  "clearingNetwork": "SEPA_INSTANT"\n}',
  },
  stats: [
    { value: '$45B+', label: 'Annual Volume Processed' },
    { value: '99.999%', label: 'Infrastructure Uptime' },
    { value: '< 20ms', label: 'Average Ledger Latency' },
    { value: '140+', label: 'Countries Supported' },
  ],
  features: [
    { tag: 'Ledger', title: 'Immutable Double-Entry Ledger', description: 'Zero-drift balance tracking with cryptographic auditing and microsecond atomic guarantees.' },
    { tag: 'Issuance', title: 'Virtual & Physical Card APIs', description: 'Programmatic spend rules, dynamic MCC authorization limits, and instant mobile wallet provisioning.' },
    { tag: 'Compliance', title: 'Built-in Automated AML/KYC', description: 'Real-time sanctions screening, identity verification, and anti-fraud neural scoring.' },
    { tag: 'Settlement', title: 'Multi-Currency Clearing Rails', description: 'Direct clearing connectivity to FedNow, SEPA Instant, RTP, and Faster Payments.' },
    { tag: 'Webhooks', title: 'Guaranteed At-Least-Once Delivery', description: 'Cryptographically signed webhook notifications with automatic backoff and replay inspection.' },
    { tag: 'Sandbox', title: 'Deterministic Testing Sandbox', description: 'Simulate chargebacks, wire delays, KYC rejections, and settlement events on demand.' },
  ],
  comparison: [
    { feature: 'Ledger Architecture', apidog: 'Immutable, cryptographically verifiable', legacy: 'Batch SQL nightly jobs with drift' },
    { feature: 'Sandbox Fidelity', apidog: '100% feature match with production', legacy: 'Outdated mock endpoints' },
    { feature: 'PCI Compliance', apidog: 'Turnkey Level 1 PCI-DSS tokens', legacy: 'Requires massive compliance audit burden' },
    { feature: 'Settlement Speed', apidog: 'Real-time instant rails', legacy: 'T+2 business days settlement delay' },
  ],
  testimonials: [
    { quote: 'FinVault allowed our neo-bank to launch checking and debit cards in 6 weeks instead of 18 months.', author: 'Elena Rostova', role: 'CTO', company: 'NovaPay Global' },
    { quote: 'The deterministic sandbox and sub-millisecond ledger response times made our regulatory audit seamless.', author: 'David Sterling', role: 'Chief Risk Officer', company: 'Apex Capital' },
  ],
  pricing: [
    { tier: 'Sandbox', price: '$0', description: 'Unlimited test transactions in our sandbox environment.' },
    { tier: 'Production Core', price: '0.15%', description: 'Per successful transfer with zero monthly minimums.' },
    { tier: 'Enterprise Tier', price: 'Custom', description: 'Dedicated clearing corridors, sub-cent pricing, and private HSM.' },
  ],
  faq: [
    { question: 'Is FinVault compliant with international banking regulations?', answer: 'Yes, FinVault holds SOC1, SOC2 Type II, ISO 27001, and PCI-DSS Level 1 certifications.' },
    { question: 'How quickly can we begin processing live payments?', answer: 'After automated KYC approval, live API keys can be activated in under 48 hours.' },
  ],
});

// 3. AI & LLM Inference Cloud Platform
export const TEMPLATE_APIDOG_AI = createApidogWebsite({
  id: 'website-apidog-ai',
  title: 'NeuroAPI - AI Cloud & LLM Inference Gateway',
  description: 'Deploy, orchestrate, and evaluate multimodal foundation models and autonomous AI agents with microsecond latency.',
  category: 'Artificial Intelligence',
  tags: ['ai', 'llm', 'agents', 'cloud', 'inference', 'rag', 'apidog'],
  theme: THEME_APIDOG_AI,
  brand: ['NeuroAPI Cloud', 'Enterprise Agentic Intelligence'],
  pillBadge: '⚡ Next-Gen LLM Routing & Microsecond Speculative Inference',
  hero: {
    headline: 'Unified Gateway for Multimodal AI & Autonomous Agents',
    subheadline: 'Route between top foundation models, stream real-time tokens, execute semantic RAG lookups, and monitor prompt latency across all your deployments.',
    ctaPrimary: 'Claim 1M Free Tokens',
    ctaSecondary: 'View Model Benchmark',
  },
  apiPreview: {
    method: 'POST',
    endpoint: 'https://api.neuroapi.cloud/v1/chat/completions',
    status: '200 OK',
    latency: '38ms',
    code: '{\n  "model": "neuro-agent-ultra",\n  "messages": [{ "role": "user", "content": "Analyze quarterly report" }],\n  "stream": true\n}',
    response: '{\n  "id": "chatcmpl_987",\n  "tokensPerSecond": 142,\n  "ttft": "42ms",\n  "finishReason": "stop"\n}',
  },
  stats: [
    { value: '140+ T/s', label: 'Average Token Output' },
    { value: '42ms', label: 'Time To First Token (TTFT)' },
    { value: '99.99%', label: 'Gateway Availability' },
    { value: '500B+', label: 'Monthly Tokens Routed' },
  ],
  features: [
    { tag: 'Routing', title: 'Smart Cost & Latency Router', description: 'Dynamically routes incoming prompts to the fastest or cheapest model provider with zero downtime failovers.' },
    { tag: 'Cache', title: 'Semantic Prompt Caching', description: 'Cut inference expenses by up to 80% using vector similarity cache hits for recurring queries.' },
    { tag: 'Guardrails', title: 'Zero-Latency Safety Filters', description: 'Real-time PII redaction, prompt injection prevention, and hallucination monitoring.' },
    { tag: 'Agents', title: 'Multi-Agent Tool Orchestration', description: 'Declarative OpenAPI function calling, web browsing actions, and sandboxed code execution environments.' },
    { tag: 'RAG', title: 'Ultra-Dense Vector Embeddings', description: 'Millisecond hybrid keyword and semantic vector search with integrated re-ranking.' },
    { tag: 'Analytics', title: 'Deep Token Observability', description: 'Inspect token distributions, per-user quotas, system prompts, and full trace replays.' },
  ],
  comparison: [
    { feature: 'Model Fallback Routing', apidog: 'Automatic multi-cloud failover (<10ms)', legacy: 'Hard crashes when single provider drops' },
    { feature: 'Semantic Prompt Cache', apidog: 'Built-in vector cache (up to 80% savings)', legacy: 'Pay 100% for duplicate queries' },
    { feature: 'Enterprise Privacy', apidog: 'Zero data retention (ZDR) guarantee', legacy: 'Data used for vendor re-training' },
  ],
  testimonials: [
    { quote: 'NeuroAPI reduced our generative AI cloud bill by 65% while dropping response times under 50ms.', author: 'Dr. Liam Thorne', role: 'VP of AI', company: 'Synthetica Corp' },
    { quote: 'The unified API interface meant our engineers could switch models in production with a single config flag.', author: 'Maya Patel', role: 'Head of Engineering', company: 'Nexus Automations' },
  ],
  pricing: [
    { tier: 'Developer', price: '$0', description: '1,000,000 free tokens monthly across all open models.' },
    { tier: 'Growth Team', price: '$49/mo', description: 'Semantic caching, dedicated rate limits, and custom guardrails.' },
    { tier: 'Enterprise AI', price: 'Custom', description: 'Dedicated GPU clusters, on-prem VPC deployment, and custom LoRA adapters.' },
  ],
  faq: [
    { question: 'Is our prompt and customer data retained for training?', answer: 'Never. NeuroAPI operates under strict zero-data-retention (ZDR) policies backed by legal SLA guarantees.' },
    { question: 'Does NeuroAPI support OpenAI-compatible SDKs?', answer: 'Yes! Simply point your standard OpenAI, LangChain, or LlamaIndex baseUrl to NeuroAPI.' },
  ],
});

// 4. HealthTech & Clinical Interoperability Platform
export const TEMPLATE_APIDOG_HEALTHCARE = createApidogWebsite({
  id: 'website-apidog-healthcare',
  title: 'PulseHL7 - Healthcare Interoperability & FHIR API',
  description: 'HIPAA-compliant, zero-knowledge clinical data interchange and EHR interoperability suite for modern healthcare systems.',
  category: 'Healthcare & Life Sciences',
  tags: ['healthcare', 'fhir', 'hipaa', 'medical', 'clinical', 'ehr', 'apidog'],
  theme: THEME_APIDOG_HEALTHCARE,
  brand: ['PulseHL7 Health', 'Universal Clinical Data API'],
  pillBadge: '⚡ Certified HIPAA, SOC2 & FHIR R4 Compliant Medical Suite',
  hero: {
    headline: 'Unified FHIR & HL7 APIs for Modern Clinical Systems',
    subheadline: 'Bridge Electronic Health Records (EHR), patient telemetry, laboratory results, and clinical imaging with encrypted, zero-knowledge interoperability.',
    ctaPrimary: 'Request Provider Access',
    ctaSecondary: 'Read FHIR Specifications',
  },
  apiPreview: {
    method: 'GET',
    endpoint: 'https://fhir.pulsehl7.net/r4/Patient/pat_990142/Observation',
    status: '200 OK',
    latency: '26ms',
    code: '{\n  "category": "vital-signs",\n  "dateRange": "2026-Q1",\n  "decryptPHI": true\n}',
    response: '{\n  "resourceType": "Bundle",\n  "total": 12,\n  "entry": [{ "code": "8867-4", "display": "Heart Rate", "value": 72 }]\n}',
  },
  stats: [
    { value: '100% HIPAA', label: 'Compliance Certified' },
    { value: '250M+', label: 'Patient Records Linked' },
    { value: '500+', label: 'EHR Systems Integrated' },
    { value: '99.99%', label: 'Clinical Uptime SLA' },
  ],
  features: [
    { tag: 'FHIR', title: 'Certified FHIR R4 & HL7 v2', description: 'Complete turnkey support for Patient, Encounter, Observation, and DiagnosticReport FHIR profiles.' },
    { tag: 'EHR', title: 'Epic, Cerner & Allscripts Sync', description: 'Bi-directional read and write connectors to the world’s leading Electronic Health Record systems.' },
    { tag: 'Security', title: 'End-to-End PHI Encryption', description: 'Field-level AES-256 GCM encryption ensuring patient health information is never visible in plaintext.' },
    { tag: 'Telemetry', title: 'Medical IoT & Telehealth Relays', description: 'Real-time telemetry ingestion from smart monitors, wearables, and remote patient monitoring devices.' },
  ],
  comparison: [
    { feature: 'EHR Integration Time', apidog: '2 business days with unified FHIR', legacy: '6 to 12 months manual HL7 interface builds' },
    { feature: 'PHI Security', apidog: 'Zero-knowledge field-level encryption', legacy: 'Vulnerable plaintext middleware caches' },
    { feature: 'Compliance Guarantee', apidog: 'HIPAA BAA signed upfront', legacy: 'Unclear shared liability models' },
  ],
  testimonials: [
    { quote: 'PulseHL7 connected our clinical trial platform to Epic and Cerner in less than a week.', author: 'Dr. Rebecca Foster', role: 'Chief Information Officer', company: 'Apex Health Network' },
  ],
  pricing: [
    { tier: 'Community Care', price: '$0', description: 'Full sandbox environment with synthetic patient test profiles.' },
    { tier: 'Clinic Pro', price: '$249/mo', description: 'Production HIPAA environment with BAA, audit logs, and up to 10k patient queries.' },
    { tier: 'Health System', price: 'Enterprise', description: 'Unlimited patient queries, on-prem connectors, and dedicated clinical engineers.' },
  ],
  faq: [
    { question: 'Do you execute Business Associate Agreements (BAA)?', answer: 'Yes, we execute signed HIPAA BAAs for all production customers on our platform.' },
  ],
});

// 5. Cybersecurity & DevSecOps Platform
export const TEMPLATE_APIDOG_SECURITY = createApidogWebsite({
  id: 'website-apidog-cybersecurity',
  title: 'AegisSec - Zero-Trust API Security & Runtime Defense',
  description: 'Automated vulnerability scanning, OWASP API Top 10 mitigation, OAuth2 security posture, and real-time threat intelligence.',
  category: 'Security & DevSecOps',
  tags: ['security', 'cybersecurity', 'devsecops', 'oauth2', 'zero-trust', 'apidog'],
  theme: THEME_APIDOG_SECURITY,
  brand: ['AegisSec Guard', 'Zero-Trust API Security'],
  pillBadge: '⚡ Active Defense Against OWASP API Top 10 Vulnerabilities',
  hero: {
    headline: 'Continuous Zero-Trust Security for Your Entire API Perimeter',
    subheadline: 'Detect shadow APIs, stop broken object level authorization (BOLA) attacks in real time, and enforce cryptographic token postures across all microservices.',
    ctaPrimary: 'Run Free API Security Scan',
    ctaSecondary: 'Read Threat Intelligence',
  },
  apiPreview: {
    method: 'POST',
    endpoint: 'https://security.aegissec.com/v1/scan/inspect-perimeter',
    status: '200 OK',
    latency: '31ms',
    code: '{\n  "targetGateway": "api.production.internal",\n  "ruleset": "OWASP-API-2026",\n  "checkBOLA": true\n}',
    response: '{\n  "threatLevel": "SECURE",\n  "shadowApisFound": 0,\n  "jwtEntropy": "EXCELLENT",\n  "attackBlocked": 142\n}',
  },
  stats: [
    { value: '1.2B+', label: 'Malicious Requests Thwarted' },
    { value: '< 1ms', label: 'Inline Inspection Overhead' },
    { value: '0', label: 'Zero-Day BOLA Breaches' },
    { value: '100%', label: 'OWASP API Top 10 Coverage' },
  ],
  features: [
    { tag: 'Posture', title: 'Shadow API Discovery', description: 'Continuously maps rogue endpoints, undocumented microservices, and unauthenticated legacy routes.' },
    { tag: 'BOLA', title: 'Behavioral BOLA/BFLA Defense', description: 'Machine learning inspection stops broken object level authorization attempts before data exfiltration occurs.' },
    { tag: 'Auth', title: 'Cryptographic Token Auditing', description: 'Enforces JWT expiry, prevents signature stripping, and validates cryptographic token entropy.' },
    { tag: 'WAF', title: 'DDoS & Credential Stuffing Shield', description: 'Adaptive rate limiting and distributed proof-of-work challenges that repel automated botnets.' },
  ],
  comparison: [
    { feature: 'BOLA Attack Detection', apidog: 'Inline behavioral analysis in <1ms', legacy: 'Blind to authorization logic flaws' },
    { feature: 'Shadow API Detection', apidog: 'Autonomous continuous discovery', legacy: 'Requires manual spreadsheet auditing' },
  ],
  testimonials: [
    { quote: 'AegisSec discovered three legacy unauthenticated endpoints within 15 minutes of deployment.', author: 'Jonathan Croft', role: 'Head of Information Security', company: 'Vanguard Systems' },
  ],
  pricing: [
    { tier: 'Vulnerability Scan', price: '$0', description: 'Scan up to 5 public domains and receive an instant security scorecard.' },
    { tier: 'Cloud Shield', price: '$99/mo', description: 'Real-time inline inspection, BOLA prevention, and automated Slack alerts.' },
    { tier: 'Defense Prime', price: 'Enterprise', description: 'Private Kubernetes sidecars, custom compliance reports, and 24/7 SOC response.' },
  ],
  faq: [
    { question: 'Does AegisSec add latency to our API traffic?', answer: 'No. Our eBPF and edge sidecar architecture operates with less than 0.8ms average latency impact.' },
  ],
});

// 6. Headless E-Commerce & Retail Engine
export const TEMPLATE_APIDOG_ECOMMERCE = createApidogWebsite({
  id: 'website-apidog-ecommerce',
  title: 'HyperCart - Headless Commerce & Omni-Channel API',
  description: 'Ultra-fast product catalogs, global multi-currency checkouts, inventory sync webhooks, and omnichannel commerce at edge scale.',
  category: 'E-Commerce and Retail',
  tags: ['ecommerce', 'headless', 'retail', 'cart', 'checkout', 'api', 'apidog'],
  theme: THEME_APIDOG_ECOMMERCE,
  brand: ['HyperCart API', 'High-Velocity Headless Commerce'],
  pillBadge: '⚡ Global Edge Caching & Sub-50ms Cart Checkout Speed',
  hero: {
    headline: 'High-Velocity Headless Commerce Built for Modern Retail',
    subheadline: 'Power lightning-fast mobile storefronts, unified omni-channel inventory, and localized international checkouts with our developer-first API engine.',
    ctaPrimary: 'Start Building Storefront',
    ctaSecondary: 'View GraphQL Sandbox',
  },
  apiPreview: {
    method: 'POST',
    endpoint: 'https://commerce.hypercart.dev/v3/checkouts/instant',
    status: '200 OK',
    latency: '22ms',
    code: '{\n  "cartId": "cart_99182",\n  "currency": "USD",\n  "paymentMethod": "apple_pay",\n  "applyPromo": "SPRING26"\n}',
    response: '{\n  "orderId": "ord_88291",\n  "status": "CONFIRMED",\n  "fulfillmentEstimate": "2-days"\n}',
  },
  stats: [
    { value: '50ms', label: 'Average Edge Checkout' },
    { value: '$1.8B+', label: 'Gross Merchandise Volume' },
    { value: '99.999%', label: 'Black Friday Peak Uptime' },
    { value: '180+', label: 'Supported Global Currencies' },
  ],
  features: [
    { tag: 'Catalog', title: 'Sub-Millisecond Search & Filters', description: 'Edge-replicated product catalogs with instant faceted search, multi-language titles, and custom variants.' },
    { tag: 'Checkout', title: 'Optimistic Localized Checkout', description: 'One-click Apple Pay, Google Pay, Klarna, and localized banking rails across 180+ global markets.' },
    { tag: 'Inventory', title: 'Real-Time Inventory Synchronization', description: 'Zero-overselling stock locks and instant webhooks connecting warehouses, POS, and digital storefronts.' },
    { tag: 'Extensibility', title: 'Webhook-Driven Microservices', description: 'Trigger ERP updates, custom loyalty point credits, and automated fulfillment workflows seamlessly.' },
  ],
  comparison: [
    { feature: 'Storefront Latency', apidog: '< 50ms globally distributed at edge', legacy: '800ms - 2000ms bloated legacy monoliths' },
    { feature: 'Omnichannel Inventory', apidog: 'Sub-second real-time atomicity', legacy: 'Nightly batch sync causes overselling' },
  ],
  testimonials: [
    { quote: 'HyperCart helped us migrate off our slow legacy store and doubled our mobile conversion rates.', author: 'Chloe Bennett', role: 'VP of Digital', company: 'LuxeLiving Brands' },
  ],
  pricing: [
    { tier: 'Developer Sandbox', price: '$0', description: 'Full access to test catalogs and mock payment gateways.' },
    { tier: 'Growth Store', price: '$79/mo', description: 'Up to $100k monthly GMV, edge caching, and automated webhooks.' },
    { tier: 'Enterprise Retail', price: 'Custom', description: 'Zero GMV transaction percentage, dedicated SLA, and private database shards.' },
  ],
  faq: [
    { question: 'Can we use HyperCart with Next.js, Remix, or mobile apps?', answer: 'Yes! HyperCart is 100% headless with first-class TypeScript, React, Swift, and Kotlin SDKs.' },
  ],
});

export const APIDOG_WEBSITE_TEMPLATES: TemplateDefinition[] = [
  TEMPLATE_APIDOG_DEVTOOLS,
  TEMPLATE_APIDOG_FINTECH,
  TEMPLATE_APIDOG_AI,
  TEMPLATE_APIDOG_HEALTHCARE,
  TEMPLATE_APIDOG_SECURITY,
  TEMPLATE_APIDOG_ECOMMERCE,
];
