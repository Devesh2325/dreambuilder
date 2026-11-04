import { GLOBAL_FOOTER_SLUG, GLOBAL_HEADER_SLUG } from '../core/schema';
import { VariableDef } from '../core/variables';
import { photo, PhotoName } from './assets';
import { buildContent, button, el, El, heading, image, section, TemplateDefinition, TemplatePage, text, ThemePreset } from './dsl';
import { ALL_THEMES, THEME_CORAL, THEME_EMERALD, THEME_INDIGO, THEME_MIDNIGHT, THEME_MONO, THEME_OCEAN, THEME_TERRACOTTA } from './themes';

type Item = Record<string, string>;

interface IndustrySite {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  theme: ThemePreset;
  brand: [name: string, tagline: string];
  hero: { headline: string; sub: string; image: PhotoName; cta: string; style: 'split' | 'center' | 'overlay' };
  services: { heading: string; pageTitle: string; items: Item[] };
  stats?: Item[];
  testimonials: Item[];
  faq: Item[];
  about: { title: string; text: string; image: PhotoName };
  contact: { title: string; intro: string; button: string };
  hours?: string;
}

const list = (key: string, label: string, group: string, items: Item[], fields: VariableDef[]): VariableDef => ({
  key, label, type: 'list', group, minItems: 1, maxItems: 12, default: items, itemFields: fields,
});

const titleField: VariableDef = { key: 'title', label: 'Title', type: 'text', required: true };
const descriptionField: VariableDef = { key: 'description', label: 'Description', type: 'longtext' };

const sectionTitle = (title: string, subtitle?: string): El =>
  el('Box', { styles: { alignItems: 'center', textAlign: 'center', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' } }, [
    heading(title),
    ...(subtitle ? [text(subtitle, { color: 'var(--fp-muted)' })] : []),
  ]);

const heroFor = (style: IndustrySite['hero']['style']): El => {
  const copy = (color?: string): El[] => [
    heading('{{hero.headline}}', 'h1', color ? { color } : undefined),
    text('{{hero.subheadline}}', { fontSize: '1.1875rem', color: color ?? 'var(--fp-muted)' }, 'hero.subheadline'),
    button('{{hero.cta}}', '/contact'),
  ];
  if (style === 'overlay') {
    return section([
      el('Box', { styles: { gap: '20px', alignItems: 'flex-start', maxWidth: '640px' } }, copy('#ffffff')),
    ], {
      background: 'linear-gradient(100deg, rgba(15,23,42,.85), rgba(15,23,42,.35)), url({{hero.image}}) center / cover',
      paddingTop: '120px',
      paddingBottom: '120px',
    });
  }
  if (style === 'center') {
    return section([
      el('Box', { styles: { alignItems: 'center', textAlign: 'center', gap: '20px', maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto' } }, copy()),
      image('{{hero.image}}', '{{brand.name}}', { height: '440px' }, 'hero.image'),
    ]);
  }
  return section([
    el('Grid', { styles: { alignItems: 'center', gap: '48px' } }, [
      el('Box', { styles: { gap: '20px', alignItems: 'flex-start' } }, copy()),
      image('{{hero.image}}', '{{brand.name}}', { height: '440px' }, 'hero.image'),
    ]),
  ]);
};

const statsBand = (): El =>
  section([
    el('Grid', {}, [
      el('Box', { repeat: { list: 'stats', as: 'stat' }, styles: { textAlign: 'center' } }, [
        heading('{{stat.value}}', 'h2', { color: '#ffffff' }),
        text('{{stat.label}}', { color: 'rgba(255,255,255,.8)' }),
      ]),
    ]),
  ], { background: 'var(--fp-primary)', paddingTop: '48px', paddingBottom: '48px' }, { showIf: 'stats' });

const serviceCards = (): El =>
  el('Grid', {}, [el('Card', { repeat: { list: 'services', as: 'service' } }, [
    heading('{{service.title}}', 'h3'),
    text('{{service.description}}', { color: 'var(--fp-muted)' }, 'service.description'),
  ])]);

const quotes = (): El =>
  section([
    sectionTitle('What people say'),
    el('Grid', {}, [el('Card', { repeat: { list: 'testimonials', as: 'person' } }, [
      text('"{{person.quote}}"', { fontSize: '1.0625rem' }),
      text('{{person.name}}', { fontWeight: 700 }),
    ])]),
  ], { background: 'var(--fp-surface)' });

const faqSection = (): El =>
  section([
    sectionTitle('Common questions'),
    el('Box', { styles: { maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto', width: '100%', gap: '0' } }, [
      el('Accordion', { repeat: { list: 'faq', as: 'item' }, props: { question: '{{item.question}}', answer: '{{item.answer}}' } }),
    ]),
  ]);

const ctaBand = (): El =>
  section([
    el('Box', { styles: { alignItems: 'center', textAlign: 'center', gap: '18px' } }, [
      heading('{{cta.title}}', 'h2', { color: '#ffffff' }),
      el('Button', { props: { text: '{{hero.cta}}', href: '/contact', variant: 'primary', action: 'link' }, styles: { background: '#ffffff', color: '#0f172a' } }),
    ]),
  ], { background: 'linear-gradient(120deg, var(--fp-primary), var(--fp-secondary))' });

const header = (): TemplatePage => ({
  kind: 'global', title: 'Header', slug: GLOBAL_HEADER_SLUG,
  content: buildContent('h', [
    el('Navbar', { props: { brand: '{{brand.name}}', logo: '{{brand.logo}}', ctaText: '{{hero.cta}}', ctaHref: '/contact' }, styles: { backgroundColor: 'var(--fp-background)' } }),
    el('Divider'),
  ]),
});

const footer = (): TemplatePage => ({
  kind: 'global', title: 'Footer', slug: GLOBAL_FOOTER_SLUG,
  content: buildContent('f', [section([
    el('Grid', {}, [
      el('Box', {}, [heading('{{brand.name}}', 'h4'), text('{{brand.tagline}}', { color: 'var(--fp-muted)' })]),
      el('Box', {}, [
        text('{{contact.email}}', {}, 'contact.email'),
        text('{{contact.phone}}', {}, 'contact.phone'),
        text('{{contact.address}}', {}, 'contact.address'),
        text('{{contact.hours}}', {}, 'contact.hours'),
      ]),
    ]),
  ], { backgroundColor: 'var(--fp-surface)', paddingTop: '48px', paddingBottom: '48px' })]),
});

function industrySite(site: IndustrySite): TemplateDefinition {
  const variables: VariableDef[] = [
    { key: 'brand.name', label: 'Business name', type: 'text', group: 'Your business', required: true, default: site.brand[0] },
    { key: 'brand.tagline', label: 'Tagline', type: 'text', group: 'Your business', required: true, default: site.brand[1] },
    { key: 'brand.logo', label: 'Logo', type: 'image', group: 'Your business', help: 'Optional. The business name appears next to it.' },
    { key: 'hero.headline', label: 'Main headline', type: 'text', group: 'Home page', required: true, default: site.hero.headline },
    { key: 'hero.subheadline', label: 'Supporting text', type: 'longtext', group: 'Home page', default: site.hero.sub },
    { key: 'hero.image', label: 'Main image', type: 'image', group: 'Home page', default: photo(site.hero.image, 1600, 1000) },
    { key: 'hero.cta', label: 'Button label', type: 'text', group: 'Home page', required: true, default: site.hero.cta },
    { key: 'cta.title', label: 'Closing message', type: 'text', group: 'Home page', required: true, default: `Ready to get started with ${site.brand[0]}?` },
    list('services', site.services.pageTitle, site.services.pageTitle, site.services.items, [titleField, descriptionField]),
    list('stats', 'Key numbers', 'Key numbers', site.stats ?? [], [
      { key: 'value', label: 'Number', type: 'text', required: true },
      { key: 'label', label: 'What it counts', type: 'text', required: true },
    ]),
    list('testimonials', 'Testimonials', 'Testimonials', site.testimonials, [
      { key: 'quote', label: 'Quote', type: 'longtext', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
    ]),
    list('faq', 'Questions', 'FAQ', site.faq, [
      { key: 'question', label: 'Question', type: 'text', required: true },
      { key: 'answer', label: 'Answer', type: 'longtext', required: true },
    ]),
    { key: 'about.title', label: 'Title', type: 'text', group: 'About page', required: true, default: site.about.title },
    { key: 'about.text', label: 'Your story', type: 'longtext', group: 'About page', required: true, default: site.about.text },
    { key: 'about.image', label: 'Image', type: 'image', group: 'About page', default: photo(site.about.image) },
    { key: 'contact.email', label: 'Email', type: 'email', group: 'Contact details', required: true, default: `hello@${site.brand[0].toLowerCase().replace(/[^a-z]/g, '')}.example` },
    { key: 'contact.phone', label: 'Phone', type: 'text', group: 'Contact details', default: '+1 555 123 4567' },
    { key: 'contact.address', label: 'Address', type: 'text', group: 'Contact details', default: '123 Main Street, Springfield' },
    { key: 'contact.hours', label: 'Opening hours', type: 'text', group: 'Contact details', default: site.hours ?? '' },
  ];
  if (!site.stats) variables.find((def) => def.key === 'stats')!.minItems = 0;

  const pages: TemplatePage[] = [
    {
      kind: 'page', title: 'Home', slug: '',
      seo: { title: '{{brand.name}} | {{brand.tagline}}', description: '{{hero.subheadline}}' },
      content: buildContent('p', [
        heroFor(site.hero.style),
        statsBand(),
        section([sectionTitle(site.services.heading), serviceCards()]),
        quotes(),
        faqSection(),
        ctaBand(),
      ]),
    },
    {
      kind: 'page', title: site.services.pageTitle, slug: 'services',
      seo: { title: `${site.services.pageTitle} | {{brand.name}}`, description: site.services.heading },
      content: buildContent('s', [section([sectionTitle(site.services.pageTitle, site.services.heading), serviceCards()]), ctaBand()]),
    },
    {
      kind: 'page', title: 'About', slug: 'about',
      seo: { title: 'About | {{brand.name}}', description: '{{about.text}}' },
      content: buildContent('a', [section([el('Grid', { styles: { alignItems: 'center', gap: '48px' } }, [
        image('{{about.image}}', 'About {{brand.name}}', { height: '420px' }, 'about.image'),
        el('Box', { styles: { gap: '16px' } }, [heading('{{about.title}}', 'h1'), text('{{about.text}}', { color: 'var(--fp-muted)', fontSize: '1.0625rem' })]),
      ])])]),
    },
    {
      kind: 'page', title: 'Contact', slug: 'contact',
      seo: { title: 'Contact | {{brand.name}}', description: site.contact.intro },
      content: buildContent('c', [section([el('Grid', { styles: { gap: '48px' } }, [
        el('Box', { styles: { gap: '12px' } }, [
          heading(site.contact.title, 'h1'),
          text(site.contact.intro, { color: 'var(--fp-muted)' }),
          text('{{contact.email}}', {}, 'contact.email'),
          text('{{contact.phone}}', {}, 'contact.phone'),
          text('{{contact.address}}', {}, 'contact.address'),
          text('{{contact.hours}}', {}, 'contact.hours'),
        ]),
        el('Card', {}, [el('Form', { props: { submitText: site.contact.button, successMessage: "Thanks! We'll get back to you soon." } }, [
          el('FormField', { props: { name: 'name', label: 'Your name', required: true } }),
          el('FormField', { props: { name: 'email', label: 'Email', inputType: 'email', required: true } }),
          el('FormField', { props: { name: 'message', label: 'How can we help?', inputType: 'textarea', required: true } }),
        ])]),
      ])])]),
    },
    header(),
    footer(),
  ];

  return {
    id: `website-${site.id}`,
    type: 'website',
    version: 1,
    title: site.title,
    description: site.description,
    tags: site.tags,
    category: site.category,
    titleVariable: 'brand.name',
    variables,
    themes: [site.theme, ...ALL_THEMES.filter((other) => other !== site.theme)],
    pages,
  };
}

const q = (question: string, answer: string) => ({ question, answer });
const svc = (title: string, description: string) => ({ title, description });
const who = (quote: string, name: string) => ({ quote, name });
const num = (value: string, label: string) => ({ value, label });

const SITES: IndustrySite[] = [
  {
    id: 'clinic', title: 'Medical clinic', description: 'Services, doctors and appointment requests for a healthcare practice.', category: 'Health and wellness', tags: ['doctor', 'healthcare', 'clinic', 'dental'],
    theme: THEME_OCEAN, brand: ['Riverside Clinic', 'Caring for your family'],
    hero: { headline: 'Healthcare that puts you first', sub: 'Friendly doctors, short waiting times and same-day appointments.', image: 'clinic', cta: 'Book an appointment', style: 'split' },
    services: { heading: 'Care for every stage of life', pageTitle: 'Our services', items: [svc('General practice', 'Check-ups and everyday care.'), svc('Pediatrics', 'Gentle care for children.'), svc('Vaccinations', 'Keep your family protected.')] },
    stats: [num('25+', 'Years of care'), num('12', 'Specialists'), num('40k', 'Patients helped')],
    testimonials: [who('The whole team was kind and took time to listen.', 'Grace H.'), who('Booking was easy and I was seen the same day.', 'Omar S.')],
    faq: [q('Do you accept new patients?', 'Yes, we are welcoming new patients of all ages.'), q('Which insurance do you accept?', 'We work with most major insurers. Call us to confirm yours.')],
    about: { title: 'About our clinic', text: 'For over 25 years we have looked after families in our community with care and respect.', image: 'doctor' },
    contact: { title: 'Book an appointment', intro: 'Tell us what you need and we will find you a time.', button: 'Request appointment' }, hours: 'Mon to Fri, 8am to 6pm',
  },
  {
    id: 'real-estate', title: 'Real estate agency', description: 'Showcase properties and capture buyer enquiries.', category: 'Property and construction', tags: ['property', 'realtor', 'homes'],
    theme: THEME_TERRACOTTA, brand: ['Keystone Homes', 'Find where you belong'],
    hero: { headline: 'Find a home you will love', sub: 'Local experts helping you buy, sell and rent with confidence.', image: 'house', cta: 'Talk to an agent', style: 'overlay' },
    services: { heading: 'How we can help', pageTitle: 'Services', items: [svc('Buying', 'Find the right home at the right price.'), svc('Selling', 'Marketing that gets you more interest.'), svc('Renting', 'Quality homes and reliable tenants.')] },
    stats: [num('1,200', 'Homes sold'), num('98%', 'Happy clients'), num('18', 'Years local')],
    testimonials: [who('They found our dream home in two weeks.', 'The Martins'), who('Our house sold above the asking price.', 'Ruth P.')],
    faq: [q('How much do you charge?', 'Our fee is agreed up front, with no hidden costs.'), q('How long does selling take?', 'Most homes sell within eight weeks.')],
    about: { title: 'Your local property experts', text: 'We know every street in the area, and we treat every move as if it were our own.', image: 'interior' },
    contact: { title: 'Talk to an agent', intro: 'Tell us what you are looking for.', button: 'Send enquiry' },
  },
  {
    id: 'fitness', title: 'Gym or fitness studio', description: 'Classes, memberships and a strong call to join.', category: 'Health and wellness', tags: ['gym', 'yoga', 'personal trainer'],
    theme: THEME_MIDNIGHT, brand: ['Pulse Fitness', 'Stronger every day'],
    hero: { headline: 'Your strongest year starts here', sub: 'Expert coaches, great classes and a community that keeps you going.', image: 'gym', cta: 'Claim a free class', style: 'overlay' },
    services: { heading: 'Find your favorite way to train', pageTitle: 'Classes', items: [svc('Strength', 'Build muscle with expert coaching.'), svc('HIIT', 'Fast, intense and fun.'), svc('Yoga', 'Improve balance and recover well.')] },
    stats: [num('60+', 'Classes a week'), num('15', 'Coaches'), num('3k', 'Members')],
    testimonials: [who('I have never stuck with a gym this long.', 'Dana R.'), who('The coaches really care about your progress.', 'Luis M.')],
    faq: [q('Do I need experience?', 'Not at all. Every class has options for beginners.'), q('Can I cancel any time?', 'Yes, memberships are month to month.')],
    about: { title: 'More than a gym', text: 'We started Pulse to make fitness welcoming to everyone, at every level.', image: 'yoga' },
    contact: { title: 'Try a free class', intro: 'Tell us a little about your goals.', button: 'Claim my class' }, hours: 'Open daily, 6am to 10pm',
  },
  {
    id: 'salon', title: 'Beauty salon or spa', description: 'Treatments, prices and easy booking.', category: 'Health and wellness', tags: ['beauty', 'hair', 'spa', 'barber'],
    theme: THEME_CORAL, brand: ['Bloom Studio', 'Feel like yourself'],
    hero: { headline: 'Relax. You are in good hands.', sub: 'Hair, skin and nail treatments from people who love what they do.', image: 'salon', cta: 'Book a visit', style: 'split' },
    services: { heading: 'Treatments for you', pageTitle: 'Treatments', items: [svc('Cut and color', 'From a trim to a whole new look.'), svc('Facials', 'Refresh and restore your skin.'), svc('Manicures', 'Neat, long-lasting nails.')] },
    testimonials: [who('I always leave feeling amazing.', 'Priya K.'), who('The most relaxing hour of my month.', 'Sofia L.')],
    faq: [q('Do I need to book?', 'We recommend it, but walk-ins are welcome when we have space.'), q('Do you sell gift cards?', 'Yes, in any amount.')],
    about: { title: 'Our story', text: 'Bloom began with two chairs and a simple idea: everyone deserves time for themselves.', image: 'salon' },
    contact: { title: 'Book a visit', intro: 'Tell us the treatment and time you would like.', button: 'Request booking' }, hours: 'Tue to Sat, 9am to 7pm',
  },
  {
    id: 'law', title: 'Law firm', description: 'Practice areas and a confidential consultation form.', category: 'Professional services', tags: ['lawyer', 'legal', 'attorney'],
    theme: THEME_MONO, brand: ['Hart & Cole', 'Clear advice. Strong representation.'],
    hero: { headline: 'Legal advice you can trust', sub: 'Experienced lawyers who explain your options in plain language.', image: 'law', cta: 'Request a consultation', style: 'split' },
    services: { heading: 'Our practice areas', pageTitle: 'Practice areas', items: [svc('Family law', 'Sensitive support when it matters most.'), svc('Business law', 'Protect your company and contracts.'), svc('Property law', 'Buying, selling and disputes.')] },
    stats: [num('30', 'Years experience'), num('2,000', 'Cases handled'), num('8', 'Partners')],
    testimonials: [who('They made a stressful time much easier.', 'J. Patel'), who('Straightforward, honest advice.', 'M. Okafor')],
    faq: [q('Is the first meeting free?', 'Yes, your first 30 minutes are free.'), q('Is what I share confidential?', 'Always. Everything you tell us is protected.')],
    about: { title: 'About the firm', text: 'For three decades we have combined deep expertise with a personal approach.', image: 'office' },
    contact: { title: 'Request a consultation', intro: 'Everything you send us is confidential.', button: 'Send request' },
  },
  {
    id: 'education', title: 'School or online course', description: 'Courses, outcomes and enrollment.', category: 'Education', tags: ['school', 'course', 'tutor', 'academy'],
    theme: THEME_INDIGO, brand: ['Brightpath Academy', 'Learn at your own pace'],
    hero: { headline: 'Learn skills that open doors', sub: 'Practical courses taught by people working in the field.', image: 'study', cta: 'Enroll now', style: 'center' },
    services: { heading: 'Popular courses', pageTitle: 'Courses', items: [svc('Web development', 'From first page to full apps.'), svc('Data skills', 'Understand and use your data.'), svc('Digital marketing', 'Grow any business online.')] },
    stats: [num('50k', 'Students'), num('120', 'Courses'), num('4.8', 'Average rating')],
    testimonials: [who('This course got me my first tech job.', 'Aisha B.'), who('Clear lessons that fit around my work.', 'Tom W.')],
    faq: [q('Do I get a certificate?', 'Yes, every course includes one.'), q('Can I learn part time?', 'All courses are self-paced.')],
    about: { title: 'Why we teach', text: 'We believe great education should be practical, affordable and open to everyone.', image: 'books' },
    contact: { title: 'Ask about enrolling', intro: 'Tell us what you would like to learn.', button: 'Send question' },
  },
  {
    id: 'hotel', title: 'Hotel or travel', description: 'Rooms, experiences and booking requests.', category: 'Hospitality and travel', tags: ['hotel', 'resort', 'tourism'],
    theme: THEME_OCEAN, brand: ['Seaview Hotel', 'Your escape by the water'],
    hero: { headline: 'Wake up to the sound of the sea', sub: 'Comfortable rooms and warm hospitality, right on the beach.', image: 'hotel', cta: 'Check availability', style: 'overlay' },
    services: { heading: 'Stay your way', pageTitle: 'Rooms', items: [svc('Garden room', 'Quiet and comfortable.'), svc('Sea view room', 'Our most popular choice.'), svc('Family suite', 'Space for everyone.')] },
    stats: [num('48', 'Rooms'), num('9.2', 'Guest rating'), num('1', 'Private beach')],
    testimonials: [who('The best holiday we have had in years.', 'The Andersons'), who('The staff made us feel at home.', 'Mei T.')],
    faq: [q('What time is check-in?', 'From 3pm, with check-out by 11am.'), q('Is breakfast included?', 'Yes, with every room.')],
    about: { title: 'Our hotel', text: 'A family-run hotel welcoming guests to the coast for three generations.', image: 'travel' },
    contact: { title: 'Check availability', intro: 'Send your dates and number of guests.', button: 'Send request' },
  },
  {
    id: 'construction', title: 'Construction or trades', description: 'Show your work and collect quote requests.', category: 'Property and construction', tags: ['builder', 'contractor', 'renovation', 'cleaning'],
    theme: THEME_EMERALD, brand: ['Solid Ground Builders', 'Built right, the first time'],
    hero: { headline: 'Quality building you can rely on', sub: 'Homes, extensions and renovations, finished on time and on budget.', image: 'construction', cta: 'Get a free quote', style: 'overlay' },
    services: { heading: 'What we build', pageTitle: 'Services', items: [svc('New builds', 'From plans to handing over the keys.'), svc('Extensions', 'More room for your family.'), svc('Renovations', 'Bring new life to your property.')] },
    stats: [num('350', 'Projects completed'), num('20', 'Years in business'), num('100%', 'Licensed and insured')],
    testimonials: [who('On time, on budget and beautifully finished.', 'Helen G.'), who('They kept us informed from start to finish.', 'Marco D.')],
    faq: [q('Are quotes free?', 'Yes, with no obligation.'), q('Are you insured?', 'Fully licensed and insured for all work.')],
    about: { title: 'About us', text: 'A local team of skilled builders who take pride in doing things properly.', image: 'cleaning' },
    contact: { title: 'Get a free quote', intro: 'Tell us about your project.', button: 'Request quote' },
  },
  {
    id: 'auto', title: 'Car repair or dealer', description: 'Services, trust signals and bookings for automotive businesses.', category: 'Professional services', tags: ['garage', 'mechanic', 'car'],
    theme: THEME_MIDNIGHT, brand: ['Apex Auto', 'Honest repairs, fair prices'],
    hero: { headline: 'Keep your car running at its best', sub: 'Certified mechanics, clear prices and no surprises.', image: 'car', cta: 'Book a service', style: 'split' },
    services: { heading: 'How we keep you moving', pageTitle: 'Services', items: [svc('Servicing', 'Regular care for every make.'), svc('Repairs', 'Fixed fast, with parts guaranteed.'), svc('Inspections', 'Know your car is safe.')] },
    testimonials: [who('Finally, a garage I trust.', 'Nadia F.'), who('Fair price and quick work.', 'Ben C.')],
    faq: [q('Do you work on all makes?', 'Yes, all makes and models.'), q('Is the work guaranteed?', 'All repairs come with a 12-month guarantee.')],
    about: { title: 'About our garage', text: 'Family-owned since 1998, with a reputation built on honest work.', image: 'car' },
    contact: { title: 'Book a service', intro: 'Tell us your car and what it needs.', button: 'Request booking' }, hours: 'Mon to Sat, 8am to 6pm',
  },
  {
    id: 'nonprofit', title: 'Non-profit or charity', description: 'Share your mission and bring in supporters.', category: 'Community', tags: ['charity', 'ngo', 'donate', 'volunteer'],
    theme: THEME_EMERALD, brand: ['Open Hands', 'Together we do more'],
    hero: { headline: 'Help us change lives this year', sub: 'Every contribution brings food, education and hope to families in need.', image: 'charity', cta: 'Get involved', style: 'overlay' },
    services: { heading: 'How you can help', pageTitle: 'Our work', items: [svc('Donate', 'Your gift goes straight to those who need it.'), svc('Volunteer', 'Share your time and skills.'), svc('Partner', 'Work with us as an organization.')] },
    stats: [num('120k', 'Meals served'), num('3,500', 'Volunteers'), num('42', 'Communities')],
    testimonials: [who('Volunteering here changed how I see my city.', 'Claire N.'), who('They helped my family through our hardest year.', 'Joseph A.')],
    faq: [q('Where does my money go?', 'Over 90% goes directly to our programs.'), q('How do I volunteer?', 'Send us a message and we will find the right role.')],
    about: { title: 'Our mission', text: 'We believe every family deserves food, safety and the chance to thrive.', image: 'team' },
    contact: { title: 'Get involved', intro: 'Tell us how you would like to help.', button: 'Send message' },
  },
  {
    id: 'consulting', title: 'Consulting firm', description: 'Position your expertise and win new clients.', category: 'Professional services', tags: ['consultant', 'b2b', 'advisor', 'finance'],
    theme: THEME_INDIGO, brand: ['Meridian Advisors', 'Better decisions, faster'],
    hero: { headline: 'Grow with confidence', sub: 'Senior advisors helping leadership teams make their biggest decisions.', image: 'meeting', cta: 'Schedule a call', style: 'split' },
    services: { heading: 'How we help', pageTitle: 'Services', items: [svc('Strategy', 'Clear plans your team can act on.'), svc('Operations', 'Remove waste and move faster.'), svc('Finance', 'Understand and improve your numbers.')] },
    stats: [num('200+', 'Clients'), num('15', 'Countries'), num('$2B', 'Value created')],
    testimonials: [who('They told us what we needed to hear.', 'Sara V., CEO'), who('Measurable results within a quarter.', 'Dev R., COO')],
    faq: [q('What size companies do you work with?', 'Mostly companies with 50 to 500 people.'), q('How do projects start?', 'With a free call to understand your goals.')],
    about: { title: 'About Meridian', text: 'We are former operators who know what it takes to make change stick.', image: 'office' },
    contact: { title: 'Schedule a call', intro: 'Tell us what you are working on.', button: 'Request call' },
  },
];

// ---- Blog and documentation sites -------------------------------------------

const brandBasics = (name: string, tagline: string): VariableDef[] => [
  { key: 'brand.name', label: 'Name', type: 'text', group: 'Your site', required: true, default: name },
  { key: 'brand.tagline', label: 'Tagline', type: 'text', group: 'Your site', required: true, default: tagline },
  { key: 'brand.logo', label: 'Logo', type: 'image', group: 'Your site' },
];

const simpleHeader = (): TemplatePage => ({
  kind: 'global', title: 'Header', slug: GLOBAL_HEADER_SLUG,
  content: buildContent('h', [el('Navbar', { props: { brand: '{{brand.name}}', logo: '{{brand.logo}}', align: 'center' } }), el('Divider')]),
});

const simpleFooter = (): TemplatePage => ({
  kind: 'global', title: 'Footer', slug: GLOBAL_FOOTER_SLUG,
  content: buildContent('f', [section([el('Box', { styles: { alignItems: 'center', textAlign: 'center' } }, [heading('{{brand.name}}', 'h4'), text('{{brand.tagline}}', { color: 'var(--fp-muted)' })])], { backgroundColor: 'var(--fp-surface)', paddingTop: '40px', paddingBottom: '40px' })]),
});

const prose = { maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', width: '100%' };

const blog: TemplateDefinition = {
  id: 'website-blog', type: 'website', version: 1, title: 'Blog', description: 'A home page of articles, a featured article page and an about page.', tags: ['blog', 'articles', 'writer', 'magazine'], category: 'Blog and docs',
  titleVariable: 'brand.name', themes: [THEME_TERRACOTTA, ...ALL_THEMES.filter((other) => other !== THEME_TERRACOTTA)],
  variables: [
    ...brandBasics('The Field Notes', 'Ideas for people who make things'),
    list('posts', 'Articles', 'Articles', [
      { title: 'The case for doing less, better', excerpt: 'Why focus beats effort almost every time.', photo: photo('writing', 800, 500), date: 'March 14' },
      { title: 'What we learned shipping weekly', excerpt: 'Small releases changed how our team works.', photo: photo('laptop', 800, 500), date: 'March 2' },
      { title: 'Designing for real people', excerpt: 'Five questions to ask before you begin.', photo: photo('design', 800, 500), date: 'February 18' },
    ], [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'excerpt', label: 'Summary', type: 'longtext' },
      { key: 'photo', label: 'Image', type: 'image' },
      { key: 'date', label: 'Date', type: 'text' },
    ]),
    { key: 'featured.title', label: 'Title', type: 'text', group: 'Featured article', required: true, default: 'The case for doing less, better' },
    { key: 'featured.author', label: 'Author', type: 'text', group: 'Featured article', required: true, default: 'Maya Chen' },
    { key: 'featured.image', label: 'Image', type: 'image', group: 'Featured article', default: photo('writing') },
    { key: 'featured.body', label: 'Article text', type: 'longtext', group: 'Featured article', required: true, default: 'Most teams do not have a time problem. They have a focus problem.\n\nWhen everything is important, nothing gets finished. Choosing fewer things and doing them properly is the fastest way to get better results.' },
    { key: 'about.text', label: 'About text', type: 'longtext', group: 'About page', required: true, default: 'A small publication about building useful things, written by people who build them.' },
  ],
  pages: [
    { kind: 'page', title: 'Home', slug: '', seo: { title: '{{brand.name}}', description: '{{brand.tagline}}' }, content: buildContent('p', [
      section([el('Box', { styles: { alignItems: 'center', textAlign: 'center' } }, [heading('{{brand.name}}', 'h1'), text('{{brand.tagline}}', { fontSize: '1.25rem', color: 'var(--fp-muted)' })])], { paddingBottom: '32px' }),
      section([el('Grid', {}, [el('Card', { repeat: { list: 'posts', as: 'post' }, styles: { padding: '0', overflow: 'hidden', gap: '0' } }, [
        image('{{post.photo}}', '{{post.title}}', { height: '200px', borderRadius: '0' }, 'post.photo'),
        el('Box', { styles: { padding: '20px' } }, [
          text('{{post.date}}', { color: 'var(--fp-muted)', fontSize: '.8125rem' }, 'post.date'),
          heading('{{post.title}}', 'h3'),
          text('{{post.excerpt}}', { color: 'var(--fp-muted)' }, 'post.excerpt'),
          button('Read article', '/article', 'link'),
        ]),
      ])])], { paddingTop: '16px' }),
    ]) },
    { kind: 'page', title: 'Article', slug: 'article', seo: { title: '{{featured.title}} | {{brand.name}}', description: '{{featured.body}}' }, content: buildContent('r', [section([
      el('Box', { styles: { ...prose, gap: '12px' } }, [heading('{{featured.title}}', 'h1'), text('By {{featured.author}}', { fontWeight: 600 })]),
      image('{{featured.image}}', '{{featured.title}}', { ...prose, height: '400px' }, 'featured.image'),
      text('{{featured.body}}', { ...prose, fontSize: '1.125rem', lineHeight: 1.75 }),
    ])]) },
    { kind: 'page', title: 'About', slug: 'about', seo: { title: 'About | {{brand.name}}', description: '{{about.text}}' }, content: buildContent('a', [section([el('Box', { styles: { ...prose, gap: '12px' } }, [heading('About {{brand.name}}', 'h1'), text('{{about.text}}', { fontSize: '1.125rem' })])])]) },
    simpleHeader(),
    simpleFooter(),
  ],
};

const docSidebar = (): El => el('Box', { styles: { gap: '10px', paddingRight: '16px', alignItems: 'flex-start' } }, [
  heading('Documentation', 'h4'),
  button('Overview', '/', 'link'),
  button('Getting started', '/getting-started', 'link'),
  button('API reference', '/api', 'link'),
  button('FAQ', '/faq', 'link'),
]);

const docLayout = (children: El[]): El[] => [section([
  el('Grid', { styles: { gridTemplateColumns: '220px minmax(0, 1fr)', gap: '40px' }, responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } } }, [docSidebar(), el('Box', { styles: { gap: '16px' } }, children)]),
], { paddingTop: '40px' })];

const codeStyle = { fontFamily: 'monospace', background: '#0f172a', color: '#e2e8f0', padding: '14px 16px', borderRadius: '8px', fontSize: '.875rem' };

const docs: TemplateDefinition = {
  id: 'website-docs', type: 'website', version: 1, title: 'Documentation site', description: 'Product docs with a sidebar: overview, getting started, API and FAQ.', tags: ['docs', 'documentation', 'help center', 'developer', 'knowledge base'], category: 'Blog and docs',
  titleVariable: 'brand.name', themes: [THEME_MONO, ...ALL_THEMES.filter((other) => other !== THEME_MONO)],
  variables: [
    ...brandBasics('Acme Docs', 'Everything you need to build with Acme'),
    { key: 'overview.intro', label: 'Introduction', type: 'longtext', group: 'Overview page', required: true, default: 'Acme helps you add payments to your product in an afternoon. Start with the guide, then explore the API.' },
    list('topics', 'Topics', 'Overview page', [
      { title: 'Quick start', description: 'Up and running in five minutes.' },
      { title: 'Authentication', description: 'Keep your account secure.' },
      { title: 'Webhooks', description: 'React to events as they happen.' },
    ], [titleField, descriptionField]),
    list('steps', 'Steps', 'Getting started', [
      { title: 'Create an API key', body: 'Open your dashboard and create a new key.' },
      { title: 'Install the library', body: 'Add it with your package manager.' },
      { title: 'Make your first call', body: 'Send a test request to confirm it works.' },
    ], [{ key: 'title', label: 'Step', type: 'text', required: true }, { key: 'body', label: 'Explanation', type: 'longtext', required: true }]),
    { key: 'install.code', label: 'Install command', type: 'longtext', group: 'Getting started', default: 'npm install acme-sdk' },
    list('endpoints', 'Endpoints', 'API reference', [
      { path: 'GET /v1/customers', description: 'List your customers.' },
      { path: 'POST /v1/customers', description: 'Create a customer.' },
      { path: 'DELETE /v1/customers/:id', description: 'Remove a customer.' },
    ], [{ key: 'path', label: 'Endpoint', type: 'text', required: true }, { key: 'description', label: 'What it does', type: 'text', required: true }]),
    list('faq', 'Questions', 'FAQ', [
      { question: 'Is there a test mode?', answer: 'Yes. Test keys never touch real data.' },
      { question: 'What are the rate limits?', answer: '100 requests per second on all plans.' },
    ], [{ key: 'question', label: 'Question', type: 'text', required: true }, { key: 'answer', label: 'Answer', type: 'longtext', required: true }]),
  ],
  pages: [
    { kind: 'page', title: 'Overview', slug: '', seo: { title: '{{brand.name}}', description: '{{overview.intro}}' }, content: buildContent('p', docLayout([
      heading('{{brand.name}}', 'h1'), text('{{overview.intro}}', { fontSize: '1.125rem', color: 'var(--fp-muted)' }),
      el('Grid', {}, [el('Card', { repeat: { list: 'topics', as: 'topic' } }, [heading('{{topic.title}}', 'h3'), text('{{topic.description}}', { color: 'var(--fp-muted)' }, 'topic.description')])]),
    ])) },
    { kind: 'page', title: 'Getting started', slug: 'getting-started', seo: { title: 'Getting started | {{brand.name}}', description: '{{overview.intro}}' }, content: buildContent('g', docLayout([
      heading('Getting started', 'h1'),
      el('Box', { repeat: { list: 'steps', as: 'step' } }, [heading('{{step.index}}. {{step.title}}', 'h3'), text('{{step.body}}')]),
      text('{{install.code}}', codeStyle, 'install.code'),
    ])) },
    { kind: 'page', title: 'API reference', slug: 'api', seo: { title: 'API | {{brand.name}}', description: 'API reference' }, content: buildContent('i', docLayout([
      heading('API reference', 'h1'),
      el('Card', { repeat: { list: 'endpoints', as: 'endpoint' } }, [text('{{endpoint.path}}', { fontFamily: 'monospace', fontWeight: 700 }), text('{{endpoint.description}}', { color: 'var(--fp-muted)' })]),
    ])) },
    { kind: 'page', title: 'FAQ', slug: 'faq', seo: { title: 'FAQ | {{brand.name}}', description: 'Frequently asked questions' }, content: buildContent('q', docLayout([
      heading('Frequently asked questions', 'h1'),
      el('Accordion', { repeat: { list: 'faq', as: 'item' }, props: { question: '{{item.question}}', answer: '{{item.answer}}' } }),
    ])) },
    simpleHeader(),
    simpleFooter(),
  ],
};

export const INDUSTRY_TEMPLATES: TemplateDefinition[] = [...SITES.map(industrySite), blog, docs];
