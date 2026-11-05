import { DEFAULT_TRIGGERS, ProjectSettings, ProjectType } from '../core/schema';
import { VariableDef } from '../core/variables';
import {
  actionButton, buildContent, button, el, El, experience, heading, image, section, TemplateDefinition, TemplatePage, text, ThemePreset,
} from './dsl';
import { mockScreen, photo } from './assets';
import { ALL_THEMES, THEME_CORAL, THEME_EMERALD, THEME_INDIGO, THEME_MIDNIGHT, THEME_MONO, THEME_TERRACOTTA } from './themes';


const OVERLAY_SETTINGS: ProjectSettings = { triggers: DEFAULT_TRIGGERS };

export function make(
  type: ProjectType,
  id: string,
  title: string,
  description: string,
  tags: string[],
  theme: ThemePreset,
  variables: VariableDef[],
  pages: TemplatePage[],
  extra: { settings?: ProjectSettings; titleVariable?: string; category?: string } = {},
): TemplateDefinition {
  return {
    id: `${type}-${id}`,
    type,
    version: 1,
    title,
    description,
    tags,
    variables,
    themes: [theme, ...ALL_THEMES.filter((other) => other !== theme)],
    pages,
    ...extra,
  };
}

export const textVar = (key: string, label: string, value: string, group?: string): VariableDef => ({
  key, label, type: 'text', required: true, default: value, group,
});
export const longVar = (key: string, label: string, value: string, group?: string): VariableDef => ({
  key, label, type: 'longtext', default: value, group,
});
export const urlVar = (key: string, label: string, value: string, group?: string): VariableDef => ({
  key, label, type: 'url', default: value, group,
});
export const listVar = (key: string, label: string, items: Record<string, unknown>[], itemFields: VariableDef[], group?: string): VariableDef => ({
  key, label, type: 'list', default: items, itemFields, minItems: 1, maxItems: 20, group,
});

// ---- Landing pages ----------------------------------------------------------

const heroSection = (cta = '{{cta.link}}'): El =>
  section([
    el('Box', { styles: { alignItems: 'center', textAlign: 'center', gap: '20px', maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto' } }, [
      heading('{{headline}}', 'h1'),
      text('{{subheadline}}', { fontSize: '1.25rem', color: 'var(--fp-muted)' }, 'subheadline'),
      button('{{cta.label}}', cta),
    ]),
  ]);

const landingPage = (children: El[]): TemplatePage => ({
  kind: 'page',
  title: 'Home',
  slug: '',
  seo: { title: '{{headline}}', description: '{{subheadline}}' },
  content: buildContent('p', children),
});

const pageVariables = (headline: string, sub: string, label: string): VariableDef[] => [
  textVar('headline', 'Headline', headline, 'Main message'),
  longVar('subheadline', 'Supporting text', sub, 'Main message'),
  textVar('cta.label', 'Button label', label, 'Main message'),
  urlVar('cta.link', 'Button link', 'https://example.com', 'Main message'),
];

const pageTemplates = [
  make('page', 'launch', 'Product launch', 'Announce something new, with benefits and one clear action.', ['launch', 'product'], THEME_INDIGO, [
    ...pageVariables('Meet the easiest way to get it done', 'Our newest release saves your team hours every week.', 'Try it free'),
    listVar('benefits', 'Benefits', [
      { title: 'Save time', description: 'Automate the busywork.' },
      { title: 'Stay aligned', description: 'One place for the whole team.' },
      { title: 'Grow faster', description: 'See what works and do more of it.' },
    ], [{ key: 'title', label: 'Title', type: 'text', required: true }, { key: 'description', label: 'Description', type: 'longtext' }], 'Benefits'),
  ], [landingPage([
    heroSection(),
    section([el('Grid', {}, [el('Card', { repeat: { list: 'benefits', as: 'benefit' } }, [heading('{{benefit.title}}', 'h3'), text('{{benefit.description}}', { color: 'var(--fp-muted)' })])])], { backgroundColor: 'var(--fp-surface)' }),
  ])], { titleVariable: 'headline' }),

  make('page', 'event', 'Event sign-up', 'Share the details of your event and collect registrations.', ['event', 'webinar'], THEME_MIDNIGHT, [
    ...pageVariables('Join us live', 'A one-hour session with practical advice you can use the same day.', 'Save my seat').filter((def) => def.key !== 'cta.link'),
    textVar('event.date', 'Date and time', 'March 12, 3pm', 'Event details'),
    textVar('event.place', 'Where', 'Online', 'Event details'),
  ], [landingPage([
    section([
      el('Grid', { styles: { gap: '48px', alignItems: 'center' } }, [
        el('Box', { styles: { gap: '16px' } }, [
          heading('{{headline}}', 'h1'),
          text('{{subheadline}}', { color: 'var(--fp-muted)' }, 'subheadline'),
          text('{{event.date}} | {{event.place}}', { fontWeight: 700 }),
        ]),
        el('Card', {}, [
          el('Form', { props: { submitText: '{{cta.label}}', successMessage: "You're on the list. See you there!" } }, [
            el('FormField', { props: { name: 'name', label: 'Name', required: true } }),
            el('FormField', { props: { name: 'email', label: 'Email', inputType: 'email', required: true } }),
          ]),
        ]),
      ]),
    ]),
  ])], { titleVariable: 'headline' }),

  make('page', 'coming-soon', 'Coming soon', 'Build a waitlist before you launch.', ['waitlist', 'launch'], THEME_MONO, [
    textVar('headline', 'Headline', 'Something new is coming', 'Main message'),
    longVar('subheadline', 'Supporting text', 'Leave your email and be the first to know.', 'Main message'),
  ], [landingPage([
    section([
      el('Box', { styles: { alignItems: 'center', textAlign: 'center', gap: '20px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' } }, [
        heading('{{headline}}', 'h1'),
        text('{{subheadline}}', { color: 'var(--fp-muted)' }),
        el('Form', { props: { submitText: 'Notify me', successMessage: "Thanks! We'll be in touch." } }, [
          el('FormField', { props: { name: 'email', label: 'Email', inputType: 'email', required: true } }),
        ]),
      ]),
    ], { minHeight: '80vh', display: 'flex', alignItems: 'center' }),
  ])], { titleVariable: 'headline' }),
];

// ---- Tours ------------------------------------------------------------------

const selectorVar = (key: string, label: string, value: string): VariableDef => ({
  key, label, type: 'text', required: true, default: value, group: 'Elements on your site',
  help: 'Which part of your site this step points at. Select the step and use Pick on my site, and this is filled in for you.',
});

const tourStep = (selector: string, placement: string, title: string, body: string, buttons: El[]): El =>
  el('TourStep', { props: { selector, placement, fallback: 'center', spotlight: true } }, [
    heading(title, 'h4'),
    text(body, { color: 'var(--fp-muted)', fontSize: '.9375rem' }),
    el('Row', { styles: { justifyContent: 'flex-end', gap: '8px' } }, buttons),
  ]);

const nextBack = [actionButton('Back', 'prev', 'secondary'), actionButton('Next', 'next')];

const tourTemplates = [
  make('tour', 'welcome', 'Welcome tour', 'Introduce new users to the main parts of your app.', ['onboarding', 'welcome'], THEME_INDIGO, [
    textVar('product', 'Product name', 'Acme', 'Your product'),
    selectorVar('nav.selector', 'Navigation element', 'nav'),
    selectorVar('action.selector', 'Main button', 'button'),
  ], [experience([
    tourStep('', 'bottom', 'Welcome to {{product}}!', "Here's a quick look around. It takes less than a minute.", [actionButton('Skip', 'close', 'link'), actionButton('Start', 'next')]),
    tourStep('{{nav.selector}}', 'bottom', 'Find your way', 'Everything you need is in the navigation.', nextBack),
    tourStep('{{action.selector}}', 'bottom', 'Get started', 'This is where most people begin.', [actionButton('Back', 'prev', 'secondary'), actionButton('Finish', 'next')]),
  ])], { settings: OVERLAY_SETTINGS }),

  make('tour', 'feature', 'New feature spotlight', 'Point out one new feature in a couple of steps.', ['feature', 'adoption'], THEME_EMERALD, [
    textVar('feature.name', 'Feature name', 'Reports', 'The feature'),
    longVar('feature.benefit', 'Why it helps', 'See how your work is going at a glance.', 'The feature'),
    selectorVar('feature.selector', 'Feature element', '#reports'),
  ], [experience([
    tourStep('{{feature.selector}}', 'right', 'New: {{feature.name}}', '{{feature.benefit}}', [actionButton('Got it', 'next')]),
  ])], { settings: OVERLAY_SETTINGS }),

  make('tour', 'setup', 'Account setup guide', 'Walk users through the steps to finish setting up.', ['setup', 'activation'], THEME_CORAL, [
    selectorVar('profile.selector', 'Profile element', '#profile'),
    selectorVar('invite.selector', 'Invite button', '#invite'),
    selectorVar('settings.selector', 'Settings link', '#settings'),
  ], [experience([
    tourStep('{{profile.selector}}', 'bottom', 'Complete your profile', 'Add your name and photo so your team recognizes you.', [actionButton('Next', 'next')]),
    tourStep('{{invite.selector}}', 'bottom', 'Invite your team', 'Work goes faster together.', nextBack),
    tourStep('{{settings.selector}}', 'left', 'Adjust your settings', 'Make it work the way you do.', [actionButton('Back', 'prev', 'secondary'), actionButton('Done', 'next')]),
  ])], { settings: OVERLAY_SETTINGS }),
  make('tour', 'upgrade', 'Upgrade prompt', 'Show free users what they get by upgrading.', ['upsell', 'revenue'], THEME_MIDNIGHT, [
    textVar('plan', 'Plan name', 'Pro', 'The offer'),
    longVar('benefit', 'Main benefit', 'Unlimited reports, more seats and priority support.', 'The offer'),
    selectorVar('upgrade.selector', 'Upgrade button', '#upgrade'),
  ], [experience([
    tourStep('{{upgrade.selector}}', 'bottom', 'Ready for {{plan}}?', '{{benefit}}', [actionButton('Not now', 'close', 'link'), actionButton('Show me', 'next')]),
  ])], { settings: OVERLAY_SETTINGS }),
];

// ---- Forms ------------------------------------------------------------------

export const formPage = (submitText: string, success: string, children: El[]): TemplatePage =>
  experience([el('Form', { props: { submitText, successMessage: success } }, children)], { padding: '32px max(24px, calc((100% - 640px) / 2))' });

export const field = (name: string, label: string, inputType = 'text', required = true, optionsText = ''): El =>
  el('FormField', { props: { name, label, inputType, required, optionsText } });

const formTemplates = [
  make('form', 'contact', 'Contact form', 'The classic: name, email and message.', ['contact', 'support'], THEME_INDIGO, [
    textVar('form.title', 'Title', 'Contact us', 'Form text'),
    longVar('form.intro', 'Introduction', "Send us a message and we'll reply soon.", 'Form text'),
    textVar('form.thanks', 'Thank-you message', "Thanks! We'll be in touch.", 'Form text'),
  ], [formPage('Send', '{{form.thanks}}', [
    heading('{{form.title}}', 'h2'),
    text('{{form.intro}}', { color: 'var(--fp-muted)' }, 'form.intro'),
    field('name', 'Name'),
    field('email', 'Email', 'email'),
    field('message', 'Message', 'textarea'),
  ])], { titleVariable: 'form.title' }),

  make('form', 'lead', 'Lead capture', 'Qualify enquiries with a short multi-step form.', ['leads', 'sales', 'multi-step'], THEME_EMERALD, [
    textVar('form.title', 'Title', 'Request a demo', 'Form text'),
    textVar('form.thanks', 'Thank-you message', 'Thanks! Our team will contact you within one day.', 'Form text'),
    longVar('form.sizes', 'Company size options', '1-10\n11-50\n51-200\n200+', 'Questions'),
  ], [formPage('Request demo', '{{form.thanks}}', [
    heading('{{form.title}}', 'h2'),
    el('FormStep', { props: { title: 'About you' } }, [field('name', 'Name'), field('email', 'Work email', 'email')]),
    el('FormStep', { props: { title: 'Your company' } }, [
      field('company', 'Company'),
      el('FormField', { props: { name: 'size', label: 'Company size', inputType: 'select', required: true, optionsText: '{{form.sizes}}' } }),
    ]),
  ])], { titleVariable: 'form.title' }),

  make('form', 'booking', 'Booking request', 'Let customers ask for a date and service.', ['booking', 'appointments'], THEME_TERRACOTTA, [
    textVar('form.title', 'Title', 'Book an appointment', 'Form text'),
    longVar('form.services', 'Services (one per line)', 'Consultation\nFull service\nFollow-up', 'Questions'),
    textVar('form.thanks', 'Thank-you message', "Thanks! We'll confirm your booking shortly.", 'Form text'),
  ], [formPage('Request booking', '{{form.thanks}}', [
    heading('{{form.title}}', 'h2'),
    field('name', 'Name'),
    field('phone', 'Phone', 'tel'),
    el('FormField', { props: { name: 'service', label: 'Service', inputType: 'select', required: true, optionsText: '{{form.services}}' } }),
    field('date', 'Preferred date', 'date'),
    field('notes', 'Anything else?', 'textarea', false),
  ])], { titleVariable: 'form.title' }),

  make('form', 'feedback', 'Customer feedback', 'A rating scale with a follow-up question.', ['feedback', 'nps', 'rating'], THEME_INDIGO, [
    textVar('form.title', 'Title', 'How did we do?', 'Form text'),
    textVar('form.question', 'Rating question', 'How likely are you to recommend us?', 'Form text'),
    textVar('form.thanks', 'Thank-you message', 'Thanks for your feedback!', 'Form text'),
  ], [formPage('Send', '{{form.thanks}}', [
    heading('{{form.title}}', 'h2'),
    el('ScaleField', { props: { name: 'score', label: '{{form.question}}', min: 0, max: 10, required: true } }),
    field('reason', 'What is the main reason for your score?', 'textarea', false),
  ])], { titleVariable: 'form.title' }),
  make('form', 'job-application', 'Job application', 'Collect applications with contact details and experience.', ['hr', 'careers', 'recruiting'], THEME_MONO, [
    textVar('form.title', 'Title', 'Apply to join our team', 'Form text'),
    longVar('form.roles', 'Open roles (one per line)', 'Designer\nDeveloper\nCustomer support', 'Questions'),
    textVar('form.thanks', 'Thank-you message', 'Thanks for applying! We read every application.', 'Form text'),
  ], [formPage('Send application', '{{form.thanks}}', [
    heading('{{form.title}}', 'h2'),
    field('name', 'Full name'),
    field('email', 'Email', 'email'),
    el('FormField', { props: { name: 'role', label: 'Role', inputType: 'select', required: true, optionsText: '{{form.roles}}' } }),
    field('portfolio', 'Portfolio or LinkedIn', 'url', false),
    field('about', 'Why would you like to join us?', 'textarea'),
  ])], { titleVariable: 'form.title' }),

  make('form', 'event-rsvp', 'Event RSVP', 'Let guests confirm and share their preferences.', ['event', 'invitation', 'wedding'], THEME_CORAL, [
    textVar('form.title', 'Title', 'Will you join us?', 'Form text'),
    longVar('form.details', 'Event details', 'Saturday, June 14 at 6pm', 'Form text'),
    textVar('form.thanks', 'Thank-you message', 'Thanks! We look forward to seeing you.', 'Form text'),
  ], [formPage('Send RSVP', '{{form.thanks}}', [
    heading('{{form.title}}', 'h2'),
    text('{{form.details}}', { color: 'var(--fp-muted)' }, 'form.details'),
    field('name', 'Your name'),
    el('FormField', { props: { name: 'attending', label: 'Are you coming?', inputType: 'radio', required: true, optionsText: 'Yes, I will be there\nSorry, I cannot make it' } }),
    field('guests', 'Number of guests', 'number', false),
  ])], { titleVariable: 'form.title' }),
];

// ---- Demos ------------------------------------------------------------------

const screen = (imageKey: string, x: number, y: number, tip: string): El =>
  el('DemoScreen', { props: { image: imageKey, alt: 'Product screen' } }, [el('DemoHotspot', { props: { x, y, tip, placement: y > 70 ? 'top' : 'bottom', align: x < 25 ? 'start' : x > 75 ? 'end' : 'center' } })]);

const screenVar = (key: string, label: string, kind: Parameters<typeof mockScreen>[0], accent?: string): VariableDef => ({
  key, label, type: 'image', required: true, default: mockScreen(kind, accent), group: 'Screenshots', help: 'Replace with a screenshot of your product.',
});

const demoTemplates = [
  make('demo', 'walkthrough', 'Product walkthrough', 'Three clickable screens showing your main flow.', ['walkthrough', 'sales'], THEME_INDIGO, [
    screenVar('screen.one', 'First screen', 'dashboard'),
    screenVar('screen.two', 'Second screen', 'list'),
    screenVar('screen.three', 'Last screen', 'success'),
    textVar('tip.one', 'First tip', 'Start here', 'Tips'),
    textVar('tip.two', 'Second tip', 'Then choose an option', 'Tips'),
    textVar('tip.three', 'Last tip', 'And see the result', 'Tips'),
  ], [experience([
    screen('{{screen.one}}', 12, 15, '{{tip.one}}'),
    screen('{{screen.two}}', 90, 5, '{{tip.two}}'),
    screen('{{screen.three}}', 58, 68, '{{tip.three}}'),
  ])]),

  make('demo', 'feature', 'Single feature demo', 'Two screens to show one feature in action.', ['feature', 'marketing'], THEME_MIDNIGHT, [
    screenVar('screen.before', 'Before', 'list', '#7c3aed'),
    screenVar('screen.after', 'After', 'detail', '#7c3aed'),
    textVar('tip.action', 'Tip', 'Click to see the magic', 'Tips'),
    textVar('tip.done', 'Closing tip', "That's it!", 'Tips'),
  ], [experience([screen('{{screen.before}}', 40, 26, '{{tip.action}}'), screen('{{screen.after}}', 28, 83, '{{tip.done}}')])]),

  make('demo', 'dashboard', 'Dashboard tour', 'Explore a dashboard with several stops.', ['dashboard', 'analytics'], THEME_EMERALD, [
    screenVar('screen.overview', 'Overview', 'dashboard', '#059669'),
    screenVar('screen.report', 'Report', 'report', '#059669'),
    screenVar('screen.share', 'Share', 'success', '#059669'),
    textVar('tip.overview', 'Overview tip', 'Open a report', 'Tips'),
    textVar('tip.report', 'Report tip', 'Share with your team', 'Tips'),
    textVar('tip.share', 'Share tip', 'All done', 'Tips'),
  ], [experience([
    screen('{{screen.overview}}', 40, 20, '{{tip.overview}}'),
    screen('{{screen.report}}', 90, 5, '{{tip.report}}'),
    screen('{{screen.share}}', 58, 68, '{{tip.share}}'),
  ])]),
];

// ---- Menus ------------------------------------------------------------------

const parseMenu = (items: string) => items.split('\n').map((line) => {
  const [label, href] = line.split(' | ');
  return { label, href };
});

const menuVariables = (brand: string, links: string, cta: string): VariableDef[] => [
  textVar('brand', 'Brand name', brand, 'Menu'),
  { key: 'logo', label: 'Logo', type: 'image', group: 'Menu' },
  listVar('links', 'Menu items', parseMenu(links), [
    { key: 'label', label: 'Label', type: 'text', required: true },
    { key: 'href', label: 'Link', type: 'url', required: true },
  ], 'Menu'),
  { key: 'cta.label', label: 'Button label', type: 'text', default: cta, group: 'Menu' },
  urlVar('cta.link', 'Button link', 'https://example.com/signup', 'Menu'),
];

const menuPage = (styles = {}): TemplatePage =>
  experience([el('Navbar', { props: { brand: '{{brand}}', logo: '{{logo}}', links: '{{links}}', ctaText: '{{cta.label}}', ctaHref: '{{cta.link}}' }, styles })]);

const menuTemplates = [
  make('menu', 'product', 'Product navigation', 'Links for a software product, with a sign-up button.', ['saas'], THEME_INDIGO, menuVariables('Acme', 'Features | /features\nPricing | /pricing\nDocs | /docs', 'Sign up'), [menuPage()]),
  make('menu', 'business', 'Business navigation', 'Simple links for a small business site.', ['business'], THEME_EMERALD, menuVariables('Harbor & Co', 'Services | /services\nAbout | /about\nContact | /contact', 'Call us'), [menuPage()]),
  make('menu', 'dark', 'Dark navigation', 'A bold, dark menu bar.', ['dark'], THEME_MIDNIGHT, menuVariables('Northlight', 'Work | /work\nStudio | /studio\nJournal | /journal', 'Start a project'), [menuPage({ backgroundColor: 'var(--fp-surface)' })]),
];

// ---- FAQs -------------------------------------------------------------------

const faqPage = (intro: boolean): TemplatePage =>
  experience([
    heading('{{title}}', 'h2', { marginBottom: '12px' }),
    ...(intro ? [text('{{intro}}', { color: 'var(--fp-muted)', marginBottom: '12px' }, 'intro')] : []),
    el('Accordion', { repeat: { list: 'questions', as: 'item' }, props: { question: '{{item.question}}', answer: '{{item.answer}}' } }),
  ], { padding: '32px max(24px, calc((100% - 760px) / 2))' });

const questionFields: VariableDef[] = [
  { key: 'question', label: 'Question', type: 'text', required: true },
  { key: 'answer', label: 'Answer', type: 'longtext', required: true },
];

const faqTemplates = [
  make('faq', 'general', 'General questions', 'A straightforward list of common questions.', ['support'], THEME_INDIGO, [
    textVar('title', 'Title', 'Frequently asked questions', 'Text'),
    listVar('questions', 'Questions', [
      { question: 'How do I get started?', answer: 'Create an account and follow the steps on your dashboard.' },
      { question: 'Can I cancel any time?', answer: 'Yes. You can cancel from your account settings.' },
      { question: 'How can I contact support?', answer: 'Email us and we will reply within one working day.' },
    ], questionFields, 'Questions'),
  ], [faqPage(false)], { titleVariable: 'title' }),
  make('faq', 'pricing', 'Pricing questions', 'Handle the questions people ask before buying.', ['pricing', 'sales'], THEME_EMERALD, [
    textVar('title', 'Title', 'Questions about pricing', 'Text'),
    longVar('intro', 'Introduction', 'Everything you need to know before choosing a plan.', 'Text'),
    listVar('questions', 'Questions', [
      { question: 'Is there a free trial?', answer: 'Yes, every plan includes a 14-day free trial.' },
      { question: 'Can I change plans later?', answer: 'You can move up or down at any time.' },
      { question: 'Do you offer refunds?', answer: 'We refund any payment within 30 days.' },
    ], questionFields, 'Questions'),
  ], [faqPage(true)], { titleVariable: 'title' }),
  make('faq', 'shipping', 'Orders and shipping', 'Answers for online shops.', ['shop', 'shipping'], THEME_CORAL, [
    textVar('title', 'Title', 'Orders and shipping', 'Text'),
    listVar('questions', 'Questions', [
      { question: 'How long does delivery take?', answer: 'Most orders arrive within 3 to 5 working days.' },
      { question: 'Do you ship internationally?', answer: 'Yes, to most countries.' },
      { question: 'How do returns work?', answer: 'Send items back within 30 days for a full refund.' },
    ], questionFields, 'Questions'),
  ], [faqPage(false)], { titleVariable: 'title' }),
];

export const EXPERIENCE_TEMPLATES: TemplateDefinition[] = [
  ...pageTemplates, ...tourTemplates, ...formTemplates, ...demoTemplates, ...menuTemplates, ...faqTemplates,
];
