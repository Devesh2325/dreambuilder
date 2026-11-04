import { GLOBAL_FOOTER_SLUG, GLOBAL_HEADER_SLUG } from '../core/schema';
import { VariableDef } from '../core/variables';
import { buildContent, button, el, El, heading, image, section, TemplateDefinition, TemplatePage, text, ThemePreset } from './dsl';
import { ALL_THEMES, THEME_CORAL, THEME_EMERALD, THEME_INDIGO, THEME_MIDNIGHT, THEME_MONO, THEME_TERRACOTTA } from './themes';

const pic = (seed: string, width = 1200, height = 800) => `https://picsum.photos/seed/${seed}/${width}/${height}`;

// ---- Shared variables -------------------------------------------------------

const brandVariables = (name: string, tagline: string): VariableDef[] => [
  { key: 'brand.name', label: 'Business name', type: 'text', group: 'Your business', required: true, default: name },
  { key: 'brand.tagline', label: 'Tagline', type: 'text', group: 'Your business', required: true, default: tagline },
  { key: 'brand.logo', label: 'Logo', type: 'image', group: 'Your business', help: 'Optional. The business name appears next to it.' },
];

const contactVariables: VariableDef[] = [
  { key: 'contact.email', label: 'Email', type: 'email', group: 'Contact details', required: true, default: 'hello@example.com' },
  { key: 'contact.phone', label: 'Phone', type: 'text', group: 'Contact details', default: '+1 555 123 4567' },
  { key: 'contact.address', label: 'Address', type: 'text', group: 'Contact details', default: '123 Main Street, Springfield' },
  { key: 'contact.hours', label: 'Opening hours', type: 'text', group: 'Contact details' },
];

// For templates that don't need to suggest a phone or address: the fields stay available but start empty.
const optionalContact: VariableDef[] = contactVariables.map((def) => (def.required ? def : { ...def, default: '' }));

const heroVariables = (headline: string, sub: string, seed: string, cta: string): VariableDef[] => [
  { key: 'hero.headline', label: 'Main headline', type: 'text', group: 'Home page', required: true, default: headline },
  { key: 'hero.subheadline', label: 'Supporting text', type: 'longtext', group: 'Home page', default: sub },
  { key: 'hero.image', label: 'Main image', type: 'image', group: 'Home page', default: pic(seed) },
  { key: 'hero.cta', label: 'Button label', type: 'text', group: 'Home page', required: true, default: cta },
];

const itemList = (
  key: string,
  label: string,
  group: string,
  items: Record<string, unknown>[],
  fields: VariableDef[],
): VariableDef => ({ key, label, type: 'list', group, minItems: 1, maxItems: 12, default: items, itemFields: fields });

// ---- Shared sections --------------------------------------------------------

const header = (): TemplatePage => ({
  kind: 'global',
  title: 'Header',
  slug: GLOBAL_HEADER_SLUG,
  content: buildContent('h', [
    el('Navbar', { props: { brand: '{{brand.name}}', logo: '{{brand.logo}}' }, styles: { backgroundColor: 'var(--fp-background)' } }),
    el('Divider'),
  ]),
});

const footer = (): TemplatePage => ({
  kind: 'global',
  title: 'Footer',
  slug: GLOBAL_FOOTER_SLUG,
  content: buildContent('f', [
    section(
      [
        el('Grid', {}, [
          el('Box', {}, [heading('{{brand.name}}', 'h4'), text('{{brand.tagline}}', { color: 'var(--fp-muted)' })]),
          el('Box', {}, [
            text('{{contact.email}}', {}, 'contact.email'),
            text('{{contact.phone}}', {}, 'contact.phone'),
            text('{{contact.address}}', {}, 'contact.address'),
            text('{{contact.hours}}', {}, 'contact.hours'),
          ]),
        ]),
      ],
      { backgroundColor: 'var(--fp-surface)', paddingTop: '48px', paddingBottom: '48px' },
    ),
  ]),
});

const splitHero = (ctaHref: string): El =>
  section(
    [
      el('Grid', { styles: { alignItems: 'center', gap: '48px' } }, [
        el('Box', { styles: { gap: '20px', alignItems: 'flex-start' } }, [
          heading('{{hero.headline}}', 'h1'),
          text('{{hero.subheadline}}', { fontSize: '1.125rem', color: 'var(--fp-muted)' }, 'hero.subheadline'),
          button('{{hero.cta}}', ctaHref),
        ]),
        image('{{hero.image}}', '{{brand.name}}', { height: '420px' }, 'hero.image'),
      ]),
    ],
  );

const centeredHero = (ctaHref: string): El =>
  section(
    [
      el('Box', { styles: { alignItems: 'center', textAlign: 'center', gap: '20px', maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto' } }, [
        heading('{{hero.headline}}', 'h1'),
        text('{{hero.subheadline}}', { fontSize: '1.25rem', color: 'var(--fp-muted)' }, 'hero.subheadline'),
        button('{{hero.cta}}', ctaHref),
      ]),
      image('{{hero.image}}', '{{brand.name}}', { height: '460px' }, 'hero.image'),
    ],
  );

const sectionTitle = (title: string, subtitle?: string): El =>
  el('Box', { styles: { textAlign: 'center', alignItems: 'center' } }, [
    heading(title),
    ...(subtitle ? [text(subtitle, { color: 'var(--fp-muted)' })] : []),
  ]);

const cardGrid = (listKey: string, as: string, children: El[]): El =>
  el('Grid', {}, [el('Card', { repeat: { list: listKey, as } }, children)]);

const ctaBanner = (title: string, label: string, href: string): El =>
  section(
    [
      el('Box', { styles: { alignItems: 'center', textAlign: 'center', gap: '20px' } }, [
        heading(title, 'h2', { color: '#ffffff' }),
        el('Button', { props: { text: label, href, variant: 'secondary', action: 'link' }, styles: { color: '#ffffff' } }),
      ]),
    ],
    { backgroundColor: 'var(--fp-primary)' },
  );

const contactForm = (buttonText: string): El =>
  el('Form', { props: { submitText: buttonText, successMessage: "Thanks! We'll get back to you soon." } }, [
    el('FormField', { props: { name: 'name', label: 'Your name', required: true } }),
    el('FormField', { props: { name: 'email', label: 'Email', inputType: 'email', required: true } }),
    el('FormField', { props: { name: 'message', label: 'How can we help?', inputType: 'textarea', required: true } }),
  ]);

const contactPage = (title: string, intro: string, buttonText = 'Send message'): TemplatePage => ({
  kind: 'page',
  title: 'Contact',
  slug: 'contact',
  seo: { title: `Contact | {{brand.name}}`, description: intro },
  content: buildContent('c', [
    section([
      el('Grid', { styles: { gap: '48px' } }, [
        el('Box', { styles: { gap: '16px' } }, [
          heading(title, 'h1'),
          text(intro, { color: 'var(--fp-muted)' }),
          text('{{contact.email}}', {}, 'contact.email'),
          text('{{contact.phone}}', {}, 'contact.phone'),
          text('{{contact.address}}', {}, 'contact.address'),
          text('{{contact.hours}}', {}, 'contact.hours'),
        ]),
        el('Card', {}, [contactForm(buttonText)]),
      ]),
    ]),
  ]),
});

const aboutPage = (): TemplatePage => ({
  kind: 'page',
  title: 'About',
  slug: 'about',
  seo: { title: 'About | {{brand.name}}', description: '{{about.text}}' },
  content: buildContent('a', [
    section([
      el('Grid', { styles: { alignItems: 'center', gap: '48px' } }, [
        image('{{about.image}}', 'About {{brand.name}}', { height: '420px' }, 'about.image'),
        el('Box', { styles: { gap: '16px' } }, [heading('{{about.title}}', 'h1'), text('{{about.text}}', { color: 'var(--fp-muted)' })]),
      ]),
    ]),
  ]),
});

const aboutVariables = (title: string, body: string, seed: string): VariableDef[] => [
  { key: 'about.title', label: 'Title', type: 'text', group: 'About page', required: true, default: title },
  { key: 'about.text', label: 'Your story', type: 'longtext', group: 'About page', required: true, default: body },
  { key: 'about.image', label: 'Image', type: 'image', group: 'About page', default: pic(seed) },
];

const home = (seoDescription: string, children: El[]): TemplatePage => ({
  kind: 'page',
  title: 'Home',
  slug: '',
  seo: { title: '{{brand.name}} | {{brand.tagline}}', description: seoDescription },
  content: buildContent('p', children),
});

const website = (
  template: Omit<TemplateDefinition, 'type' | 'version' | 'themes' | 'titleVariable' | 'pages'> & { pages: TemplatePage[]; theme: ThemePreset },
): TemplateDefinition => {
  const { theme, pages, ...rest } = template;
  return {
    ...rest,
    type: 'website',
    version: 1,
    titleVariable: 'brand.name',
    themes: [theme, ...ALL_THEMES.filter((other) => other !== theme)],
    pages: [...pages, header(), footer()],
  };
};

const titleField: VariableDef = { key: 'title', label: 'Name', type: 'text', required: true };
const descriptionField: VariableDef = { key: 'description', label: 'Description', type: 'longtext' };

// ---- Templates --------------------------------------------------------------

const business = website({
  id: 'website-business',
  title: 'Local business',
  description: 'Services, about and contact pages for any local business.',
  tags: ['business', 'services', 'local'],
  theme: THEME_INDIGO,
  variables: [
    ...brandVariables('Harbor Plumbing', 'Reliable service, fair prices'),
    ...heroVariables('Your trusted local experts', 'Fast, friendly service from people who live in your community.', 'business-hero', 'Get a free quote'),
    itemList('services', 'Your services', 'Services', [
      { title: 'Repairs', description: 'Quick fixes done right the first time.' },
      { title: 'Installation', description: 'New equipment installed with care.' },
      { title: 'Maintenance', description: 'Regular checks that prevent problems.' },
    ], [titleField, descriptionField]),
    ...aboutVariables('About us', 'We started as a small family team, and we still treat every customer like a neighbor.', 'business-about'),
    ...contactVariables,
  ],
  pages: [
    home('{{hero.subheadline}}', [
      splitHero('/contact'),
      section([sectionTitle('What we do'), cardGrid('services', 'service', [heading('{{service.title}}', 'h3'), text('{{service.description}}', { color: 'var(--fp-muted)' })])], { backgroundColor: 'var(--fp-surface)' }),
      ctaBanner('Ready to get started?', '{{hero.cta}}', '/contact'),
    ]),
    aboutPage(),
    contactPage('Talk to us', 'Tell us what you need and we will reply within one working day.'),
  ],
});

const restaurant = website({
  id: 'website-restaurant',
  title: 'Restaurant or cafe',
  description: 'Show your menu, your story and how to find you.',
  tags: ['restaurant', 'cafe', 'food'],
  theme: THEME_TERRACOTTA,
  variables: [
    ...brandVariables('The Olive Table', 'Seasonal food, made with care'),
    ...heroVariables('A table is waiting for you', 'Fresh ingredients, a warm welcome and a menu that changes with the seasons.', 'restaurant-hero', 'Book a table'),
    itemList('dishes', 'Menu items', 'Menu', [
      { name: 'Garden Salad', description: 'Leaves from local growers with lemon dressing.', price: '$12', photo: pic('dish1', 800, 600) },
      { name: 'Wood-fired Pizza', description: 'Slow-rise dough, tomato and basil.', price: '$18', photo: pic('dish2', 800, 600) },
      { name: 'Olive Oil Cake', description: 'Served warm with whipped cream.', price: '$9', photo: pic('dish3', 800, 600) },
    ], [
      { key: 'name', label: 'Dish', type: 'text', required: true },
      descriptionField,
      { key: 'price', label: 'Price', type: 'text' },
      { key: 'photo', label: 'Photo', type: 'image' },
    ]),
    ...aboutVariables('Our story', 'What began as one family kitchen is now a neighborhood meeting place.', 'restaurant-about'),
    ...contactVariables.map((def) => (def.key === 'contact.hours' ? { ...def, default: 'Tue to Sun, 12pm to 10pm' } : def)),
  ],
  pages: [
    home('{{hero.subheadline}}', [
      centeredHero('/contact'),
      section([
        sectionTitle('From our menu'),
        cardGrid('dishes', 'dish', [
          image('{{dish.photo}}', '{{dish.name}}', { height: '200px' }, 'dish.photo'),
          el('Row', { styles: { justifyContent: 'space-between' } }, [heading('{{dish.name}}', 'h3'), text('{{dish.price}}', { fontWeight: 700 }, 'dish.price')]),
          text('{{dish.description}}', { color: 'var(--fp-muted)' }),
        ]),
      ], { backgroundColor: 'var(--fp-surface)' }),
    ]),
    aboutPage(),
    contactPage('Reservations', 'Send your preferred date, time and number of guests.', 'Request a table'),
  ],
});

const portfolio = website({
  id: 'website-portfolio',
  title: 'Personal portfolio',
  description: 'A simple home for your work, your story and new enquiries.',
  tags: ['portfolio', 'freelancer', 'creative'],
  theme: THEME_MONO,
  variables: [
    ...brandVariables('Sam Rivera', 'Designer and illustrator'),
    ...heroVariables("Hi, I'm Sam. I make things people love to use.", 'Independent designer helping small teams look their best.', 'portfolio-hero', 'See my work'),
    itemList('projects', 'Your projects', 'Work', [
      { title: 'Brand refresh', description: 'A new identity for a growing startup.', photo: pic('work1', 900, 700), link: '' },
      { title: 'Mobile app', description: 'From first sketch to launch.', photo: pic('work2', 900, 700), link: '' },
      { title: 'Editorial series', description: 'Illustrations for a monthly magazine.', photo: pic('work3', 900, 700), link: '' },
    ], [titleField, descriptionField, { key: 'photo', label: 'Image', type: 'image' }, { key: 'link', label: 'Link', type: 'url' }]),
    ...aboutVariables('About me', 'I have spent ten years helping teams explain complicated ideas simply.', 'portfolio-about'),
    ...optionalContact,
  ],
  pages: [
    home('{{hero.subheadline}}', [
      centeredHero('#work'),
      section([
        sectionTitle('Selected work'),
        cardGrid('projects', 'project', [
          image('{{project.photo}}', '{{project.title}}', { height: '240px' }, 'project.photo'),
          heading('{{project.title}}', 'h3'),
          text('{{project.description}}', { color: 'var(--fp-muted)' }),
          button('View project', '{{project.link}}', 'link', 'project.link'),
        ]),
      ]),
    ]),
    aboutPage(),
    contactPage('Work with me', 'Tell me about your project.', 'Send enquiry'),
  ],
});

const agency = website({
  id: 'website-agency',
  title: 'Creative agency',
  description: 'Bold pages for your services, results and client quotes.',
  tags: ['agency', 'marketing', 'studio'],
  theme: THEME_MIDNIGHT,
  variables: [
    ...brandVariables('Northlight Studio', 'Brands that get noticed'),
    ...heroVariables('We help ambitious brands grow', 'Strategy, design and marketing from one senior team.', 'agency-hero', 'Start a project'),
    itemList('services', 'Services', 'Services', [
      { title: 'Brand strategy', description: 'Find your position and say it clearly.' },
      { title: 'Web design', description: 'Sites that look great and convert.' },
      { title: 'Campaigns', description: 'Creative work that reaches the right people.' },
    ], [titleField, descriptionField]),
    itemList('quotes', 'Client quotes', 'Clients', [
      { quote: 'They understood our business from day one.', author: 'Priya N., Founder' },
      { quote: 'Sales doubled within six months of launch.', author: 'Marcus L., CEO' },
    ], [
      { key: 'quote', label: 'Quote', type: 'longtext', required: true },
      { key: 'author', label: 'Name and role', type: 'text', required: true },
    ]),
    ...aboutVariables('Who we are', 'A small, senior team that cares about results more than awards.', 'agency-about'),
    ...optionalContact,
  ],
  pages: [
    home('{{hero.subheadline}}', [
      centeredHero('/contact'),
      section([sectionTitle('What we do'), cardGrid('services', 'service', [heading('{{service.title}}', 'h3'), text('{{service.description}}', { color: 'var(--fp-muted)' })])], { backgroundColor: 'var(--fp-surface)' }),
      section([sectionTitle('What clients say'), cardGrid('quotes', 'item', [text('"{{item.quote}}"', { fontSize: '1.125rem' }), text('{{item.author}}', { fontWeight: 600 })])]),
      ctaBanner('Have a project in mind?', '{{hero.cta}}', '/contact'),
    ]),
    aboutPage(),
    contactPage("Let's talk", 'Share your goals and we will suggest next steps.'),
  ],
});

const saas = website({
  id: 'website-saas',
  title: 'Software product',
  description: 'Features, pricing and a clear call to sign up.',
  tags: ['saas', 'software', 'startup'],
  theme: THEME_EMERALD,
  variables: [
    ...brandVariables('Taskline', 'Work that moves forward'),
    ...heroVariables('Finish projects, not meetings', 'Everything your team needs to plan, track and ship, in one simple tool.', 'saas-hero', 'Start free'),
    { key: 'signupUrl', label: 'Sign-up link', type: 'url', group: 'Home page', default: 'https://example.com/signup' },
    itemList('features', 'Features', 'Features', [
      { title: 'Shared boards', description: 'See who is doing what at a glance.' },
      { title: 'Automations', description: 'Let routine updates run themselves.' },
      { title: 'Reports', description: 'Know what is on track without asking.' },
    ], [titleField, descriptionField]),
    itemList('plans', 'Pricing plans', 'Pricing', [
      { name: 'Starter', price: '$0', details: 'For small teams getting started.' },
      { name: 'Team', price: '$12 / user', details: 'For growing teams who need more.' },
      { name: 'Business', price: '$29 / user', details: 'Advanced security and support.' },
    ], [
      { key: 'name', label: 'Plan', type: 'text', required: true },
      { key: 'price', label: 'Price', type: 'text', required: true },
      { key: 'details', label: 'Details', type: 'longtext' },
    ]),
    ...optionalContact,
  ],
  pages: [
    home('{{hero.subheadline}}', [
      splitHero('{{signupUrl}}'),
      section([sectionTitle('Why teams choose {{brand.name}}'), cardGrid('features', 'feature', [heading('{{feature.title}}', 'h3'), text('{{feature.description}}', { color: 'var(--fp-muted)' })])], { backgroundColor: 'var(--fp-surface)' }),
    ]),
    {
      kind: 'page',
      title: 'Pricing',
      slug: 'pricing',
      seo: { title: 'Pricing | {{brand.name}}', description: 'Simple pricing for teams of every size.' },
      content: buildContent('r', [
        section([
          sectionTitle('Simple pricing', 'Start free and upgrade when you are ready.'),
          cardGrid('plans', 'plan', [
            heading('{{plan.name}}', 'h3'),
            heading('{{plan.price}}', 'h2', { color: 'var(--fp-primary)' }),
            text('{{plan.details}}', { color: 'var(--fp-muted)' }),
            button('{{hero.cta}}', '{{signupUrl}}'),
          ]),
        ]),
      ]),
    },
    contactPage('Questions?', 'Our team is happy to help you choose.'),
  ],
});

const store = website({
  id: 'website-store',
  title: 'Small shop',
  description: 'Show your products and take enquiries by form.',
  tags: ['store', 'products', 'shop'],
  theme: THEME_CORAL,
  variables: [
    ...brandVariables('Fern & Clay', 'Handmade homeware'),
    ...heroVariables('Made by hand, made to last', 'Small-batch pieces for everyday living.', 'store-hero', 'Order now'),
    itemList('products', 'Products', 'Products', [
      { name: 'Stoneware mug', price: '$28', description: 'Glazed by hand in small batches.', photo: pic('product1', 800, 800) },
      { name: 'Linen throw', price: '$85', description: 'Soft, washed European linen.', photo: pic('product2', 800, 800) },
      { name: 'Oak tray', price: '$45', description: 'Solid oak, oiled and ready to use.', photo: pic('product3', 800, 800) },
    ], [
      { key: 'name', label: 'Product', type: 'text', required: true },
      { key: 'price', label: 'Price', type: 'text' },
      descriptionField,
      { key: 'photo', label: 'Photo', type: 'image' },
    ]),
    ...aboutVariables('Our workshop', 'Every piece is made in our small workshop by people who love their craft.', 'store-about'),
    ...optionalContact,
  ],
  pages: [
    home('{{hero.subheadline}}', [
      splitHero('/contact'),
      section([
        sectionTitle('Shop the collection'),
        cardGrid('products', 'product', [
          image('{{product.photo}}', '{{product.name}}', { height: '260px' }, 'product.photo'),
          el('Row', { styles: { justifyContent: 'space-between' } }, [heading('{{product.name}}', 'h3'), text('{{product.price}}', { fontWeight: 700 }, 'product.price')]),
          text('{{product.description}}', { color: 'var(--fp-muted)' }),
        ]),
      ], { backgroundColor: 'var(--fp-surface)' }),
    ]),
    aboutPage(),
    contactPage('Place an order', 'Tell us which items you would like and we will confirm availability.', 'Send order'),
  ],
});

export const WEBSITE_TEMPLATES: TemplateDefinition[] = [business, restaurant, portfolio, agency, saas, store];
