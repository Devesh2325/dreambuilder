import { VariableDef } from '../core/variables';
import { photo } from './assets';
import { buildContent, button, el, El, heading, image, section, TemplateDefinition, TemplatePage, text } from './dsl';
import { field, listVar, longVar, make, textVar, urlVar } from './experiences';
import { THEME_CORAL, THEME_EMERALD, THEME_INDIGO, THEME_MIDNIGHT, THEME_MONO, THEME_TERRACOTTA } from './themes';

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
  el('Grid', {}, [el('Card', { repeat: { list, as } }, [heading(`{{${as}.title}}`, 'h3'), text(`{{${as}.description}}`, { color: 'var(--fp-muted)' }, `${as}.description`)])]);

const gradientHero = (children: El[], background: string): El =>
  section([el('Box', { styles: { alignItems: 'center', textAlign: 'center', gap: '20px', maxWidth: '780px', marginLeft: 'auto', marginRight: 'auto' } }, children)], { background, color: '#ffffff', paddingTop: '96px', paddingBottom: '96px' });

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

export const PAGE_TEMPLATES: TemplateDefinition[] = [article, docsArticle, caseStudy, saasLanding, ebook, appDownload, thankYou, consultation];
