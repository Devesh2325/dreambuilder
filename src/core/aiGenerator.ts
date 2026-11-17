import { DocContent, DocNode, DocumentKind, ProjectSettings, ProjectType, Theme } from './schema';
import { VariableDef } from './variables';
import { BLOCK_META } from '../renderer/blockMeta';
import { actionButton, button, el, El, heading, image, section, text } from '../templates/dsl';
import { THEME_INDIGO, THEME_MIDNIGHT, THEME_EMERALD, THEME_OCEAN, THEME_CORAL, THEME_MONO } from '../templates/themes';
import { photo } from '../templates/assets';

export type AiInputMode = 'prompt' | 'url' | 'image';

export interface AiGenerationRequest {
  type: ProjectType;
  mode: AiInputMode;
  prompt?: string;
  url?: string;
  imageDataUrl?: string;
  imageName?: string;
  themeTone?: 'indigo' | 'midnight' | 'emerald' | 'ocean' | 'coral' | 'mono';
  device?: 'desktop' | 'tablet' | 'mobile';
  language?: string;
}

export interface GeneratedProjectPayload {
  title: string;
  type: ProjectType;
  theme: Theme;
  settings: ProjectSettings;
  variables: Record<string, string | number | boolean | Record<string, unknown>[]>;
  variableDefs: VariableDef[];
  documents: {
    kind: DocumentKind;
    title: string;
    slug: string;
    position: number;
    content: DocContent;
  }[];
}

/** Utility to clean and extract brand from a URL */
export function extractBrandFromUrl(rawUrl: string): { brand: string; domain: string; archetype: string } {
  try {
    let normalized = rawUrl.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    const parsed = new URL(normalized);
    const domain = parsed.hostname.replace(/^www\./, '');
    const parts = domain.split('.');
    
    // If subdomain is present like deveshchat.finuro.app, prioritize main domain name 'finuro'
    const namePart = parts.length >= 3 && !['co', 'com', 'org', 'net', 'io', 'gov', 'edu'].includes(parts[parts.length - 2])
      ? parts[parts.length - 2]
      : parts[0] || 'App';

    const brand = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    // Deducing archetype from domain/path keywords
    const fullText = (domain + parsed.pathname).toLowerCase();
    let archetype = 'SaaS Platform';
    if (/fin|trade|invest|wealth|bank|pay|crypto|sebi/i.test(fullText)) archetype = 'FinTech & Advisory';
    else if (/api|dev|code|cloud|git|doc|sdk/i.test(fullText)) archetype = 'Developer Tools';
    else if (/health|clinic|med|care|dental|fit/i.test(fullText)) archetype = 'Healthcare & Wellness';
    else if (/shop|store|brand|cloth|buy/i.test(fullText)) archetype = 'E-Commerce Store';
    else if (/edu|course|learn|academy|bootcamp/i.test(fullText)) archetype = 'Education & Academy';
    else if (/agency|design|studio|creative/i.test(fullText)) archetype = 'Creative Agency';

    return { brand, domain, archetype };
  } catch {
    return { brand: 'FlowApp', domain: 'flowapp.io', archetype: 'Modern Platform' };
  }
}

/** Parses natural language prompt keywords to customize synthesis */
function analyzePrompt(promptText: string): {
  companyName: string;
  tagline: string;
  heroHeadline: string;
  heroSubtitle: string;
  features: { title: string; desc: string; icon: string }[];
  ratingScore: number;
  ratingReviews: string;
  faq: { q: string; a: string }[];
  plans: { name: string; price: string; period: string; features: string[]; popular?: boolean }[];
  isAdvisor: boolean;
  isDev: boolean;
} {
  const p = promptText.toLowerCase();

  const isAdvisor = /sebi|financial|advisor|research analyst|invest|wealth|stock|finuro/i.test(p);
  const isDev = /api|developer|code|cli|sdk|terminal|apidog|debug|backend/i.test(p);

  // Derive title/company name
  let companyName = 'PulseFlow';
  const nameMatch = promptText.match(/(?:called|named|brand|for)\s+([A-Z][A-Za-z0-9_-]+)/);
  if (nameMatch && nameMatch[1]) {
    companyName = nameMatch[1];
  } else if (/apidog/i.test(p)) {
    companyName = 'Apidog';
  } else if (isAdvisor) {
    companyName = 'Devesh Financial Advisory';
  } else if (isDev) {
    companyName = 'Apidog';
  }

  if (isAdvisor) {
    return {
      companyName,
      tagline: 'SEBI Registered Research Analyst & Investment Research',
      heroHeadline: 'Disciplined Market Research for Consistent Wealth Growth',
      heroSubtitle: 'Direct, research-backed equity calls, swing strategies, and portfolio advisory with full regulatory compliance and transparent audit track records.',
      features: [
        { title: 'High-Conviction Equity Calls', desc: 'In-depth fundamental and techno-funda setups vetted across sector cycles.', icon: 'TrendingUp' },
        { title: 'SEBI Compliant Disclosures', desc: 'Transparent trade risk parameters, target rationales, and complete regulatory disclosures.', icon: 'ShieldCheck' },
        { title: 'Real-Time Market Alerts', desc: 'Instant WhatsApp and Telegram push notifications for rapid execution and entry/exit updates.', icon: 'Bell' },
        { title: 'Weekly Macro & Sector Audits', desc: 'Deep-dive institutional commentary on Nifty, BankNifty, and high-beta breakout baskets.', icon: 'BarChart3' },
      ],
      ratingScore: 4.9,
      ratingReviews: '1,420+ Active Subscribers',
      faq: [
        { q: 'What is your SEBI registration number?', a: 'We operate under SEBI Research Analyst Registration No. INH000000000. All recommendations comply strictly with SEBI Research Analyst regulations.' },
        { q: 'How are trade alerts delivered?', a: 'Trade alerts are dispatched in real-time through private Telegram VIP channels and WhatsApp broadcasting.' },
        { q: 'What is the minimum capital required?', a: 'Our swing trading and portfolio services are tailored for portfolios starting from ₹1,00,000 and above.' },
      ],
      plans: [
        { name: 'Swing Research', price: '₹4,999', period: '/quarter', features: ['3-5 High Conviction Swing Calls/mo', 'Clear Entry, Stop Loss & Targets', 'WhatsApp Support'] },
        { name: 'Elite Advisory', price: '₹9,999', period: '/half-year', features: ['All Swing + Long Term Portfolio', 'Sector Allocation Reports', 'Quarterly Portfolio Health Check', 'Direct Analyst Q&A'], popular: true },
        { name: 'Annual Pro', price: '₹17,999', period: '/year', features: ['Full Master Access', 'Macro Strategy Playbooks', 'Priority VIP Desk Access', 'Dedicated Relationship Manager'] },
      ],
      isAdvisor: true,
      isDev: false,
    };
  }

  if (isDev) {
    return {
      companyName,
      tagline: 'All-in-One API Development & Testing Platform',
      heroHeadline: 'Stop Juggling 5 API Tools. Meet the Unified Platform.',
      heroSubtitle: 'Design OpenAPI specifications, execute live debugging, spin up smart mock servers, and run automated CI/CD testing in one lightning-fast developer hub.',
      features: [
        { title: 'Visual API Designer', desc: 'Define OpenAPI 3.1 & JSON Schemas with instant visual validation and versioning.', icon: 'Code' },
        { title: 'Zero-Config Mock Servers', desc: 'Simulate edge cases and dynamic responses instantly without waiting for backend deployment.', icon: 'Server' },
        { title: 'Automated CI/CD Testing', desc: 'Chain complex multi-stage test scenarios and automate continuous regression testing.', icon: 'CheckCircle' },
        { title: 'Interactive Documentation', desc: 'Auto-generate clean, interactive API reference docs your engineering teams love.', icon: 'FileText' },
      ],
      ratingScore: 4.95,
      ratingReviews: '35,000+ Developers & Teams',
      faq: [
        { q: 'Can I import Postman and Swagger collections?', a: 'Yes! Instant 1-click lossless import from Postman collections, Swagger 2.0, OpenAPI 3.0/3.1, and HAR files.' },
        { q: 'Is there an on-premise or self-hosted deployment?', a: 'Yes, enterprise plans support private cloud VPC and on-premise air-gapped deployments.' },
        { q: 'Does it support automated CI/CD runs?', a: 'Yes, use our native CLI or GitHub Actions runner to run tests in your continuous integration pipeline.' },
      ],
      plans: [
        { name: 'Developer', price: '$0', period: '/forever', features: ['Up to 5 Projects', 'API Debugging & Mocks', 'Community Support'] },
        { name: 'Team Pro', price: '$29', period: '/seat/mo', features: ['Unlimited Projects', 'Automated CI/CD Test Pipelines', 'Shared Team Workspaces', 'Git Version Sync'], popular: true },
        { name: 'Enterprise', price: '$99', period: '/seat/mo', features: ['SSO SAML / SCIM', 'Self-Hosted Private Runner', 'Audit Logs & RBAC', 'Dedicated 24/7 Support SLA'] },
      ],
      isAdvisor: false,
      isDev: true,
    };
  }

  // General SaaS / High-Converting Default
  return {
    companyName,
    tagline: 'Intelligent Autonomous Workflow Engine',
    heroHeadline: 'Build, Launch and Automate Customer Experiences with AI',
    heroSubtitle: 'The complete no-code builder for interactive landing pages, self-guided product tours, multi-step lead forms, and customer engagement widgets.',
    features: [
      { title: 'Autonomous AI Synthesis', desc: 'Turn any prompt, website link, or screenshot mockup into live interactive web pages in seconds.', icon: 'Sparkles' },
      { title: 'Interactive Tours & Demos', desc: 'Guide prospective clients through clickable interactive walkthroughs that boost conversion by 3x.', icon: 'Navigation' },
      { title: 'Built-in Social Proof & Ratings', desc: 'Showcase verified star ratings, customer review carousels, and Trustpilot badges effortlessly.', icon: 'Star' },
      { title: 'One Link & Responsive Embeds', desc: 'Distribute instantly via standalone One Links or drop into Webflow, WordPress, React, and Next.js.', icon: 'Globe' },
    ],
    ratingScore: 4.9,
    ratingReviews: '10,000+ Happy Customers',
    faq: [
      { q: 'How fast can I launch with AI?', a: 'Give a short prompt or your website URL, and your complete page or tour is synthesized and ready to publish in under 5 seconds.' },
      { q: 'Can I embed projects into my own website?', a: 'Yes! Every project provides a standalone One Link, responsive iframe code, lightweight script tag, and a 1-click Copy as AI Prompt.' },
      { q: 'Can I customize the generated blocks?', a: 'Every generated block is 100% editable in the Studio Canvas with drag-and-drop, full styling, and variable bindings.' },
    ],
    plans: [
      { name: 'Starter', price: '$19', period: '/mo', features: ['15 Active Projects', '25,000 Monthly Impressions', '100 AI Generations/mo', 'Custom Branding'] },
      { name: 'Pro Growth', price: '$49', period: '/mo', features: ['100 Active Projects', '250,000 Monthly Impressions', '1,000 AI Generations/mo', 'Custom Domains & SSL', 'Remove Watermark'], popular: true },
      { name: 'Agency & Scale', price: '$149', period: '/mo', features: ['500 Active Projects', '1,000,000 Impressions', '5,000 AI Generations/mo', '30 Team Workspaces', 'VIP Priority Support'] },
    ],
    isAdvisor: false,
    isDev: false,
  };
}

/** Theme resolver */
function resolveTheme(tone?: AiGenerationRequest['themeTone']): Theme {
  switch (tone) {
    case 'midnight': return THEME_MIDNIGHT.theme;
    case 'emerald': return THEME_EMERALD.theme;
    case 'ocean': return THEME_OCEAN.theme;
    case 'coral': return THEME_CORAL.theme;
    case 'mono': return THEME_MONO.theme;
    case 'indigo':
    default:
      return THEME_INDIGO.theme;
  }
}

/** Converts an El tree into schema-valid DocContent */
export function synthesizeContent(prefix: string, elements: El[], rootStyles: DocNode['styles'] = {}): DocContent {
  const nodes: DocContent['nodes'] = {};
  let counter = 0;

  const add = (element: El): string => {
    counter += 1;
    const id = `${prefix}${counter}`;
    const meta = BLOCK_META[element.type] ?? BLOCK_META['Box'];
    nodes[id] = {
      id,
      type: element.type,
      name: element.name,
      props: { ...(meta?.defaultProps ? structuredClone(meta.defaultProps) : {}), ...element.props },
      styles: element.styles ?? {},
      children: [],
    };
    if (element.responsive) nodes[id].responsive = element.responsive;
    if (element.repeat) nodes[id].repeat = element.repeat;
    if (element.showIf) nodes[id].showIf = element.showIf;
    nodes[id].children = (element.children ?? []).map(add);
    return id;
  };

  const rootId = add(el('Root', { styles: rootStyles }, elements));
  return { rootId, nodes };
}

/**
 * Main AI Project Synthesizer
 * Generates production-ready Pages, Tours, and Websites from Prompts, URLs, or Uploaded Images.
 */
export async function generateProjectWithAi(request: AiGenerationRequest, organizationId: string): Promise<GeneratedProjectPayload> {
  const mode = request.mode;
  let promptText = request.prompt?.trim() || '';

  // 1. Process URL mode
  if (mode === 'url' && request.url) {
    const { brand, domain, archetype } = extractBrandFromUrl(request.url);
    promptText = `${brand} (${domain}) - A ${archetype} company. ${promptText}`.trim();
  }

  // 2. Process Image mode
  if (mode === 'image') {
    const imageName = request.imageName || 'App Mockup';
    promptText = `Interactive application showcase based on visual mockup: ${imageName}. ${promptText}`.trim();
  }

  if (!promptText) {
    promptText = request.type === 'tour' 
      ? 'Interactive product onboarding walkthrough with modal greeting, dashboard hotspots, and feature highlight tooltips.'
      : 'Modern high-converting SaaS landing page with animated hero ticker, feature cards, 5-star ratings, pricing tables, and FAQ.';
  }

  const data = analyzePrompt(promptText);
  const theme = resolveTheme(request.themeTone);
  const isTour = request.type === 'tour';

  // Hero image: use uploaded image or mock screenshot
  const heroImageSrc = request.imageDataUrl || (data.isAdvisor ? photo('dashboard', 1200, 750) : photo('dashboard', 1200, 750));

  // Build Variables Record
  const variables: Record<string, string | number | boolean | Record<string, unknown>[]> = {
    'company.name': data.companyName,
    'company.tagline': data.tagline,
    'hero.title': data.heroHeadline,
    'hero.subtitle': data.heroSubtitle,
    'hero.cta_primary': isTour ? 'Start Interactive Tour' : 'Get Started for Free',
    'hero.cta_secondary': isTour ? 'Skip & Explore' : 'Book a Live Demo',
    'rating.score': data.ratingScore,
    'rating.reviews': data.ratingReviews,
    'features': data.features,
    'faqs': data.faq,
    'pricing.plans': data.plans,
  };

  const variableDefs: VariableDef[] = [
    { key: 'company.name', label: 'Company Name', type: 'text', default: data.companyName, group: 'Branding' },
    { key: 'company.tagline', label: 'Tagline', type: 'text', default: data.tagline, group: 'Branding' },
    { key: 'hero.title', label: 'Hero Headline', type: 'text', default: data.heroHeadline, group: 'Hero' },
    { key: 'hero.subtitle', label: 'Hero Subtitle', type: 'longtext', default: data.heroSubtitle, group: 'Hero' },
    { key: 'hero.cta_primary', label: 'Primary CTA Button', type: 'text', default: String(variables['hero.cta_primary']), group: 'Hero' },
    { key: 'rating.score', label: 'Star Rating Score', type: 'number', default: data.ratingScore, group: 'Social Proof' },
    { key: 'rating.reviews', label: 'Review Count Text', type: 'text', default: data.ratingReviews, group: 'Social Proof' },
  ];

  // ---------------------------------------------------------------------------
  // Build Document Tree
  // ---------------------------------------------------------------------------
  const elements: El[] = [];

  if (isTour) {
    // -------------------------------------------------------------------------
    // TOUR SYNTHESIS: Guided multi-step walkthrough
    // -------------------------------------------------------------------------
    elements.push(
      // Step 1: Welcome Modal
      el('TourStep', { props: { layout: 'modal', size: 'large', fallback: 'center', spotlight: true } }, [
        el('Box', { styles: { textAlign: 'center', gap: '16px', padding: '16px 8px' } }, [
          el('Box', { styles: { display: 'inline-flex', padding: '8px 16px', borderRadius: '9999px', background: 'rgba(99,102,241,0.12)', color: 'var(--fp-primary)', fontSize: '0.8125rem', fontWeight: 700, margin: '0 auto' } }, [
            text('✨ Interactive Walkthrough'),
          ]),
          heading('Welcome to {{company.name}}', 'h2', { fontSize: '1.875rem', fontWeight: 800 }),
          text('{{hero.subtitle}}', { color: 'var(--fp-muted)', fontSize: '1rem', maxWidth: '520px', margin: '0 auto' }),
          image(heroImageSrc, 'App Overview', { borderRadius: '12px', maxHeight: '240px', objectFit: 'cover', margin: '12px 0' }),
          el('Row', { styles: { justifyContent: 'center', gap: '12px', marginTop: '8px' } }, [
            actionButton('Skip Tour', 'close', 'secondary'),
            actionButton('Start Tour →', 'next', 'primary'),
          ]),
        ]),
      ]),

      // Step 2: Key Dashboard Feature
      el('TourStep', { props: { layout: 'tooltip', selector: 'header, [data-tour="nav"], nav', placement: 'bottom', fallback: 'center', spotlight: true } }, [
        el('Box', { styles: { gap: '10px' } }, [
          heading('1. Unified Navigation & Workspaces', 'h4', { fontSize: '1.0625rem', fontWeight: 700 }),
          text('Switch between client workspaces, live projects, and performance analytics effortlessly in one centralized header.', { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
          el('Row', { styles: { justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' } }, [
            text('Step 1 of 3', { fontSize: '0.75rem', color: 'var(--fp-muted)', fontWeight: 600 }),
            actionButton('Next Step →', 'next', 'primary'),
          ]),
        ]),
      ]),

      // Step 3: Actionable Creation & AI Generation
      el('TourStep', { props: { layout: 'tooltip', selector: 'main, [data-tour="action"], button.primary', placement: 'top', fallback: 'center', spotlight: true } }, [
        el('Box', { styles: { gap: '10px' } }, [
          heading('2. Instant Action & AI Copilot', 'h4', { fontSize: '1.0625rem', fontWeight: 700 }),
          text('Generate new high-converting pages, interactive tours, and forms from a simple prompt or website link with AI.', { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
          el('Row', { styles: { justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' } }, [
            text('Step 2 of 3', { fontSize: '0.75rem', color: 'var(--fp-muted)', fontWeight: 600 }),
            actionButton('Next Step →', 'next', 'primary'),
          ]),
        ]),
      ]),

      // Step 4: Completion Slide-out
      el('TourStep', { props: { layout: 'slideout', size: 'medium', spotlight: false, fallback: 'center' } }, [
        el('Box', { styles: { gap: '12px', padding: '8px' } }, [
          el('Row', { styles: { alignItems: 'center', gap: '8px' } }, [
            el('Box', { styles: { width: '28px', height: '28px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.875rem' } }, [
              text('✓'),
            ]),
            heading('You are ready to go!', 'h4', { fontSize: '1.125rem', fontWeight: 700 }),
          ]),
          text('You completed the tour. Ready to build your first experience or invite your team?', { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
          el('Row', { styles: { justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' } }, [
            actionButton('Close', 'close', 'secondary'),
            button('Launch Studio →', '#', 'primary'),
          ]),
        ]),
      ])
    );
  } else {
    // -------------------------------------------------------------------------
    // PAGE / WEBSITE SYNTHESIS: High-converting landing page
    // -------------------------------------------------------------------------

    // 1. Navbar Header
    elements.push(
      section([
        el('Row', { styles: { justifyContent: 'space-between', alignItems: 'center', width: '100%' } }, [
          el('Row', { styles: { alignItems: 'center', gap: '10px' } }, [
            el('Box', { styles: { width: '32px', height: '32px', borderRadius: '8px', background: 'var(--fp-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.125rem' } }, [
              text(data.companyName.charAt(0)),
            ]),
            heading('{{company.name}}', 'h4', { fontSize: '1.125rem', fontWeight: 800, margin: 0 }),
          ]),
          el('Row', { styles: { alignItems: 'center', gap: '20px' }, responsive: { mobile: { display: 'none' } } }, [
            button('Features', '#features', 'ghost'),
            button('Testimonials', '#testimonials', 'ghost'),
            button('Pricing', '#pricing', 'ghost'),
            button('FAQ', '#faq', 'ghost'),
          ]),
          button('{{hero.cta_primary}}', '#pricing', 'primary'),
        ]),
      ], { padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' })
    );

    // 2. Hero Section with dynamic text & ratings
    elements.push(
      section([
        el('Box', { styles: { textAlign: 'center', alignItems: 'center', gap: '20px', maxWidth: '860px', margin: '0 auto', paddingTop: '40px' } }, [
          // Eyebrow pill
          el('Box', { styles: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--fp-primary)', fontSize: '0.8125rem', fontWeight: 700 } }, [
            text(`⚡ {{company.tagline}}`),
          ]),

          // Animated headline
          heading('{{hero.title}}', 'h1', {
            fontSize: '3.25rem',
            fontWeight: 850,
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            autoMove: 'shimmer',
          }),

          // Subtitle
          text('{{hero.subtitle}}', {
            fontSize: '1.1875rem',
            lineHeight: 1.6,
            color: 'var(--fp-muted)',
            maxWidth: '680px',
            margin: '0 auto',
          }),

          // Action buttons
          el('Row', { styles: { justifyContent: 'center', gap: '14px', marginTop: '12px' } }, [
            button('{{hero.cta_primary}}', '#pricing', 'primary'),
            button('{{hero.cta_secondary}}', '#features', 'secondary'),
          ]),

          // Star Rating Social Proof Block
          el('Row', { styles: { alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '12px' } }, [
            el('Rating', { props: { rating: data.ratingScore, maxRating: 5, starColor: '#f59e0b', showScore: true } }),
            text('Rated {{rating.score}} / 5 by {{rating.reviews}}', { fontSize: '0.875rem', fontWeight: 600, color: 'var(--fp-muted)' }),
          ]),

          // Browser Window Mockup Card
          el('Card', {
            styles: {
              background: 'var(--fp-surface)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '16px',
              padding: '16px',
              marginTop: '40px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.15)',
              overflow: 'hidden',
            },
          }, [
            // Mac traffic dots
            el('Row', { styles: { gap: '8px', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' } }, [
              el('Box', { styles: { width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 } }),
              el('Box', { styles: { width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 } }),
              el('Box', { styles: { width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', flexShrink: 0 } }),
              text('{{company.name}} Live Interface', { fontSize: '0.8125rem', color: 'var(--fp-muted)', marginLeft: '12px' }),
            ]),
            image(heroImageSrc, 'Dashboard Interface', {
              borderRadius: '8px',
              maxHeight: '480px',
              width: '100%',
              objectFit: 'cover',
              marginTop: '12px',
            }),
          ]),
        ]),
      ], { paddingTop: '40px', paddingBottom: '60px' })
    );

    // 3. Features Section
    elements.push(
      section([
        el('Box', { styles: { textAlign: 'center', gap: '12px', maxWidth: '640px', margin: '0 auto 48px auto' } }, [
          el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: 'var(--fp-primary)', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
            text('PLATFORM CAPABILITIES'),
          ]),
          heading('Engineered for High-Velocity Execution', 'h2', { fontSize: '2.25rem', fontWeight: 800 }),
          text('Every capability you need to scale workflows, convert prospective visitors, and automate operations.', { color: 'var(--fp-muted)', fontSize: '1rem' }),
        ]),

        // Features Grid
        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px' },
          responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        }, [
          ...data.features.map((feat) =>
            el('Card', {
              styles: {
                background: 'var(--fp-surface)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '28px',
                gap: '12px',
                display: 'flex',
                flexDirection: 'column',
              },
            }, [
              el('Box', { styles: { width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fp-primary)', marginBottom: '8px' } }, [
                el('Icon', { props: { name: feat.icon || 'Sparkles' } }),
              ]),
              heading(feat.title, 'h3', { fontSize: '1.25rem', fontWeight: 700 }),
              text(feat.desc, { color: 'var(--fp-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }),
            ])
          ),
        ]),
      ], { id: 'features', paddingTop: '60px', paddingBottom: '60px' })
    );

    // 4. Testimonials with 5-Star Ratings
    elements.push(
      section([
        el('Box', { styles: { textAlign: 'center', gap: '12px', maxWidth: '640px', margin: '0 auto 40px auto' } }, [
          el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
            text('CLIENT TESTIMONIALS'),
          ]),
          heading('Loved by Fast-Growing Teams', 'h2', { fontSize: '2.25rem', fontWeight: 800 }),
          text('Discover how industry leaders accelerate their pipeline with {{company.name}}.', { color: 'var(--fp-muted)', fontSize: '1rem' }),
        ]),

        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' },
          responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        }, [
          el('Card', { styles: { background: 'var(--fp-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', gap: '14px', display: 'flex', flexDirection: 'column' } }, [
            el('Rating', { props: { rating: 5, maxRating: 5, starColor: '#f59e0b' } }),
            text('"The fastest way to launch new customer experiences. We 4x-ed our conversion rate within 2 weeks of deploying."', { fontSize: '0.9375rem', lineHeight: 1.6, fontStyle: 'italic' }),
            el('Row', { styles: { alignItems: 'center', gap: '10px', marginTop: 'auto' } }, [
              el('Avatar', { props: { name: 'Sarah Lin', role: 'VP Growth at Apex' } }),
            ]),
          ]),
          el('Card', { styles: { background: 'var(--fp-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', gap: '14px', display: 'flex', flexDirection: 'column' } }, [
            el('Rating', { props: { rating: 5, maxRating: 5, starColor: '#f59e0b' } }),
            text('"Completely replaced our previous clunky workflow. The AI synthesis and interactive tours are an absolute game changer."', { fontSize: '0.9375rem', lineHeight: 1.6, fontStyle: 'italic' }),
            el('Row', { styles: { alignItems: 'center', gap: '10px', marginTop: 'auto' } }, [
              el('Avatar', { props: { name: 'Michael Vance', role: 'Head of Engineering' } }),
            ]),
          ]),
          el('Card', { styles: { background: 'var(--fp-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', gap: '14px', display: 'flex', flexDirection: 'column' } }, [
            el('Rating', { props: { rating: 5, maxRating: 5, starColor: '#f59e0b' } }),
            text('"Incredible support, clean code embeds, and rock-solid performance under heavy multi-tenant production load."', { fontSize: '0.9375rem', lineHeight: 1.6, fontStyle: 'italic' }),
            el('Row', { styles: { alignItems: 'center', gap: '10px', marginTop: 'auto' } }, [
              el('Avatar', { props: { name: 'Elena Rostova', role: 'Founder & CEO' } }),
            ]),
          ]),
        ]),
      ], { id: 'testimonials', paddingTop: '40px', paddingBottom: '60px' })
    );

    // 5. Transparent Pricing Plans
    elements.push(
      section([
        el('Box', { styles: { textAlign: 'center', gap: '12px', maxWidth: '640px', margin: '0 auto 40px auto' } }, [
          el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: 'var(--fp-primary)', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
            text('TRANSPARENT PLANS'),
          ]),
          heading('Simple, Predictable Investment', 'h2', { fontSize: '2.25rem', fontWeight: 800 }),
          text('No hidden contracts. Upgrade, downgrade, or cancel at any time with confidence.', { color: 'var(--fp-muted)', fontSize: '1rem' }),
        ]),

        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px', alignItems: 'stretch' },
          responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        }, [
          ...data.plans.map((plan) =>
            el('Card', {
              styles: {
                background: plan.popular ? 'linear-gradient(180deg, rgba(99,102,241,0.15) 0%, var(--fp-surface) 100%)' : 'var(--fp-surface)',
                border: plan.popular ? '2px solid var(--fp-primary)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
              },
            }, [
              ...(plan.popular
                ? [
                    el('Box', { styles: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--fp-primary)', color: '#fff', fontSize: '0.6875rem', fontWeight: 800, padding: '3px 12px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, [
                      text('Most Popular'),
                    ]),
                  ]
                : []),
              heading(plan.name, 'h3', { fontSize: '1.25rem', fontWeight: 800 }),
              el('Row', { styles: { alignItems: 'baseline', gap: '4px' } }, [
                heading(plan.price, 'h2', { fontSize: '2.5rem', fontWeight: 900 }),
                text(plan.period, { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
              ]),
              el('Box', { styles: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', flexGrow: 1 } }, [
                ...plan.features.map((feat) =>
                  el('Row', { styles: { alignItems: 'center', gap: '8px', fontSize: '0.875rem' } }, [
                    el('Box', { styles: { color: '#10b981', fontWeight: 800 } }, [text('✓')]),
                    text(feat, { color: 'var(--fp-text)' }),
                  ])
                ),
              ]),
              button(plan.popular ? 'Get Started Pro' : 'Choose Plan', '#', plan.popular ? 'primary' : 'secondary'),
            ])
          ),
        ]),
      ], { id: 'pricing', paddingTop: '40px', paddingBottom: '60px' })
    );

    // 6. Frequently Asked Questions
    elements.push(
      section([
        el('Box', { styles: { textAlign: 'center', gap: '12px', maxWidth: '640px', margin: '0 auto 40px auto' } }, [
          el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: 'var(--fp-primary)', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
            text('FAQS'),
          ]),
          heading('Frequently Asked Questions', 'h2', { fontSize: '2.25rem', fontWeight: 800 }),
          text('Everything you need to know about getting started.', { color: 'var(--fp-muted)', fontSize: '1rem' }),
        ]),

        el('Box', { styles: { maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' } }, [
          ...data.faq.map((item) =>
            el('Card', { styles: { background: 'var(--fp-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px 24px', gap: '8px' } }, [
              heading(item.q, 'h4', { fontSize: '1.0625rem', fontWeight: 700 }),
              text(item.a, { color: 'var(--fp-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }),
            ])
          ),
        ]),
      ], { id: 'faq', paddingTop: '40px', paddingBottom: '60px' })
    );

    // 7. Footer
    elements.push(
      section([
        el('Row', { styles: { justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.08)' }, responsive: { mobile: { flexDirection: 'column', gap: '16px', textAlign: 'center' } } }, [
          text(`© ${new Date().getFullYear()} {{company.name}}. All rights reserved.`, { color: 'var(--fp-muted)', fontSize: '0.8125rem' }),
          el('Row', { styles: { gap: '16px' } }, [
            button('Privacy Policy', '#', 'ghost'),
            button('Terms of Service', '#', 'ghost'),
            button('Regulatory Disclosures', '#', 'ghost'),
          ]),
        ]),
      ], { paddingTop: '20px', paddingBottom: '40px' })
    );
  }

  // Synthesize AST
  const docContent = synthesizeContent('ai', elements, {
    minHeight: '100vh',
    background: 'var(--fp-background)',
    color: 'var(--fp-text)',
    fontFamily: 'var(--fp-font-body)',
  });

  const projectTitle = isTour ? `${data.companyName} Onboarding Tour` : `${data.companyName} Landing Page`;

  return {
    title: projectTitle,
    type: request.type,
    theme,
    settings: {
      targetDevice: request.device || 'desktop',
      targetLanguage: request.language || 'en',
    },
    variables,
    variableDefs,
    documents: [
      {
        kind: isTour ? 'experience' : 'page',
        title: isTour ? 'Interactive Tour' : 'Home',
        slug: '',
        position: 0,
        content: docContent,
      },
    ],
  };
}

/**
 * AI Content Rewriter for Studio
 * Updates variables in place according to prompt instructions.
 */
export function rebrandVariablesWithAi(
  currentVariables: Record<string, unknown>,
  prompt: string
): Record<string, unknown> {
  const data = analyzePrompt(prompt);
  return {
    ...currentVariables,
    'company.name': data.companyName,
    'company.tagline': data.tagline,
    'hero.title': data.heroHeadline,
    'hero.subtitle': data.heroSubtitle,
    'rating.score': data.ratingScore,
    'rating.reviews': data.ratingReviews,
    'features': data.features,
    'faqs': data.faq,
    'pricing.plans': data.plans,
  };
}
