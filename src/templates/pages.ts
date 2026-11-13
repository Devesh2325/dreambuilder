import { VariableDef } from '../core/variables';
import { photo } from './assets';
import { buildContent, button, el, El, heading, image, section, TemplateDefinition, TemplatePage, text } from './dsl';
import { field, listVar, longVar, make, textVar, urlVar } from './experiences';
import { THEME_CORAL, THEME_DARK_TEAL, THEME_EMERALD, THEME_INDIGO, THEME_MIDNIGHT, THEME_MONO, THEME_TERRACOTTA } from './themes';

const onePage = (children: El[], seoTitle = '{{headline}}', seoDescription = '{{subheadline}}'): TemplatePage => ({
  kind: 'page',
  title: 'Home',
  slug: '',
  seo: { title: seoTitle, description: seoDescription },
  content: buildContent('p', children),
});

const prose = { maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', width: '100%' };

const titleDescription: VariableDef[] = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'description', label: 'Description', type: 'longtext' },
];

const cards = (list: string, as: string): El =>
  el('Grid', {}, [el('Card', { repeat: { list, as }, styles: { hoverEffect: 'lift', animation: 'fp-slide-up', transition: 'all 0.25s ease' } }, [heading(`{{${as}.title}}`, 'h3'), text(`{{${as}.description}}`, { color: 'var(--fp-muted)' }, `${as}.description`)])]);

const gradientHero = (children: El[], background: string): El =>
  section([el('Box', { styles: { alignItems: 'center', textAlign: 'center', gap: '20px', maxWidth: '780px', marginLeft: 'auto', marginRight: 'auto', animation: 'fp-slide-up' } }, children)], { background, color: '#ffffff', paddingTop: '96px', paddingBottom: '96px' });

const articleSections: VariableDef = listVar('sections', 'Sections', [
  { title: 'Why this matters', body: 'Start with the problem your reader has, and why it is worth solving now.' },
  { title: 'What to do', body: 'Explain the steps clearly. Short paragraphs and concrete examples work best.' },
  { title: 'What to do next', body: 'Finish with one clear next step your reader can take today.' },
], [
  { key: 'title', label: 'Heading', type: 'text', required: true },
  { key: 'body', label: 'Text', type: 'longtext', required: true },
], 'Article');

// ---- Content pages ----------------------------------------------------------

const article = make('page', 'blog-article', 'Blog article', 'A single readable article with an image, author and sections.', ['blog', 'article', 'content'], THEME_TERRACOTTA, [
  textVar('article.title', 'Title', 'How small teams can do more with less', 'Article'),
  longVar('article.intro', 'Introduction', 'Five practical habits we learned from teams who get big results without big budgets.', 'Article'),
  textVar('article.author', 'Author', 'Maya Chen', 'Article'),
  textVar('article.date', 'Date', 'March 14', 'Article'),
  { key: 'article.image', label: 'Main image', type: 'image', default: photo('writing'), group: 'Article' },
  articleSections,
  textVar('cta.label', 'Button label', 'Read more articles', 'Call to action'),
  urlVar('cta.link', 'Button link', 'https://example.com/blog', 'Call to action'),
], [onePage([
  section([
    el('Box', { styles: { ...prose, gap: '16px' } }, [
      heading('{{article.title}}', 'h1'),
      text('{{article.intro}}', { fontSize: '1.25rem', color: 'var(--fp-muted)' }),
      text('By {{article.author}} on {{article.date}}', { fontWeight: 600, fontSize: '.9375rem' }),
    ]),
    image('{{article.image}}', '{{article.title}}', { ...prose, height: '400px' }, 'article.image'),
    el('Box', { repeat: { list: 'sections', as: 'part' }, styles: { ...prose, gap: '10px' } }, [heading('{{part.title}}', 'h2'), text('{{part.body}}', { fontSize: '1.0625rem' })]),
    el('Box', { styles: { ...prose, alignItems: 'flex-start', marginTop: '16px' } }, [button('{{cta.label}}', '{{cta.link}}', 'secondary')]),
  ]),
], '{{article.title}}', '{{article.intro}}')], { titleVariable: 'article.title', category: 'Blog and docs' });

const docsArticle = make('page', 'docs-article', 'Documentation page', 'A how-to guide with numbered steps and a code sample.', ['docs', 'guide', 'developer'], THEME_MONO, [
  textVar('doc.title', 'Title', 'Getting started', 'Guide'),
  longVar('doc.intro', 'Introduction', 'Set everything up in about five minutes.', 'Guide'),
  listVar('steps', 'Steps', [
    { title: 'Create your account', body: 'Sign up and confirm your email address.' },
    { title: 'Install the package', body: 'Add it to your project using your package manager.' },
    { title: 'Make your first request', body: 'Use your API key to confirm that everything works.' },
  ], [
    { key: 'title', label: 'Step', type: 'text', required: true },
    { key: 'body', label: 'Explanation', type: 'longtext', required: true },
  ], 'Steps'),
  longVar('doc.code', 'Code sample', 'npm install your-package', 'Guide'),
  longVar('doc.help', 'Help text', 'Stuck? Our support team replies within one working day.', 'Guide'),
], [onePage([
  section([
    el('Box', { styles: { ...prose, gap: '14px' } }, [
      heading('{{doc.title}}', 'h1'),
      text('{{doc.intro}}', { fontSize: '1.125rem', color: 'var(--fp-muted)' }),
      el('Card', { repeat: { list: 'steps', as: 'step' } }, [heading('{{step.index}}. {{step.title}}', 'h3'), text('{{step.body}}')]),
      text('{{doc.code}}', { fontFamily: 'monospace', background: '#0f172a', color: '#e2e8f0', padding: '16px', borderRadius: '8px', fontSize: '.875rem' }, 'doc.code'),
      text('{{doc.help}}', { color: 'var(--fp-muted)' }, 'doc.help'),
    ]),
  ]),
], '{{doc.title}}', '{{doc.intro}}')], { titleVariable: 'doc.title', category: 'Blog and docs' });

const caseStudy = make('page', 'case-study', 'Customer case study', 'Show the challenge, the solution and the results.', ['case study', 'sales', 'b2b'], THEME_INDIGO, [
  textVar('customer', 'Customer', 'Northwind', 'Story'),
  textVar('headline', 'Headline', 'How Northwind cut onboarding time in half', 'Story'),
  longVar('challenge', 'The challenge', 'New customers took weeks to get started, and many gave up.', 'Story'),
  longVar('solution', 'The solution', 'A guided setup replaced long documents and calls.', 'Story'),
  listVar('results', 'Results', [
    { title: '50%', description: 'Less time to onboard' },
    { title: '3x', description: 'More active users' },
    { title: '$120k', description: 'Saved each year' },
  ], titleDescription, 'Results'),
  { key: 'quote', label: 'Customer quote', type: 'longtext', default: 'It changed how our whole team works.', group: 'Story' },
  textVar('cta.label', 'Button label', 'Talk to us', 'Call to action'),
  urlVar('cta.link', 'Button link', 'https://example.com/contact', 'Call to action'),
], [onePage([
  gradientHero([text('Customer story: {{customer}}', { fontWeight: 600, opacity: 0.85 }), heading('{{headline}}', 'h1')], 'linear-gradient(135deg, #1e1b4b, #4f46e5)'),
  section([el('Grid', {}, [
    el('Box', {}, [heading('The challenge', 'h3'), text('{{challenge}}', { color: 'var(--fp-muted)' })]),
    el('Box', {}, [heading('The solution', 'h3'), text('{{solution}}', { color: 'var(--fp-muted)' })]),
  ]), el('Grid', {}, [el('Card', { repeat: { list: 'results', as: 'result' }, styles: { textAlign: 'center' } }, [heading('{{result.title}}', 'h2', { color: 'var(--fp-primary)' }), text('{{result.description}}', { color: 'var(--fp-muted)' })])]),
  text('"{{quote}}"', { fontSize: '1.375rem', fontWeight: 600, textAlign: 'center', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' }, 'quote'),
  el('Box', { styles: { alignItems: 'center' } }, [button('{{cta.label}}', '{{cta.link}}')])]),
], '{{headline}}', '{{challenge}}')], { titleVariable: 'headline', category: 'Blog and docs' });

// ---- Landing pages ----------------------------------------------------------

const saasLanding = make('page', 'saas-landing', 'SaaS landing page', 'A modern hero, benefits, proof and a call to action.', ['saas', 'startup', 'landing'], THEME_MIDNIGHT, [
  textVar('headline', 'Headline', 'Ship faster. Stress less.', 'Hero'),
  longVar('subheadline', 'Supporting text', 'The all-in-one workspace your team will actually enjoy using.', 'Hero'),
  textVar('cta.label', 'Button label', 'Start free trial', 'Hero'),
  urlVar('cta.link', 'Button link', 'https://example.com/signup', 'Hero'),
  { key: 'hero.image', label: 'Product image', type: 'image', default: photo('dashboard'), group: 'Hero' },
  listVar('benefits', 'Benefits', [
    { title: 'Set up in minutes', description: 'No training or long onboarding needed.' },
    { title: 'Everything in one place', description: 'Replace five tools with one.' },
    { title: 'Built for teams', description: 'Share, comment and decide together.' },
  ], titleDescription, 'Benefits'),
  listVar('stats', 'Numbers', [
    { title: '10k+', description: 'Teams' },
    { title: '99.9%', description: 'Uptime' },
    { title: '4.9/5', description: 'Rating' },
  ], titleDescription, 'Numbers'),
], [onePage([
  gradientHero([heading('{{headline}}', 'h1'), text('{{subheadline}}', { fontSize: '1.25rem', opacity: 0.85 }, 'subheadline'), el('Button', { props: { text: '{{cta.label}}', href: '{{cta.link}}', action: 'link', variant: 'primary' }, styles: { background: '#ffffff', color: '#312e81' } })], 'linear-gradient(135deg, #0f172a, #4338ca 60%, #7c3aed)'),
  section([image('{{hero.image}}', '{{headline}}', { height: '440px', boxShadow: '0 30px 60px -20px rgba(15,23,42,.6)' }, 'hero.image'), cards('benefits', 'benefit'), el('Grid', {}, [el('Box', { repeat: { list: 'stats', as: 'stat' }, styles: { textAlign: 'center' } }, [heading('{{stat.title}}', 'h2', { color: 'var(--fp-primary)' }), text('{{stat.description}}', { color: 'var(--fp-muted)' })])])]),
])], { titleVariable: 'headline', category: 'Landing page' });

const ebook = make('page', 'ebook-download', 'Ebook download', 'Offer a free guide in exchange for an email.', ['lead magnet', 'ebook', 'marketing'], THEME_EMERALD, [
  textVar('headline', 'Headline', 'The complete guide to growing your business', 'Offer'),
  longVar('subheadline', 'Supporting text', 'Forty pages of practical advice, free to download.', 'Offer'),
  listVar('points', "What's inside", [
    { title: 'Finding your first 100 customers', description: '' },
    { title: 'Pricing that works', description: '' },
    { title: 'Simple marketing plans', description: '' },
  ], titleDescription, 'Offer'),
  { key: 'cover', label: 'Cover image', type: 'image', default: photo('books', 800, 900), group: 'Offer' },
  textVar('cta.label', 'Button label', 'Send me the guide', 'Form'),
  textVar('thanks', 'Thank-you message', 'Thanks! Check your inbox for the guide.', 'Form'),
], [onePage([section([el('Grid', { styles: { gap: '48px', alignItems: 'center' } }, [
  el('Box', { styles: { gap: '16px' } }, [
    heading('{{headline}}', 'h1'),
    text('{{subheadline}}', { fontSize: '1.125rem', color: 'var(--fp-muted)' }, 'subheadline'),
    el('Text', { repeat: { list: 'points', as: 'point' }, props: { text: '✓ {{point.title}}' } }),
    el('Form', { props: { submitText: '{{cta.label}}', successMessage: '{{thanks}}' } }, [field('email', 'Email', 'email')]),
  ]),
  image('{{cover}}', '{{headline}}', { height: '480px' }, 'cover'),
])])])], { titleVariable: 'headline', category: 'Landing page' });

const appDownload = make('page', 'app-download', 'Mobile app landing', 'Show your app and send people to the stores.', ['mobile', 'app'], THEME_CORAL, [
  textVar('headline', 'Headline', 'Your day, organized in your pocket', 'Hero'),
  longVar('subheadline', 'Supporting text', 'Join thousands of people who start each day with a plan.', 'Hero'),
  { key: 'screenshot', label: 'App image', type: 'image', default: photo('phone', 800, 900), group: 'Hero' },
  urlVar('ios', 'App Store link', 'https://apps.apple.com', 'Download links'),
  urlVar('android', 'Google Play link', 'https://play.google.com', 'Download links'),
  listVar('features', 'Features', [
    { title: 'Daily planner', description: 'See everything at a glance.' },
    { title: 'Smart reminders', description: 'Never miss what matters.' },
    { title: 'Works offline', description: 'Your plans are always with you.' },
  ], titleDescription, 'Features'),
], [onePage([section([el('Grid', { styles: { gap: '48px', alignItems: 'center' } }, [
  el('Box', { styles: { gap: '18px' } }, [
    heading('{{headline}}', 'h1'),
    text('{{subheadline}}', { fontSize: '1.125rem', color: 'var(--fp-muted)' }, 'subheadline'),
    el('Row', {}, [button('App Store', '{{ios}}'), button('Google Play', '{{android}}', 'secondary')]),
  ]),
  image('{{screenshot}}', '{{headline}}', { height: '480px' }, 'screenshot'),
]), cards('features', 'feature')])])], { titleVariable: 'headline', category: 'Landing page' });

const thankYou = make('page', 'thank-you', 'Thank-you page', 'Confirm an order or sign-up, and suggest a next step.', ['confirmation', 'conversion'], THEME_INDIGO, [
  textVar('headline', 'Headline', "Thank you! You're all set.", 'Message'),
  longVar('subheadline', 'Message', "We've sent a confirmation to your email.", 'Message'),
  textVar('cta.label', 'Button label', 'Back to home', 'Message'),
  urlVar('cta.link', 'Button link', 'https://example.com', 'Message'),
], [onePage([section([el('Box', { styles: { alignItems: 'center', textAlign: 'center', gap: '18px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' } }, [
  heading('{{headline}}', 'h1'),
  text('{{subheadline}}', { color: 'var(--fp-muted)' }, 'subheadline'),
  button('{{cta.label}}', '{{cta.link}}'),
])], { minHeight: '80vh', display: 'flex', alignItems: 'center' })])], { titleVariable: 'headline', category: 'Landing page' });

const consultation = make('page', 'consultation', 'Book a consultation', 'For professional services: benefits and a booking form.', ['services', 'consulting', 'lead'], THEME_TERRACOTTA, [
  textVar('headline', 'Headline', 'Get expert advice for your business', 'Hero'),
  longVar('subheadline', 'Supporting text', 'Book a free 30-minute consultation with no obligation.', 'Hero'),
  { key: 'photo', label: 'Image', type: 'image', default: photo('meeting'), group: 'Hero' },
  listVar('reasons', 'Reasons to choose you', [
    { title: '15 years of experience', description: 'We have seen it all before.' },
    { title: 'Clear, fair pricing', description: 'No surprises on your invoice.' },
    { title: 'Practical advice', description: 'Steps you can act on right away.' },
  ], titleDescription, 'Reasons'),
  textVar('thanks', 'Thank-you message', "Thanks! We'll call you within one working day.", 'Form'),
], [onePage([section([el('Grid', { styles: { gap: '48px' } }, [
  el('Box', { styles: { gap: '16px' } }, [heading('{{headline}}', 'h1'), text('{{subheadline}}', { fontSize: '1.125rem', color: 'var(--fp-muted)' }, 'subheadline'), image('{{photo}}', '{{headline}}', { height: '260px' }, 'photo')]),
  el('Card', {}, [el('Form', { props: { submitText: 'Book my consultation', successMessage: '{{thanks}}' } }, [field('name', 'Name'), field('email', 'Email', 'email'), field('phone', 'Phone', 'tel', false)])]),
]), cards('reasons', 'reason')])])], { titleVariable: 'headline', category: 'Landing page' });

// ---- Research Analyst / Financial Advisor landing page ----------------------

const researchAnalyst = make('page', 'research-analyst', 'Research Analyst Showcase', 'A professional landing page for a SEBI-registered research analyst or financial advisor.', ['finance', 'analyst', 'advisor', 'landing'], THEME_MIDNIGHT, [
  // Hero
  textVar('analyst.name', 'Analyst name', 'Arjun Sharma', 'Profile'),
  textVar('analyst.title', 'Professional title', 'SEBI Registered Research Analyst', 'Profile'),
  textVar('analyst.tagline', 'Tagline', 'Evidence-based research. Data-driven decisions.', 'Profile'),
  { key: 'analyst.photo', label: 'Profile photo', type: 'image', default: photo('office', 400, 400), group: 'Profile' },
  textVar('sebi.regNo', 'SEBI registration number', 'INH000000000', 'Credentials'),
  // Hero CTAs
  textVar('cta.primary', 'Primary button label', 'Book Free Consultation', 'Call to action'),
  urlVar('cta.primaryLink', 'Primary button link', 'https://example.com/book', 'Call to action'),
  textVar('cta.secondary', 'Secondary button label', 'View Plans', 'Call to action'),
  urlVar('cta.secondaryLink', 'Secondary button link', '#plans', 'Call to action'),
  // Trust bar
  textVar('trust.stat1', 'Trust stat 1', '5+ Years', 'Trust bar'),
  textVar('trust.stat1Label', 'Trust stat 1 label', 'Experience', 'Trust bar'),
  textVar('trust.stat2', 'Trust stat 2', '1,200+', 'Trust bar'),
  textVar('trust.stat2Label', 'Trust stat 2 label', 'Clients Served', 'Trust bar'),
  textVar('trust.stat3', 'Trust stat 3', '94%', 'Trust bar'),
  textVar('trust.stat3Label', 'Trust stat 3 label', 'Accuracy Rate', 'Trust bar'),
  textVar('trust.stat4', 'Trust stat 4', 'SEBI Regulated', 'Trust bar'),
  textVar('trust.stat4Label', 'Trust stat 4 label', 'Fully Compliant', 'Trust bar'),
  // About
  longVar('about.bio', 'Bio / About', 'With over 5 years of experience in equity research and portfolio management, I provide actionable, data-driven insights to help retail and HNI investors make confident decisions. My research is fully SEBI-compliant and transparently documented.', 'About'),
  // Services
  listVar('services', 'Services', [
    { title: 'Equity Research Reports', description: 'In-depth fundamental analysis on hand-picked stocks across large, mid, and small cap segments.' },
    { title: 'Model Portfolio', description: 'A curated portfolio updated monthly, designed to outperform benchmark indices over a 3–5 year horizon.' },
    { title: 'Stock Recommendations', description: 'Short-term and positional trade ideas with clear entry, target, and stop-loss levels.' },
  ], [
    { key: 'title', label: 'Service name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'longtext', required: true },
  ], 'Services'),
  // Why choose
  listVar('reasons', 'Why choose you', [
    { title: '✅ SEBI Regulated', description: 'All research is published under SEBI registration, ensuring full regulatory compliance.' },
    { title: '📊 Data-Driven', description: 'Every recommendation is backed by quantitative analysis and rigorous financial modelling.' },
    { title: '🔎 Transparent', description: 'Track record of all past calls is published — both winning and losing trades.' },
    { title: '📱 Direct Access', description: 'Clients get direct WhatsApp and email access to me, not a support team.' },
  ], [
    { key: 'title', label: 'Reason', type: 'text', required: true },
    { key: 'description', label: 'Detail', type: 'longtext', required: true },
  ], 'Why choose'),
  // Plans
  listVar('plans', 'Plans', [
    { title: 'Free Insights', price: '₹0 / month', description: 'Weekly newsletter, 2 research reports per month, market commentary.', rating: '4.8' },
    { title: 'Pro Investor', price: '₹999 / month', description: 'All Free benefits + full model portfolio, 10 stock picks/month, entry & exit alerts.', rating: '4.9' },
    { title: 'Premium HNI', price: '₹2,999 / month', description: 'All Pro benefits + dedicated consultation call, custom portfolio review, priority support.', rating: '5.0' },
  ], [
    { key: 'title', label: 'Plan name', type: 'text', required: true },
    { key: 'price', label: 'Price', type: 'text', required: true },
    { key: 'description', label: 'What\'s included', type: 'longtext', required: true },
    { key: 'rating', label: 'Client rating (e.g. 4.9)', type: 'text', required: false },
  ], 'Plans'),
  // Testimonials
  listVar('testimonials', 'Testimonials', [
    { title: 'Ravi Mehta', description: 'The model portfolio alone has given me 28% returns in 10 months. Highly recommended for anyone serious about investing.', rating: '5.0' },
    { title: 'Priya Nair', description: 'Very transparent and responsive. I appreciate that the track record is published openly — that builds trust.', rating: '5.0' },
    { title: 'Suresh Patel', description: 'Finally a research analyst who explains the "why" behind every call, not just buy/sell signals.', rating: '4.9' },
  ], [
    { key: 'title', label: 'Client name', type: 'text', required: true },
    { key: 'description', label: 'Testimonial', type: 'longtext', required: true },
    { key: 'rating', label: 'Star rating', type: 'text', required: false },
  ], 'Testimonials'),
  // Contact
  textVar('contact.phone', 'Phone', '+91 98765 43210', 'Contact'),
  textVar('contact.email', 'Email', 'hello@yourdomain.com', 'Contact'),
  textVar('contact.formTitle', 'Contact form heading', 'Send a message', 'Contact'),
  textVar('contact.thanks', 'Thank-you message', "Thanks! I'll get back to you within 24 hours.", 'Contact'),
  // Footer
  longVar('footer.disclaimer', 'SEBI disclaimer', 'Investment in securities market are subject to market risks. Read all the related documents carefully before investing. Registration granted by SEBI and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors.', 'Footer'),
], [onePage([
  // ── Hero ──────────────────────────────────────────────────────────────────
  section([
    el('Grid', { styles: { gap: '48px', alignItems: 'center' } }, [
      el('Box', { styles: { gap: '20px' } }, [
        el('Box', { styles: { display: 'inline-flex', background: 'rgba(167,139,250,0.15)', borderRadius: '999px', paddingLeft: '14px', paddingRight: '14px', paddingTop: '6px', paddingBottom: '6px', alignSelf: 'flex-start' } }, [
          text('🏛 {{analyst.title}}', { fontWeight: 600, fontSize: '0.875rem', color: '#a78bfa' }),
        ]),
        heading('{{analyst.name}}', 'h1'),
        text('{{analyst.tagline}}', { fontSize: '1.25rem', color: 'var(--fp-muted)' }),
        el('Row', { styles: { gap: '12px', flexWrap: 'wrap' } }, [
          button('{{cta.primary}}', '{{cta.primaryLink}}'),
          button('{{cta.secondary}}', '{{cta.secondaryLink}}', 'secondary'),
        ]),
        el('Box', { styles: { display: 'inline-flex', background: 'rgba(255,255,255,0.07)', borderRadius: '8px', padding: '10px 16px', alignSelf: 'flex-start' } }, [
          text('SEBI Reg No: {{sebi.regNo}}', { fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--fp-muted)' }),
        ]),
      ]),
      image('{{analyst.photo}}', '{{analyst.name}}', { height: '380px', borderRadius: '16px', objectFit: 'cover' }, 'analyst.photo'),
    ]),
  ], { background: 'linear-gradient(135deg, #0f172a, #1e1b4b 60%, #312e81)', color: '#f1f5f9', paddingTop: '80px', paddingBottom: '80px' }),

  // ── Trust bar ─────────────────────────────────────────────────────────────
  section([
    el('Grid', { styles: { gap: '0', borderTop: '1px solid var(--fp-surface)', borderBottom: '1px solid var(--fp-surface)' } }, [
      el('Box', { styles: { textAlign: 'center', paddingTop: '24px', paddingBottom: '24px', gap: '4px' } }, [
        heading('{{trust.stat1}}', 'h3', { color: 'var(--fp-primary)', margin: '0' }),
        text('{{trust.stat1Label}}', { fontSize: '0.875rem', color: 'var(--fp-muted)' }),
      ]),
      el('Box', { styles: { textAlign: 'center', paddingTop: '24px', paddingBottom: '24px', gap: '4px' } }, [
        heading('{{trust.stat2}}', 'h3', { color: 'var(--fp-primary)', margin: '0' }),
        text('{{trust.stat2Label}}', { fontSize: '0.875rem', color: 'var(--fp-muted)' }),
      ]),
      el('Box', { styles: { textAlign: 'center', paddingTop: '24px', paddingBottom: '24px', gap: '4px' } }, [
        heading('{{trust.stat3}}', 'h3', { color: 'var(--fp-primary)', margin: '0' }),
        text('{{trust.stat3Label}}', { fontSize: '0.875rem', color: 'var(--fp-muted)' }),
      ]),
      el('Box', { styles: { textAlign: 'center', paddingTop: '24px', paddingBottom: '24px', gap: '4px' } }, [
        heading('{{trust.stat4}}', 'h3', { color: 'var(--fp-primary)', margin: '0' }),
        text('{{trust.stat4Label}}', { fontSize: '0.875rem', color: 'var(--fp-muted)' }),
      ]),
    ]),
  ]),

  // ── About ─────────────────────────────────────────────────────────────────
  section([
    el('Grid', { styles: { gap: '48px', alignItems: 'center' } }, [
      el('Box', { styles: { gap: '16px' } }, [
        text('ABOUT ME', { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--fp-primary)' }),
        heading('Who I am & how I work', 'h2'),
        text('{{about.bio}}', { fontSize: '1.0625rem', color: 'var(--fp-muted)', lineHeight: '1.75' }),
        button('{{cta.primary}}', '{{cta.primaryLink}}'),
      ]),
      el('Box', { styles: { gap: '12px' } }, [
        el('Card', {}, [
          text('📜 SEBI Registration', { fontWeight: 700, fontSize: '0.875rem' }),
          text('{{sebi.regNo}}', { fontFamily: 'monospace', color: 'var(--fp-muted)', fontSize: '0.875rem' }),
        ]),
        el('Card', {}, [
          text('📧 Email', { fontWeight: 700, fontSize: '0.875rem' }),
          text('{{contact.email}}', { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
        ]),
        el('Card', {}, [
          text('📞 Phone', { fontWeight: 700, fontSize: '0.875rem' }),
          text('{{contact.phone}}', { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
        ]),
      ]),
    ]),
  ]),

  // ── Services ──────────────────────────────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '8px', marginBottom: '8px' } }, [
      text('WHAT I OFFER', { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--fp-primary)' }),
      heading('Research & Advisory Services', 'h2'),
    ]),
    el('Grid', {}, [
      el('Card', { repeat: { list: 'services', as: 'svc' } }, [
        heading('{{svc.title}}', 'h3'),
        text('{{svc.description}}', { color: 'var(--fp-muted)' }),
      ]),
    ]),
  ]),

  // ── Why choose ────────────────────────────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '8px', marginBottom: '8px' } }, [
      text('WHY CHOOSE ME', { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--fp-primary)' }),
      heading('Research you can trust', 'h2'),
    ]),
    el('Grid', {}, [
      el('Card', { repeat: { list: 'reasons', as: 'reason' } }, [
        heading('{{reason.title}}', 'h3'),
        text('{{reason.description}}', { color: 'var(--fp-muted)' }),
      ]),
    ]),
  ]),

  // ── Plans ─────────────────────────────────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '8px', marginBottom: '8px' } }, [
      text('PLANS & PRICING', { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--fp-primary)' }),
      heading('Choose the plan that fits you', 'h2'),
    ]),
    el('Grid', {}, [
      el('Card', { repeat: { list: 'plans', as: 'plan' }, styles: { gap: '14px', hoverEffect: 'lift', animation: 'fp-slide-up', transition: 'all 0.25s ease' } }, [
        el('Rating', { props: { value: 5, max: 5, min: 1, color: '#f59e0b', showText: true, text: '★ {{plan.rating}} / 5 Rating' } }),
        heading('{{plan.title}}', 'h3'),
        heading('{{plan.price}}', 'h2', { color: 'var(--fp-primary)', margin: '0' }),
        text('{{plan.description}}', { color: 'var(--fp-muted)', fontSize: '0.9375rem' }),
        button('{{cta.primary}}', '{{cta.primaryLink}}'),
      ]),
    ]),
  ]),

  // ── Testimonials ──────────────────────────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '8px', marginBottom: '8px' } }, [
      text('CLIENT STORIES', { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--fp-primary)' }),
      heading('What investors say', 'h2'),
    ]),
    el('Grid', {}, [
      el('Card', { repeat: { list: 'testimonials', as: 'review' }, styles: { gap: '12px', hoverEffect: 'lift', animation: 'fp-slide-up', transition: 'all 0.25s ease' } }, [
        el('Rating', { props: { value: 5, max: 5, min: 1, color: '#f59e0b', showText: true, text: '★ {{review.rating}} / 5' } }),
        text('"{{review.description}}"', { fontSize: '1rem', color: 'var(--fp-muted)', fontStyle: 'italic' }),
        text('— {{review.title}}', { fontWeight: 700, fontSize: '0.875rem' }),
      ]),
    ]),
  ]),

  // ── Contact ───────────────────────────────────────────────────────────────
  section([
    el('Grid', { styles: { gap: '48px', alignItems: 'flex-start' } }, [
      el('Box', { styles: { gap: '16px' } }, [
        text('GET IN TOUCH', { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--fp-primary)' }),
        heading('{{contact.formTitle}}', 'h2'),
        text('📞 {{contact.phone}}', { fontSize: '1.0625rem' }),
        text('📧 {{contact.email}}', { fontSize: '1.0625rem' }),
        button('{{cta.primary}}', '{{cta.primaryLink}}'),
      ]),
      el('Card', {}, [
        el('Form', { props: { submitText: '{{cta.primary}}', successMessage: '{{contact.thanks}}' } }, [
          el('FormField', { props: { name: 'name', label: 'Your name', inputType: 'text', required: true } }),
          el('FormField', { props: { name: 'email', label: 'Email address', inputType: 'email', required: true } }),
          el('FormField', { props: { name: 'phone', label: 'Phone number', inputType: 'tel', required: false } }),
          el('FormField', { props: { name: 'message', label: 'Your message', inputType: 'textarea', required: false } }),
        ]),
      ]),
    ]),
  ]),

  // ── Footer ────────────────────────────────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '8px', maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto' } }, [
      text('SEBI Reg No: {{sebi.regNo}} | {{analyst.name}} — {{analyst.title}}', { fontWeight: 600, fontSize: '0.875rem' }),
      text('{{footer.disclaimer}}', { fontSize: '0.75rem', color: 'var(--fp-muted)', lineHeight: '1.6' }),
    ]),
  ], { background: 'var(--fp-surface)', paddingTop: '32px', paddingBottom: '32px' }),

], '{{analyst.name}} — {{analyst.title}}', '{{analyst.tagline}}')], { titleVariable: 'analyst.name', category: 'Landing page' });

// ---- Financial Masterclass & Webinar landing page (inspired by Finuro) -------

const financialWebinar = make('page', 'financial-webinar', 'Financial Masterclass & Webinar', 'A high-converting registration page for live market webinars, investment masterclasses, and SEBI-registered advisory workshops.', ['webinar', 'finance', 'masterclass', 'investing', 'landing'], THEME_DARK_TEAL, [
  // Brand & Top bar
  textVar('brand.name', 'Brand name', 'Shining Bulls', 'Brand'),
  textVar('brand.tagline', 'Brand tagline', 'Shape the Future Side by Side', 'Brand'),
  textVar('brand.address', 'Registered office address', 'Chidda Singh, Azad Nagar, Ahmera Road Market, Meerut, Uttar Pradesh, 250001', 'Brand'),
  // Webinar Hero
  textVar('webinar.badge', 'Opportunity badge', '✦ $500 Billion Opportunity Taking Shape Above Us', 'Hero'),
  textVar('webinar.title', 'Main title', 'Understand How Rockets & Satellites Are Creating a New Investment Frontier', 'Hero'),
  textVar('webinar.tagline', 'Supporting tagline', 'Designed for investors who want to understand the space economy from the ground up.', 'Hero'),
  textVar('webinar.price', 'Ticket price', '₹499', 'Schedule'),
  textVar('webinar.date', 'Webinar date', '14 NOV 2026', 'Schedule'),
  textVar('webinar.time', 'Webinar time', '7:00 PM IST', 'Schedule'),
  textVar('webinar.duration', 'Duration', '2 HOURS', 'Schedule'),
  textVar('webinar.platform', 'Platform mode', 'LIVE ON ZOOM', 'Schedule'),
  textVar('webinar.riskWarning', 'Risk notice', 'Investments in the securities market are subject to market risks. Read all related documents carefully before investing.', 'Hero'),
  // CTA
  textVar('cta.label', 'Primary button label', 'Register Now @ ₹499 ↗', 'Call to action'),
  urlVar('cta.link', 'Primary button link', 'https://example.com/register', 'Call to action'),
  // Hero Bullets
  listVar('heroHighlights', 'Hero key highlights', [
    { point: 'Learn how big the global space economy is and what is driving its growth.' },
    { point: 'Map the space value chain, from launch vehicles to satellites and components.' },
    { point: "Explore India's space opportunity and a framework to assess it with discipline." },
  ], [{ key: 'point', label: 'Highlight', type: 'text', required: true }], 'Hero'),
  // Segments
  listVar('segments', 'Curriculum segments', [
    { icon: '🚀', title: 'Launch Vehicles', description: 'Next-gen orbital and suborbital heavy-lift rocket technology and payload economics.' },
    { icon: '🛰️', title: 'Satellites', description: 'Low Earth Orbit (LEO) constellations, miniaturization, and satellite manufacturing.' },
    { icon: '📡', title: 'Satellite Communication', description: 'High-throughput broadband, direct-to-cell telecom, and global coverage networks.' },
    { icon: '🌍', title: 'Earth Observation', description: 'Hyperspectral optical imaging, synthetic aperture radar (SAR), and climate analytics.' },
    { icon: '⚙️', title: 'Space Components', description: 'Radiation-hardened semiconductors, advanced composite materials, and propulsion.' },
    { icon: '🛡️', title: 'Defence & Aerospace', description: 'Strategic space commands, national sovereign security assets, and dual-use capabilities.' },
  ], [
    { key: 'icon', label: 'Icon', type: 'text', required: true },
    { key: 'title', label: 'Segment name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'longtext', required: true },
  ], 'Curriculum'),
  // Why Attend takeaways
  listVar('takeaways', 'Key takeaways', [
    { title: 'Global Market Size', description: 'Understand the size, compound growth, and core drivers of the global space economy.' },
    { title: 'End-to-End Value Chain', description: 'See how the space value chain fits together, from launch providers to downstream data.' },
    { title: 'Value Creation Models', description: 'Learn how launch services, payload operators, and satellite constellations monetize.' },
    { title: 'Component Manufacturing', description: 'Discover the role of specialized suppliers, precision machining, and recurring supply contracts.' },
    { title: 'National Agency Ecosystem', description: "Understand the catalyst role of India's public space agency and enabling private policy." },
    { title: 'Private Players & Themes', description: 'Track emerging private startups, tier-1 defense contractors, and key domestic themes.' },
    { title: 'Opportunity Framework', description: 'Get a clear, battle-tested framework to identify competitive moats in emerging tech.' },
    { title: 'Risk Management', description: 'Learn how to recognize capital intensity, regulatory bottlenecks, and manage portfolio risks.' },
  ], [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'longtext', required: true },
  ], 'Why Attend'),
  // Target audience
  listVar('targetAudience', 'Who is this for', [
    { icon: '📈', title: 'Long-term Investors', description: 'Looking to understand emerging sectors deeply before deploying capital with high conviction.' },
    { icon: '💼', title: 'Working Professionals', description: 'Who want a clear, time-efficient, structured view of next-generation technology economies.' },
    { icon: '🚀', title: 'Market Enthusiasts', description: 'Curious how aerospace engineering and satellites translate into durable business models.' },
  ], [
    { key: 'icon', label: 'Icon', type: 'text', required: true },
    { key: 'title', label: 'Audience type', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'longtext', required: true },
  ], 'Audience'),
  // Sector attention pillars
  listVar('sectorPillars', 'Sector pillars', [
    { icon: '🏛️', title: 'From Government Missions to Private Enterprise', description: 'Space is no longer only the domain of national agencies. Private companies now build launchers, satellites, and components, opening the sector to a far wider ecosystem.' },
    { icon: '🛰️', title: 'Satellites Power Everyday Life', description: 'Communication, navigation, weather forecasting, and mapping all depend on satellites, creating steady, recurring demand across the value chain.' },
    { icon: '🔍', title: 'A Long-Term Theme That Rewards Research', description: 'Emerging industries carry real risks. A structured framework helps you separate durable, cash-flow-generative opportunities from short-term market hype.' },
  ], [
    { key: 'icon', label: 'Icon', type: 'text', required: true },
    { key: 'title', label: 'Pillar title', type: 'text', required: true },
    { key: 'description', label: 'Explanation', type: 'longtext', required: true },
  ], 'Sector Analysis'),
  textVar('conviction.banner', 'Conviction statement', 'Research. Not Rumours. Every idea is backed by deep analysis — no tips, no noise, just facts.', 'Mindset'),
  textVar('decision.title', 'Decision title', 'The Decision Is Yours To Make...', 'Mindset'),
  textVar('decision.subtitle', 'Decision subtitle', 'Ready to understand the next frontier of growth? Spend 2 HOURS learning how the space economy really works.', 'Mindset'),
  textVar('decision.callout', 'Discipline callout', 'Emotionless. Smart Investing. We follow logic, not fear or greed — discipline & patience is our superpower in the market.', 'Mindset'),
  // Inclusions
  listVar('inclusions', "What's included in registration", [
    { tag: 'INCLUDED 1', icon: '🎙️', title: 'Live Session with Expert', description: 'A 2 HOURS live walkthrough of the space economy with deep fundamental models and case studies.' },
    { tag: 'INCLUDED 2', icon: '💬', title: 'Interactive Q&A Session', description: 'Bring your specific questions and get them answered live by the analyst at the end of the session.' },
    { tag: 'INCLUDED 3', icon: '🤝', title: 'Exclusive Community Access', description: 'Stay connected with fellow attendees, access research summaries, and continue learning after the webinar.' },
  ], [
    { key: 'tag', label: 'Tag', type: 'text', required: true },
    { key: 'icon', label: 'Icon', type: 'text', required: true },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'longtext', required: true },
  ], 'Inclusions'),
  // Speaker
  textVar('speaker.name', 'Speaker name', 'Vikas Dimaniya', 'Speaker'),
  textVar('speaker.title', 'Speaker title', 'CEO & Research Lead', 'Speaker'),
  textVar('speaker.company', 'Speaker company', 'Shining Bulls', 'Speaker'),
  { key: 'speaker.photo', label: 'Speaker photo', type: 'image', default: photo('office', 500, 500), group: 'Speaker' },
  listVar('speakerPoints', 'Speaker credentials', [
    { point: 'CEO, Shining Bulls' },
    { point: '15+ years of institutional and retail market experience' },
    { point: "Leads this masterclass on the global space economy, its value chain and India's opportunity" },
    { point: 'Shares a practical framework for identifying opportunities and managing downside risks' },
    { point: 'Answers your questions live in a dedicated interactive Q&A' },
  ], [{ key: 'point', label: 'Point', type: 'text', required: true }], 'Speaker'),
  // FAQ
  textVar('faq.subtitle', 'FAQ intro', "We've tried our best to answer the common questions you might have. For anything else, message us on WhatsApp.", 'FAQ'),
  listVar('faqs', 'Frequently asked questions', [
    { question: 'When and where is the webinar, and how long will it be?', answer: 'The webinar is on Saturday, 14 November 2026 at 7:00 PM IST, live on Zoom. It runs for about 2 hours.' },
    { question: 'Do I need prior knowledge of the space sector or investing?', answer: 'No. The session starts with the fundamentals of the space economy before moving on to the value chain and the investment framework.' },
    { question: 'How will I receive the joining link?', answer: 'The joining link will be shared with you immediately via email and WhatsApp upon registration, ahead of the live session.' },
    { question: 'What should I keep ready before the webinar starts?', answer: 'Join 10 minutes early with a stable internet connection, and keep a notebook handy for key points and questions during the Q&A.' },
    { question: 'What does the ₹499 registration fee include?', answer: 'Your registration includes the 2-hour live walkthrough with the expert, interactive Q&A access, and exclusive community learning materials.' },
    { question: 'Is this investment advice?', answer: 'No. This webinar is purely educational and does not recommend buying or selling any security. Always do your own research before investing.' },
  ], [
    { key: 'question', label: 'Question', type: 'text', required: true },
    { key: 'answer', label: 'Answer', type: 'longtext', required: true },
  ], 'FAQ'),
  // Contact
  textVar('contact.phone', 'WhatsApp / Support phone', '+91 9599927746', 'Contact'),
  textVar('contact.email', 'Support email', 'support@shiningbulls.com', 'Contact'),
  // Regulatory
  textVar('sebi.regNo', 'SEBI registration number', 'INA000020271', 'Compliance'),
  textVar('sebi.regType', 'Registration category', 'SEBI Registered Investment Adviser', 'Compliance'),
  textVar('sebi.supervisoryBody', 'Recognised supervisory body', 'BSE (Enlistment No. 2273)', 'Compliance'),
  longVar('footer.disclaimer', 'Statutory disclaimer', 'All information shared in this webinar is for educational purposes only and does not constitute investment advice or a recommendation to buy or sell any security. Participation is limited to individuals aged 18 and above. Investments in the securities market are subject to market risks; read all related documents carefully before investing. Past performance does not guarantee future results, and individual outcomes will vary. By registering, you accept sole responsibility for your investment decisions. Registration granted by SEBI, membership of BSE and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors.', 'Compliance'),
  textVar('footer.copyright', 'Copyright line', '© 2026 Shining Bulls. All rights reserved.', 'Compliance'),
], [onePage([
  // ── 1. Top Notice / Tagline Bar ───────────────────────────────────────────
  el('Section', { styles: { background: 'var(--fp-surface)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', paddingBottom: '14px' } }, [
    el('Container', { styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' } }, [
      text('✦ {{brand.tagline}}', { fontWeight: 600, fontSize: '0.875rem', color: 'var(--fp-primary)' }),
      button('{{cta.label}}', '{{cta.link}}', 'primary'),
    ]),
  ]),

  // ── 2. Hero Section ───────────────────────────────────────────────────────
  section([
    el('Box', { styles: { alignItems: 'center', textAlign: 'center', gap: '20px', maxWidth: '860px', marginLeft: 'auto', marginRight: 'auto' } }, [
      el('Box', { styles: { display: 'inline-flex', background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.3)', borderRadius: '999px', padding: '6px 18px' } }, [
        text('{{webinar.badge}}', { fontWeight: 600, fontSize: '0.875rem', color: 'var(--fp-primary)' }),
      ]),
      heading('{{webinar.title}}', 'h1', { fontSize: '2.5rem', lineHeight: '1.2' }),
      el('Box', { styles: { gap: '10px', textAlign: 'left', maxWidth: '680px', width: '100%', marginTop: '8px' } }, [
        el('Text', { repeat: { list: 'heroHighlights', as: 'hl' }, props: { text: '✔ {{hl.point}}' }, styles: { fontSize: '1.0625rem', lineHeight: '1.6' } }),
      ]),
      el('Grid', { styles: { gap: '16px', width: '100%', maxWidth: '740px', marginTop: '16px', background: 'var(--fp-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' } }, [
        el('Box', { styles: { textAlign: 'center', gap: '4px' } }, [text('📅 Date', { fontSize: '0.75rem', color: 'var(--fp-muted)' }), heading('{{webinar.date}}', 'h4', { margin: '0' })]),
        el('Box', { styles: { textAlign: 'center', gap: '4px' } }, [text('🕖 Time', { fontSize: '0.75rem', color: 'var(--fp-muted)' }), heading('{{webinar.time}}', 'h4', { margin: '0' })]),
        el('Box', { styles: { textAlign: 'center', gap: '4px' } }, [text('⏳ Duration', { fontSize: '0.75rem', color: 'var(--fp-muted)' }), heading('{{webinar.duration}}', 'h4', { margin: '0' })]),
        el('Box', { styles: { textAlign: 'center', gap: '4px' } }, [text('🎥 Mode', { fontSize: '0.75rem', color: 'var(--fp-muted)' }), heading('{{webinar.platform}}', 'h4', { margin: '0' })]),
      ]),
      el('Box', { styles: { alignItems: 'center', gap: '12px', marginTop: '16px' } }, [
        button('{{cta.label}}', '{{cta.link}}'),
        text('{{webinar.tagline}}', { fontSize: '0.875rem', color: 'var(--fp-muted)' }),
        text('⚠️ {{webinar.riskWarning}}', { fontSize: '0.75rem', color: 'var(--fp-muted)', maxWidth: '660px', lineHeight: '1.5' }),
      ]),
    ]),
  ], { paddingTop: '64px', paddingBottom: '64px' }),

  // ── 3. Quick Action Strip ─────────────────────────────────────────────────
  section([
    el('Card', { styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'linear-gradient(90deg, var(--fp-surface), rgba(45,212,191,0.08))', border: '1px solid rgba(45,212,191,0.3)' } }, [
      el('Box', { styles: { gap: '4px' } }, [
        heading('{{webinar.price}} · Live Webinar Registration', 'h3', { margin: '0' }),
        text('Live on {{webinar.date}} at {{webinar.time}} (Zoom)', { color: 'var(--fp-muted)', fontSize: '0.9375rem' }),
      ]),
      button('{{cta.label}}', '{{cta.link}}'),
    ]),
  ]),

  // ── 4. Segments You'll Explore ────────────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '8px', marginBottom: '8px' } }, [
      text('CURRICULUM BREAKDOWN', { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--fp-primary)' }),
      heading("Segments You'll Explore", 'h2'),
      text('A comprehensive look across the entire technology and capital value chain.', { color: 'var(--fp-muted)' }),
    ]),
    el('Grid', {}, [
      el('Card', { repeat: { list: 'segments', as: 'seg' }, styles: { gap: '8px', hoverEffect: 'lift', animation: 'fp-slide-up', transition: 'all 0.25s ease' } }, [
        heading('{{seg.icon}} {{seg.title}}', 'h3'),
        text('{{seg.description}}', { color: 'var(--fp-muted)', fontSize: '0.9375rem', lineHeight: '1.5' }),
      ]),
    ]),
  ]),

  // ── 5. Why Attend This Webinar? ───────────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '8px', marginBottom: '8px' } }, [
      text('ACTIONABLE INSIGHTS', { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--fp-primary)' }),
      heading('Why Attend This Webinar?', 'h2'),
      text('Learn disciplined research principles and frameworks you can apply directly.', { color: 'var(--fp-muted)' }),
    ]),
    el('Grid', {}, [
      el('Card', { repeat: { list: 'takeaways', as: 'item' }, styles: { gap: '6px', hoverEffect: 'lift', animation: 'fp-slide-up', transition: 'all 0.25s ease' } }, [
        heading('✔ {{item.title}}', 'h4', { color: 'var(--fp-primary)', margin: '0' }),
        text('{{item.description}}', { color: 'var(--fp-muted)', fontSize: '0.9375rem' }),
      ]),
    ]),
    el('Box', { styles: { alignItems: 'center', marginTop: '16px' } }, [
      button('{{cta.label}}', '{{cta.link}}'),
    ]),
  ]),

  // ── 6. Target Audience ────────────────────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '8px', marginBottom: '8px' } }, [
      text('FOR PRUDENT LEARNERS', { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--fp-primary)' }),
      heading('This Webinar Is For You If You Are...', 'h2'),
    ]),
    el('Grid', {}, [
      el('Card', { repeat: { list: 'targetAudience', as: 'aud' }, styles: { gap: '10px', hoverEffect: 'lift', animation: 'fp-slide-up', transition: 'all 0.25s ease' } }, [
        heading('{{aud.icon}} {{aud.title}}', 'h3'),
        text('{{aud.description}}', { color: 'var(--fp-muted)', fontSize: '0.9375rem', lineHeight: '1.55' }),
      ]),
    ]),
  ]),

  // ── 7. Sector Attention & Conviction ──────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '8px', marginBottom: '8px' } }, [
      text('MACRO LANDSCAPE', { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--fp-primary)' }),
      heading("Here's Why This Sector Is Getting Everyone's Attention", 'h2'),
    ]),
    el('Grid', {}, [
      el('Card', { repeat: { list: 'sectorPillars', as: 'pillar' }, styles: { gap: '10px', hoverEffect: 'lift', animation: 'fp-slide-up', transition: 'all 0.25s ease' } }, [
        heading('{{pillar.icon}} {{pillar.title}}', 'h3'),
        text('{{pillar.description}}', { color: 'var(--fp-muted)', fontSize: '0.9375rem', lineHeight: '1.6' }),
      ]),
    ]),
    el('Box', { styles: { background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.3)', borderRadius: '12px', padding: '24px', textAlign: 'center', maxWidth: '780px', marginLeft: 'auto', marginRight: 'auto', marginTop: '16px' } }, [
      heading('{{conviction.banner}}', 'h3', { margin: '0', color: 'var(--fp-primary)' }),
    ]),
  ]),

  // ── 8. Inclusions ─────────────────────────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '8px', marginBottom: '8px' } }, [
      text('FULL ACCESS', { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--fp-primary)' }),
      heading("Here's Everything You Get for Just {{webinar.price}}", 'h2'),
    ]),
    el('Grid', {}, [
      el('Card', { repeat: { list: 'inclusions', as: 'inc' }, styles: { gap: '12px', borderTop: '3px solid var(--fp-primary)', hoverEffect: 'lift', animation: 'fp-slide-up', transition: 'all 0.25s ease' } }, [
        el('Box', { styles: { display: 'inline-flex', background: 'rgba(45,212,191,0.15)', borderRadius: '6px', padding: '4px 10px', alignSelf: 'flex-start' } }, [
          text('{{inc.tag}}', { fontWeight: 700, fontSize: '0.75rem', color: 'var(--fp-primary)' }),
        ]),
        heading('{{inc.icon}} {{inc.title}}', 'h3'),
        text('{{inc.description}}', { color: 'var(--fp-muted)', fontSize: '0.9375rem', lineHeight: '1.6' }),
      ]),
    ]),
  ]),

  // ── 9. Decision & Discipline Banner ───────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '16px', maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto' } }, [
      heading('{{decision.title}}', 'h2'),
      text('{{decision.subtitle}}', { fontSize: '1.125rem', color: 'var(--fp-muted)' }),
      el('Card', { styles: { background: 'var(--fp-surface)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px' } }, [
        text('{{decision.callout}}', { fontWeight: 600, fontSize: '1.0625rem', color: '#f1f5f9', lineHeight: '1.6' }),
      ]),
      button('{{cta.label}}', '{{cta.link}}'),
    ]),
  ], { background: 'linear-gradient(180deg, transparent, rgba(15,39,51,0.6))', paddingTop: '64px', paddingBottom: '64px' }),

  // ── 10. Meet Your Speaker ─────────────────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '8px', marginBottom: '8px' } }, [
      text('EXPERT SPEAKER', { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--fp-primary)' }),
      heading('Meet Your Speaker', 'h2'),
    ]),
    el('Grid', { styles: { gap: '48px', alignItems: 'center' } }, [
      image('{{speaker.photo}}', '{{speaker.name}}', { height: '360px', borderRadius: '16px', objectFit: 'cover' }, 'speaker.photo'),
      el('Box', { styles: { gap: '16px' } }, [
        heading('{{speaker.name}}', 'h2'),
        text('{{speaker.title}} · {{speaker.company}}', { fontWeight: 600, color: 'var(--fp-primary)', fontSize: '1.125rem' }),
        el('Box', { styles: { gap: '10px' } }, [
          el('Text', { repeat: { list: 'speakerPoints', as: 'sp' }, props: { text: '✔ {{sp.point}}' }, styles: { fontSize: '0.9375rem', color: 'var(--fp-muted)', lineHeight: '1.5' } }),
        ]),
        button('{{cta.label}}', '{{cta.link}}'),
      ]),
    ]),
  ]),

  // ── 11. Urgency / Live Reservation Callout ────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '16px', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' } }, [
      heading('Join the Live Webinar at Just {{webinar.price}}', 'h2'),
      text('📅 {{webinar.date}} · 🕖 {{webinar.time}} · 🎥 {{webinar.platform}}', { fontSize: '1.125rem', color: 'var(--fp-primary)', fontWeight: 600 }),
      button('{{cta.label}}', '{{cta.link}}'),
    ]),
  ], { background: 'var(--fp-surface)', borderRadius: '16px', paddingTop: '48px', paddingBottom: '48px' }),

  // ── 12. FAQ's & Support ───────────────────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '8px', marginBottom: '8px' } }, [
      text('COMMON QUESTIONS', { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--fp-primary)' }),
      heading("FAQ's", 'h2'),
      text('{{faq.subtitle}}', { color: 'var(--fp-muted)' }),
    ]),
    el('Card', { styles: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.2)' } }, [
      text('💬 Still have questions? WhatsApp: {{contact.phone}} | Email: {{contact.email}}', { fontWeight: 500, fontSize: '0.9375rem' }),
      button('Chat on WhatsApp', 'https://wa.me/{{contact.phone}}', 'secondary'),
    ]),
    el('Box', { styles: { gap: '12px' } }, [
      el('Accordion', { repeat: { list: 'faqs', as: 'faq' }, props: { question: '{{faq.question}}', answer: '{{faq.answer}}' } }),
    ]),
  ]),

  // ── 13. Regulatory Details ────────────────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '8px', marginBottom: '8px' } }, [
      text('TRANSPARENCY & COMPLIANCE', { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--fp-primary)' }),
      heading('Regulatory Details', 'h2'),
    ]),
    el('Grid', { styles: { gap: '20px' } }, [
      el('Card', { styles: { gap: '8px' } }, [
        text('🏢 Brand Name', { fontWeight: 700, fontSize: '0.875rem' }),
        text('{{brand.name}}', { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
        text('📜 SEBI Registration', { fontWeight: 700, fontSize: '0.875rem', marginTop: '8px' }),
        text('{{sebi.regType}}: {{sebi.regNo}}', { fontFamily: 'monospace', color: 'var(--fp-primary)', fontSize: '0.875rem' }),
        text('🏛 Supervisory Body', { fontWeight: 700, fontSize: '0.875rem', marginTop: '8px' }),
        text('{{sebi.supervisoryBody}}', { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
      ]),
      el('Card', { styles: { gap: '8px' } }, [
        text('📍 Registered Address', { fontWeight: 700, fontSize: '0.875rem' }),
        text('{{brand.address}}', { color: 'var(--fp-muted)', fontSize: '0.875rem', lineHeight: '1.6' }),
        text('📞 Support & Contact', { fontWeight: 700, fontSize: '0.875rem', marginTop: '8px' }),
        text('Phone: {{contact.phone}} | Email: {{contact.email}}', { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
      ]),
    ]),
  ]),

  // ── 14. Disclaimer & Footer ───────────────────────────────────────────────
  section([
    el('Box', { styles: { textAlign: 'center', gap: '12px', maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto' } }, [
      text('DISCLAIMER: {{webinar.title}}', { fontWeight: 700, fontSize: '0.8125rem', letterSpacing: '0.05em' }),
      text('{{footer.disclaimer}}', { fontSize: '0.75rem', color: 'var(--fp-muted)', lineHeight: '1.65' }),
      el('Divider'),
      text('{{footer.copyright}}', { fontSize: '0.75rem', color: 'var(--fp-muted)' }),
    ]),
  ], { background: 'var(--fp-surface)', paddingTop: '32px', paddingBottom: '32px' }),

], '{{webinar.title}}', '{{webinar.tagline}}')], { titleVariable: 'webinar.title', category: 'Landing page' });

export const PAGE_TEMPLATES: TemplateDefinition[] = [
  article,
  docsArticle,
  caseStudy,
  saasLanding,
  ebook,
  appDownload,
  thankYou,
  consultation,
  researchAnalyst,
  financialWebinar,
];
