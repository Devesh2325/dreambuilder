import { DEFAULT_TRIGGERS } from '../core/schema';
import { VariableDef } from '../core/variables';
import { photo } from './assets';
import { actionButton, buildContent, button, el, El, experience, heading, image, section, TemplateDefinition, TemplatePage, text } from './dsl';
import { field, formPage, listVar, longVar, make, textVar, urlVar } from './experiences';
import { THEME_CORAL, THEME_EMERALD, THEME_INDIGO, THEME_MIDNIGHT, THEME_MONO, THEME_OCEAN, THEME_TERRACOTTA } from './themes';

const muted = { color: 'var(--fp-muted)' };
const center = { alignItems: 'center', textAlign: 'center' };
const narrow = { maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto', width: '100%' };

const page = (children: El[], title = '{{headline}}', description = '{{subheadline}}'): TemplatePage => ({
  kind: 'page',
  title: 'Home',
  slug: '',
  seo: { title, description },
  content: buildContent('p', children),
});

const hero = (headline: string, subheadline: string, label: string, link = 'https://example.com'): VariableDef[] => [
  textVar('headline', 'Headline', headline, 'Main message'),
  longVar('subheadline', 'Supporting text', subheadline, 'Main message'),
  textVar('cta.label', 'Button label', label, 'Main message'),
  urlVar('cta.link', 'Button link', link, 'Main message'),
];

const titleText: VariableDef[] = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'text', label: 'Text', type: 'longtext' },
];

const titled = (title: string, sub?: string): El =>
  el('Box', { styles: { ...center, ...narrow } }, [heading(title), ...(sub ? [text(sub, muted)] : [])]);

const cards = (list: string, as: string): El =>
  el('Grid', {}, [el('Card', { repeat: { list, as } }, [heading(`{{${as}.title}}`, 'h3'), text(`{{${as}.text}}`, muted, `${as}.text`)])]);

const whiteButton = (color: string) => el('Button', { props: { text: '{{cta.label}}', href: '{{cta.link}}', variant: 'primary', action: 'link' }, styles: { background: '#ffffff', color } });

const pricing = make('page', 'pricing', 'Pricing page', 'Compare plans side by side, with answers to common questions.', ['pricing', 'plans', 'saas'], THEME_INDIGO, [
  textVar('headline', 'Headline', 'Simple pricing that grows with you', 'Main message'),
  longVar('subheadline', 'Supporting text', 'Start free. Upgrade when you need more. Cancel any time.', 'Main message'),
  listVar('plans', 'Plans', [
    { name: 'Starter', price: '$0', text: 'For trying things out.', link: 'https://example.com/starter' },
    { name: 'Growth', price: '$29 / month', text: 'For small teams getting serious.', link: 'https://example.com/growth' },
    { name: 'Scale', price: '$99 / month', text: 'For busy teams with more to manage.', link: 'https://example.com/scale' },
  ], [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'price', label: 'Price', type: 'text', required: true },
    { key: 'text', label: 'Description', type: 'longtext' },
    { key: 'link', label: 'Button link', type: 'url' },
  ], 'Plans'),
  listVar('questions', 'Questions', [
    { question: 'Can I change plans later?', answer: 'Yes. You can move up or down at any time.' },
    { question: 'Do you offer refunds?', answer: 'Yes, within 30 days of paying.' },
  ], [
    { key: 'question', label: 'Question', type: 'text', required: true },
    { key: 'answer', label: 'Answer', type: 'longtext', required: true },
  ], 'Questions'),
], [page([
  section([
    el('Box', { styles: { ...center, ...narrow, gap: '14px' } }, [heading('{{headline}}', 'h1'), text('{{subheadline}}', { ...muted, fontSize: '1.125rem' })]),
    el('Grid', {}, [el('Card', { repeat: { list: 'plans', as: 'plan' }, styles: { gap: '14px', border: '1px solid color-mix(in srgb, var(--fp-text) 12%, transparent)' } }, [
      heading('{{plan.name}}', 'h3'),
      heading('{{plan.price}}', 'h2', { color: 'var(--fp-primary)' }),
      text('{{plan.text}}', muted, 'plan.text'),
      button('Choose {{plan.name}}', '{{plan.link}}'),
    ])]),
  ]),
  section([
    titled('Common questions'),
    el('Box', { styles: { ...narrow, gap: '0' } }, [el('Accordion', { repeat: { list: 'questions', as: 'item' }, props: { question: '{{item.question}}', answer: '{{item.answer}}' } })]),
  ], { background: 'var(--fp-surface)' }),
])], { category: 'Sales', titleVariable: 'headline' });

const gradientStartup = make('page', 'gradient-startup', 'Bold gradient launch', 'A striking full-color hero, key numbers and a closing call to action.', ['startup', 'launch', 'gradient'], THEME_MIDNIGHT, [
  ...hero('The fastest way to get your idea in front of people', 'Launch this week, learn from real customers, and grow from there.', 'Get early access'),
  listVar('stats', 'Key numbers', [
    { value: '12k', label: 'People on board' },
    { value: '4 min', label: 'Average setup' },
    { value: '98%', label: 'Would recommend us' },
  ], [
    { key: 'value', label: 'Number', type: 'text', required: true },
    { key: 'label', label: 'What it measures', type: 'text', required: true },
  ], 'Key numbers'),
  listVar('features', 'Features', [
    { title: 'Start in minutes', text: 'No setup calls, and nothing to install.' },
    { title: 'Built to share', text: 'Invite your team and work together from day one.' },
    { title: 'See what works', text: 'Clear numbers, so you know what to do next.' },
  ], titleText, 'Features'),
], [page([
  section([
    el('Box', { styles: { ...center, ...narrow, gap: '22px' } }, [
      heading('{{headline}}', 'h1', { color: '#ffffff' }),
      text('{{subheadline}}', { color: 'rgba(255,255,255,.85)', fontSize: '1.1875rem' }),
      whiteButton('#312e81'),
    ]),
  ], { background: 'linear-gradient(135deg, #0f172a, #4338ca 60%, #7c3aed)', paddingTop: '128px', paddingBottom: '128px' }),
  section([el('Grid', {}, [el('Box', { repeat: { list: 'stats', as: 'stat' }, styles: { textAlign: 'center', gap: '4px' } }, [heading('{{stat.value}}', 'h2', { color: 'var(--fp-primary)' }), text('{{stat.label}}', muted)])])], { paddingTop: '48px', paddingBottom: '48px' }),
  section([titled('Everything you need to begin'), cards('features', 'feature')], { background: 'var(--fp-surface)' }),
  section([el('Box', { styles: { ...center, gap: '18px' } }, [heading('Ready when you are'), button('{{cta.label}}', '{{cta.link}}')])]),
])], { category: 'Landing pages', titleVariable: 'headline' });

const photoStory = make('page', 'photo-story', 'Photo-led story', 'A large photo up front, then alternating pictures and words.', ['brand', 'story', 'photo'], THEME_TERRACOTTA, [
  ...hero('Made with care, one piece at a time', 'A small studio with a simple idea: fewer things, made better.', 'See the collection'),
  { key: 'hero.image', label: 'Main photo', type: 'image', default: photo('ceramics', 1600, 1000), group: 'Main message' },
  textVar('one.title', 'Heading', 'Where it starts', 'First part'),
  longVar('one.text', 'Text', 'Every piece begins with materials we choose ourselves, from people we know by name.', 'First part'),
  { key: 'one.image', label: 'Photo', type: 'image', default: photo('design'), group: 'First part' },
  textVar('two.title', 'Heading', 'How it is made', 'Second part'),
  longVar('two.text', 'Text', 'We work in small batches, so each one gets the time it deserves.', 'Second part'),
  { key: 'two.image', label: 'Photo', type: 'image', default: photo('mug'), group: 'Second part' },
], [page([
  section([
    el('Box', { styles: { gap: '20px', alignItems: 'flex-start', maxWidth: '640px' } }, [
      heading('{{headline}}', 'h1', { color: '#ffffff' }),
      text('{{subheadline}}', { color: 'rgba(255,255,255,.9)', fontSize: '1.125rem' }),
      button('{{cta.label}}', '{{cta.link}}'),
    ]),
  ], { background: 'linear-gradient(100deg, rgba(15,23,42,.8), rgba(15,23,42,.25)), url({{hero.image}}) center / cover', paddingTop: '160px', paddingBottom: '160px' }),
  section([el('Grid', { styles: { alignItems: 'center', gap: '48px' } }, [
    image('{{one.image}}', '{{one.title}}', { height: '400px' }),
    el('Box', { styles: { gap: '14px' } }, [heading('{{one.title}}'), text('{{one.text}}', { ...muted, fontSize: '1.0625rem' })]),
  ])]),
  section([el('Grid', { styles: { alignItems: 'center', gap: '48px' } }, [
    el('Box', { styles: { gap: '14px' } }, [heading('{{two.title}}'), text('{{two.text}}', { ...muted, fontSize: '1.0625rem' })]),
    image('{{two.image}}', '{{two.title}}', { height: '400px' }),
  ])], { background: 'var(--fp-surface)' }),
])], { category: 'Landing pages', titleVariable: 'headline' });

const showcase = make('page', 'project-showcase', 'Project showcase', 'A clean gallery of your best work, with a way to get in touch.', ['portfolio', 'gallery', 'creative'], THEME_MONO, [
  ...hero('Selected work', 'A few recent projects we are proud of.', 'Start a project'),
  listVar('projects', 'Projects', [
    { title: 'Brand refresh', text: 'A new look for a growing company.', image: photo('design', 900, 700) },
    { title: 'Studio photography', text: 'Product shots for an online shop.', image: photo('camera', 900, 700) },
    { title: 'Office redesign', text: 'A workspace people want to come back to.', image: photo('office', 900, 700) },
    { title: 'Product launch', text: 'Everything needed for launch day.', image: photo('laptop', 900, 700) },
  ], [...titleText, { key: 'image', label: 'Image', type: 'image' }], 'Projects'),
], [page([
  section([el('Box', { styles: { gap: '12px', maxWidth: '640px' } }, [heading('{{headline}}', 'h1'), text('{{subheadline}}', { ...muted, fontSize: '1.125rem' })])], { paddingBottom: '24px' }),
  section([el('Grid', { styles: { gap: '32px' } }, [el('Box', { repeat: { list: 'projects', as: 'project' }, styles: { gap: '10px' } }, [
    image('{{project.image}}', '{{project.title}}', { height: '300px' }),
    heading('{{project.title}}', 'h3'),
    text('{{project.text}}', muted, 'project.text'),
  ])])], { paddingTop: '24px' }),
  section([el('Box', { styles: { ...center, gap: '16px' } }, [heading('Have something in mind?'), button('{{cta.label}}', '{{cta.link}}')])], { background: 'var(--fp-surface)' }),
])], { category: 'Landing pages', titleVariable: 'headline' });

const course = make('page', 'online-course', 'Online course', 'Sell a course or workshop: what people learn, who teaches it, and the price.', ['course', 'education', 'workshop'], THEME_EMERALD, [
  ...hero('Learn to design your first product in six weeks', 'A practical course with weekly projects and real feedback.', 'Enroll now'),
  { key: 'hero.image', label: 'Image', type: 'image', default: photo('study'), group: 'Main message' },
  textVar('price', 'Price', '$249', 'Main message'),
  listVar('lessons', 'What you learn', [
    { title: 'Week 1: Finding the problem', text: 'Talk to people and find out what they need.' },
    { title: 'Week 2: Sketching ideas', text: 'Explore many directions quickly.' },
    { title: 'Week 3: Building a prototype', text: 'Make something people can really try.' },
  ], titleText, 'What you learn'),
  textVar('teacher.name', 'Name', 'Priya Nair', 'Your teacher'),
  longVar('teacher.bio', 'About them', 'Ten years designing products, and hundreds of students taught.', 'Your teacher'),
  { key: 'teacher.photo', label: 'Photo', type: 'image', default: photo('meeting', 500, 500), group: 'Your teacher' },
], [page([
  section([el('Grid', { styles: { alignItems: 'center', gap: '48px' } }, [
    el('Box', { styles: { gap: '18px', alignItems: 'flex-start' } }, [
      heading('{{headline}}', 'h1'),
      text('{{subheadline}}', { ...muted, fontSize: '1.125rem' }),
      el('Row', {}, [button('{{cta.label}}', '{{cta.link}}'), text('{{price}}', { fontWeight: 700, fontSize: '1.25rem' })]),
    ]),
    image('{{hero.image}}', '{{headline}}', { height: '400px' }),
  ])]),
  section([titled('What you learn'), el('Box', { styles: { ...narrow, gap: '12px' } }, [el('Card', { repeat: { list: 'lessons', as: 'lesson' }, styles: { background: 'var(--fp-background)' } }, [heading('{{lesson.title}}', 'h4'), text('{{lesson.text}}', muted, 'lesson.text')])])], { background: 'var(--fp-surface)' }),
  section([el('Row', { styles: { ...narrow, flexWrap: 'nowrap', gap: '24px' }, responsive: { mobile: { flexWrap: 'wrap' } } }, [
    image('{{teacher.photo}}', '{{teacher.name}}', { width: '160px', height: '160px', flexShrink: 0, borderRadius: '50%' }),
    el('Box', { styles: { gap: '8px' } }, [heading('Your teacher, {{teacher.name}}', 'h3'), text('{{teacher.bio}}', muted)]),
  ])]),
])], { category: 'Sales', titleVariable: 'headline' });

const fundraiser = make('page', 'fundraiser', 'Fundraiser', 'Tell people why it matters, show the impact, and ask for support.', ['charity', 'donation', 'nonprofit'], THEME_OCEAN, [
  ...hero('Help every child get a good start at school', 'Your gift buys books, meals and safe places to learn.', 'Donate now'),
  { key: 'hero.image', label: 'Main photo', type: 'image', default: photo('charity', 1600, 1000), group: 'Main message' },
  listVar('impact', 'Your impact', [
    { value: '$25', label: 'A month of school meals' },
    { value: '$60', label: 'Books for a whole class' },
    { value: '$150', label: 'A year of tutoring' },
  ], [
    { key: 'value', label: 'Amount', type: 'text', required: true },
    { key: 'label', label: 'What it pays for', type: 'text', required: true },
  ], 'Your impact'),
  longVar('story', 'Your story', 'We started with one classroom. Today, thanks to people like you, we support schools in twelve towns.', 'Your story'),
], [page([
  section([el('Box', { styles: { ...center, ...narrow, gap: '20px' } }, [
    heading('{{headline}}', 'h1', { color: '#ffffff' }),
    text('{{subheadline}}', { color: 'rgba(255,255,255,.92)', fontSize: '1.1875rem' }),
    whiteButton('#0c4a6e'),
  ])], { background: 'linear-gradient(rgba(12,74,110,.72), rgba(12,74,110,.72)), url({{hero.image}}) center / cover', paddingTop: '136px', paddingBottom: '136px' }),
  section([titled('What your gift does'), el('Grid', {}, [el('Card', { repeat: { list: 'impact', as: 'item' }, styles: { ...center } }, [heading('{{item.value}}', 'h2', { color: 'var(--fp-primary)' }), text('{{item.label}}', muted)])])]),
  section([el('Box', { styles: { ...center, ...narrow, gap: '18px' } }, [text('{{story}}', { fontSize: '1.25rem' }), button('{{cta.label}}', '{{cta.link}}')])], { background: 'var(--fp-surface)' }),
])], { category: 'Landing pages', titleVariable: 'headline' });

const specialOffer = make('page', 'special-offer', 'Special offer', 'One offer, one code and one button, for a sale or a campaign.', ['sale', 'promotion', 'coupon'], THEME_CORAL, [
  ...hero('20% off everything this weekend', 'Our biggest sale of the season ends on Sunday at midnight.', 'Shop the sale'),
  textVar('code', 'Discount code', 'WEEKEND20', 'The offer'),
  longVar('terms', 'Small print', 'Valid until Sunday. Cannot be combined with other offers.', 'The offer'),
  { key: 'hero.image', label: 'Image', type: 'image', default: photo('shop'), group: 'The offer' },
], [page([
  section([el('Grid', { styles: { alignItems: 'center', gap: '48px' } }, [
    el('Box', { styles: { gap: '18px', alignItems: 'flex-start' } }, [
      heading('{{headline}}', 'h1'),
      text('{{subheadline}}', { ...muted, fontSize: '1.125rem' }),
      el('Box', { styles: { padding: '12px 22px', border: '2px dashed var(--fp-primary)', borderRadius: 'var(--fp-radius)', alignItems: 'center', gap: '2px' } }, [
        text('Use code', { ...muted, fontSize: '.8125rem' }),
        text('{{code}}', { fontWeight: 800, fontSize: '1.375rem', letterSpacing: '2px', color: 'var(--fp-primary)' }),
      ]),
      button('{{cta.label}}', '{{cta.link}}'),
      text('{{terms}}', { ...muted, fontSize: '.8125rem' }, 'terms'),
    ]),
    image('{{hero.image}}', '{{headline}}', { height: '460px' }),
  ])]),
])], { category: 'Sales', titleVariable: 'headline' });

const aboutTeam = make('page', 'about-team', 'About us and team', 'Introduce your company, what you believe, and the people behind it.', ['about', 'team', 'company'], THEME_INDIGO, [
  textVar('headline', 'Headline', 'We make work feel a little lighter', 'Your story'),
  longVar('subheadline', 'Supporting text', 'A small, friendly team building tools that people look forward to using.', 'Your story'),
  { key: 'hero.image', label: 'Team photo', type: 'image', default: photo('team', 1600, 800), group: 'Your story' },
  listVar('values', 'What you believe', [
    { title: 'Keep it simple', text: 'If it needs a manual, we are not finished.' },
    { title: 'Be straightforward', text: 'We say what we mean, to customers and each other.' },
    { title: 'Look after people', text: 'Good work comes from people who are doing well.' },
  ], titleText, 'What you believe'),
  listVar('people', 'Team', [
    { name: 'Sam Rivera', role: 'Founder', photo: photo('meeting', 400, 400) },
    { name: 'Maya Chen', role: 'Design', photo: photo('design', 400, 400) },
    { name: 'Luis Ortega', role: 'Support', photo: photo('office', 400, 400) },
  ], [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'role', label: 'Role', type: 'text' },
    { key: 'photo', label: 'Photo', type: 'image' },
  ], 'Team'),
], [page([
  section([el('Box', { styles: { ...center, ...narrow, gap: '14px' } }, [heading('{{headline}}', 'h1'), text('{{subheadline}}', { ...muted, fontSize: '1.125rem' })]), image('{{hero.image}}', '{{headline}}', { height: '420px' })]),
  section([titled('What we believe'), cards('values', 'value')], { background: 'var(--fp-surface)' }),
  section([titled('Meet the team'), el('Grid', {}, [el('Box', { repeat: { list: 'people', as: 'person' }, styles: { ...center, gap: '6px' } }, [
    image('{{person.photo}}', '{{person.name}}', { width: '160px', height: '160px', borderRadius: '50%' }),
    heading('{{person.name}}', 'h4'),
    text('{{person.role}}', muted, 'person.role'),
  ])])]),
], '{{headline}}')], { category: 'Company', titleVariable: 'headline' });

const comparison = make('page', 'comparison', 'Why choose us', 'Compare yourself with the usual alternative, point by point.', ['comparison', 'sales', 'switch'], THEME_MIDNIGHT, [
  ...hero('Why teams switch to us', 'See how we compare with what you are using today.', 'Try it free'),
  textVar('us', 'Your name', 'Us', 'The comparison'),
  textVar('them', 'The alternative', 'Spreadsheets', 'The comparison'),
  listVar('points', 'Points', [
    { topic: 'Getting started', ours: 'Ready in minutes', theirs: 'Days of setting up' },
    { topic: 'Working together', ours: 'Everyone sees the latest', theirs: 'Copies sent by email' },
    { topic: 'Getting answers', ours: 'Built-in reports', theirs: 'Formulas that break' },
  ], [
    { key: 'topic', label: 'Topic', type: 'text', required: true },
    { key: 'ours', label: 'With you', type: 'text', required: true },
    { key: 'theirs', label: 'With the alternative', type: 'text', required: true },
  ], 'The comparison'),
], [page([
  section([el('Box', { styles: { ...center, ...narrow, gap: '14px' } }, [heading('{{headline}}', 'h1'), text('{{subheadline}}', { ...muted, fontSize: '1.125rem' })])], { paddingBottom: '32px' }),
  section([
    el('Box', { styles: { ...narrow, maxWidth: '920px', gap: '12px' } }, [
      el('Grid', { styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', padding: '0 24px' } }, [text(''), text('{{us}}', { fontWeight: 800, color: 'var(--fp-primary)' }), text('{{them}}', { fontWeight: 800, ...muted })]),
      el('Card', { repeat: { list: 'points', as: 'point' }, styles: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', alignItems: 'center' } }, [
        text('{{point.topic}}', { fontWeight: 700 }),
        text('✓ {{point.ours}}'),
        text('{{point.theirs}}', muted),
      ]),
    ]),
  ], { paddingTop: '16px' }),
  section([el('Box', { styles: { ...center, gap: '16px' } }, [heading('See the difference yourself'), button('{{cta.label}}', '{{cta.link}}')])], { background: 'var(--fp-surface)' }),
])], { category: 'Sales', titleVariable: 'headline' });

const jobOpening = make('page', 'job-opening', 'Job opening', 'Describe a role and take applications on the same page.', ['jobs', 'hiring', 'careers'], THEME_EMERALD, [
  textVar('headline', 'Job title', 'Senior product designer', 'The job'),
  textVar('location', 'Location', 'Remote', 'The job'),
  textVar('type', 'Type', 'Full time', 'The job'),
  longVar('subheadline', 'About the role', 'Join a small team and shape how thousands of people work every day.', 'The job'),
  listVar('duties', 'What you will do', [
    { title: 'Design from idea to launch' },
    { title: 'Talk to customers every week' },
    { title: 'Help the whole team grow' },
  ], [{ key: 'title', label: 'Point', type: 'text', required: true }], 'The job'),
], [page([
  section([el('Box', { styles: { ...narrow, gap: '12px' } }, [
    text('{{location}}  ·  {{type}}', { fontWeight: 600, color: 'var(--fp-primary)' }),
    heading('{{headline}}', 'h1'),
    text('{{subheadline}}', { ...muted, fontSize: '1.125rem' }),
  ])], { paddingBottom: '24px' }),
  section([el('Box', { styles: { ...narrow, gap: '8px' } }, [heading('What you will do', 'h3'), el('Text', { repeat: { list: 'duties', as: 'duty' }, props: { text: '✓ {{duty.title}}' } })])], { paddingTop: '16px', paddingBottom: '32px' }),
  section([el('Card', { styles: { ...narrow } }, [heading('Apply now', 'h3'), el('Form', { props: { submitText: 'Send application', successMessage: 'Thanks! We read every application and will reply soon.' } }, [
    field('name', 'Name'),
    field('email', 'Email', 'email'),
    field('link', 'Portfolio or LinkedIn', 'url', false),
    field('why', 'Why this job?', 'textarea'),
  ])])], { background: 'var(--fp-surface)' }),
])], { category: 'Company', titleVariable: 'headline' });

const pageLayouts = [pricing, gradientStartup, photoStory, showcase, course, fundraiser, specialOffer, aboutTeam, comparison, jobOpening];

const formLayouts = [
  make('form', 'newsletter', 'Newsletter sign-up', 'One field, for growing your mailing list.', ['newsletter', 'email', 'marketing'], THEME_MIDNIGHT, [
    textVar('form.title', 'Title', 'Get our newsletter', 'Form text'),
    longVar('form.intro', 'Introduction', 'One useful email a month. Leave any time.', 'Form text'),
    textVar('form.thanks', 'Thank-you message', 'Thanks for subscribing!', 'Form text'),
  ], [formPage('Subscribe', '{{form.thanks}}', [
    heading('{{form.title}}', 'h2'),
    text('{{form.intro}}', muted, 'form.intro'),
    field('email', 'Email', 'email'),
  ])], { titleVariable: 'form.title' }),

  make('form', 'quote', 'Quote request', 'A multi-step form that gathers what you need to price a job.', ['quote', 'services', 'multi-step'], THEME_TERRACOTTA, [
    textVar('form.title', 'Title', 'Get a free quote', 'Form text'),
    textVar('form.thanks', 'Thank-you message', 'Thanks! We will send your quote within two working days.', 'Form text'),
    longVar('form.services', 'Services offered', 'Design\nBuild\nRepair\nSomething else', 'Questions'),
  ], [formPage('Request my quote', '{{form.thanks}}', [
    heading('{{form.title}}', 'h2'),
    el('FormStep', { props: { title: 'What do you need?' } }, [
      el('FormField', { props: { name: 'service', label: 'Service', inputType: 'select', required: true, optionsText: '{{form.services}}' } }),
      field('details', 'Tell us about the job', 'textarea'),
    ]),
    el('FormStep', { props: { title: 'When?' } }, [field('date', 'Preferred date', 'date', false), field('budget', 'Budget', 'text', false)]),
    el('FormStep', { props: { title: 'How do we reach you?' } }, [field('name', 'Name'), field('email', 'Email', 'email'), field('phone', 'Phone', 'tel', false)]),
  ])], { titleVariable: 'form.title' }),

  make('form', 'support', 'Support request', 'Sort problems by type and urgency before they reach your team.', ['support', 'help', 'ticket'], THEME_OCEAN, [
    textVar('form.title', 'Title', 'How can we help?', 'Form text'),
    longVar('form.topics', 'Topics', 'Account\nBilling\nA problem with the product\nSomething else', 'Questions'),
    textVar('form.thanks', 'Thank-you message', 'Got it. We usually reply within one working day.', 'Form text'),
  ], [formPage('Send request', '{{form.thanks}}', [
    heading('{{form.title}}', 'h2'),
    field('email', 'Email', 'email'),
    el('FormField', { props: { name: 'topic', label: 'Topic', inputType: 'select', required: true, optionsText: '{{form.topics}}' } }),
    el('FormField', { props: { name: 'urgency', label: 'How urgent is it?', inputType: 'radio', required: true, optionsText: 'Not urgent\nSoon, please\nI am stuck' } }),
    field('message', 'What happened?', 'textarea'),
  ])], { titleVariable: 'form.title' }),
];

const TOUR_SETTINGS = { triggers: DEFAULT_TRIGGERS, tour: { showProgress: true, showClose: true } };

const nextButton = (label: string) => actionButton(label, 'next');

const tourLayouts = [
  make('tour', 'video-welcome', 'Video welcome', 'Open with a short video, then point out where to begin.', ['video', 'onboarding', 'youtube'], THEME_INDIGO, [
    textVar('product', 'Product name', 'Acme', 'Your product'),
    urlVar('video.url', 'Video link', 'https://www.youtube.com/watch?v=jNQXAC9IVRw', 'Your product'),
    longVar('intro', 'Text under the video', 'A two-minute look at how everything fits together.', 'Your product'),
    { key: 'start.selector', label: 'Where to begin', type: 'text', required: true, default: 'button', group: 'Elements on your site', help: 'Which part of your site this step points at. Select the step and use Pick on my site, and this is filled in for you.' },
  ], [experience([
    el('TourStep', { props: { layout: 'modal', size: 'xlarge', fallback: 'center', spotlight: true } }, [
      heading('Welcome to {{product}}', 'h3'),
      el('Video', { props: { url: '{{video.url}}', title: 'Welcome to {{product}}' } }),
      text('{{intro}}', muted, 'intro'),
      el('Row', { styles: { justifyContent: 'flex-end', gap: '8px' } }, [actionButton('Skip', 'close', 'link'), nextButton('Continue')]),
    ]),
    el('TourStep', { props: { selector: '{{start.selector}}', placement: 'bottom', fallback: 'center', spotlight: true } }, [
      heading('Start here', 'h4'),
      text('This is where most people begin.', muted),
      el('Row', { styles: { justifyContent: 'flex-end' } }, [nextButton('Finish')]),
    ]),
  ])], { settings: TOUR_SETTINGS }),

  make('tour', 'announcement', 'Announcement slide-out', 'A quiet note in the corner that doesn\u2019t interrupt anyone.', ['announcement', 'news', 'slide-out'], THEME_EMERALD, [
    textVar('title', 'Title', 'New this month', 'The news'),
    longVar('body', 'Message', 'Reports now update live, so you always see the latest numbers.', 'The news'),
    { key: 'image', label: 'Image', type: 'image', default: photo('dashboard', 800, 450), group: 'The news' },
    textVar('cta.label', 'Button label', 'Got it', 'The news'),
  ], [experience([
    el('TourStep', { props: { layout: 'slideout', size: 'medium', spotlight: false, fallback: 'center' } }, [
      image('{{image}}', '{{title}}', { height: '170px' }, 'image'),
      heading('{{title}}', 'h4'),
      text('{{body}}', muted),
      el('Row', { styles: { justifyContent: 'flex-end' } }, [nextButton('{{cta.label}}')]),
    ]),
  ])], { settings: { triggers: DEFAULT_TRIGGERS, tour: { showClose: true } } }),

  make('tour', 'long-guide', 'Step-by-step guide', 'A side panel with room for longer instructions, which people can follow while using your app.', ['guide', 'help', 'long'], THEME_OCEAN, [
    textVar('title', 'Title', 'Set up your first report', 'The guide'),
    textVar('duration', 'How long it takes', 'About 5 minutes', 'The guide'),
    listVar('parts', 'Parts of the guide', [
      { title: 'Choose your data', text: 'Open Reports and pick where the numbers come from. If you are not sure, start with last month. You can change this at any time, and nothing you do here affects your original data.' },
      { title: 'Pick a chart', text: 'Bar charts suit comparing things, and line charts suit changes over time. Choose whichever makes your point most clearly, then give it a short title that says what it shows.' },
      { title: 'Share it', text: 'Click Share and add your team. They will always see the latest numbers, so there is nothing to send again next month.' },
    ], titleText, 'Parts of the guide'),
  ], [experience([
    el('TourStep', { props: { layout: 'sidebar', size: 'large', spotlight: false, allowInteraction: true, fallback: 'center' } }, [
      heading('{{title}}', 'h3'),
      text('{{duration}}', { ...muted, fontWeight: 600 }),
      el('Box', { repeat: { list: 'parts', as: 'part' }, styles: { gap: '6px', paddingTop: '10px' } }, [heading('{{part.index}}. {{part.title}}', 'h4'), text('{{part.text}}', muted, 'part.text')]),
      el('Row', { styles: { justifyContent: 'flex-end', paddingTop: '10px' } }, [nextButton('Done')]),
    ]),
  ])], { settings: { triggers: DEFAULT_TRIGGERS, tour: { showClose: true } } }),
];

export const LAYOUT_TEMPLATES: TemplateDefinition[] = [...pageLayouts, ...formLayouts, ...tourLayouts];
