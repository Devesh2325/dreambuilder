import { photo, PhotoName } from './assets';
import { buildContent, button, el, El, heading, image, section, TemplateDefinition, text, ThemePreset } from './dsl';
import { listVar, longVar, make, textVar, urlVar } from './experiences';
import {
  closingBand, closingVars, faqBlock, faqVar, footerBlock, footerVars, marqueeSection, marqueeVar, quotesCarousel, quotesVar, SectionCopy, sectionHeading,
} from './pageSections';
import { THEME_CORAL, THEME_EMERALD, THEME_INDIGO, THEME_MIDNIGHT, THEME_MONO, THEME_OCEAN, THEME_TERRACOTTA } from './themes';

const muted = { color: 'var(--fp-muted)' };

interface IndustryPage extends SectionCopy {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  theme: ThemePreset;
  style: 'split' | 'center' | 'photo' | 'gradient';
  hero: { headline: string; sub: string; cta: string; image: PhotoName };
  features: { heading: string; items: { title: string; text: string }[] };
}

const heroFor = (style: IndustryPage['style']): El => {
  const copy = (color?: string): El[] => [
    heading('{{headline}}', 'h1', color ? { color } : undefined),
    text('{{subheadline}}', { fontSize: '1.1875rem', color: color ?? 'var(--fp-muted)' }),
    button('{{cta.label}}', '{{cta.link}}'),
  ];
  if (style === 'split') {
    return section([el('Grid', { styles: { alignItems: 'center', gap: '48px' } }, [
      el('Box', { styles: { gap: '20px', alignItems: 'flex-start' } }, copy()),
      image('{{hero.image}}', '{{headline}}', { height: '440px' }),
    ])]);
  }
  if (style === 'photo') {
    return section([el('Box', { styles: { gap: '20px', alignItems: 'flex-start', maxWidth: '640px' } }, copy('#ffffff'))], {
      background: 'linear-gradient(100deg, rgba(15,23,42,.85), rgba(15,23,42,.3)), url({{hero.image}}) center / cover',
      paddingTop: '144px',
      paddingBottom: '144px',
    });
  }
  if (style === 'gradient') {
    return section([
      el('Box', { styles: { alignItems: 'center', textAlign: 'center', gap: '20px', maxWidth: '780px', marginLeft: 'auto', marginRight: 'auto' } }, copy('#ffffff')),
      image('{{hero.image}}', '{{headline}}', { height: '380px', boxShadow: '0 30px 60px -20px rgba(15,23,42,.5)' }),
    ], { background: 'linear-gradient(135deg, var(--fp-secondary), var(--fp-primary))', paddingTop: '96px' });
  }
  return section([
    el('Box', { styles: { alignItems: 'center', textAlign: 'center', gap: '20px', maxWidth: '780px', marginLeft: 'auto', marginRight: 'auto' } }, copy()),
    image('{{hero.image}}', '{{headline}}', { height: '420px' }),
  ]);
};

/** A complete landing page: hero, strip, features, quotes, questions, closing and footer. */
const industryPage = (page: IndustryPage): TemplateDefinition => make('page', page.id, page.title, page.description, page.tags, page.theme, [
  textVar('headline', 'Headline', page.hero.headline, 'Main message'),
  longVar('subheadline', 'Supporting text', page.hero.sub, 'Main message'),
  textVar('cta.label', 'Button label', page.hero.cta, 'Main message'),
  urlVar('cta.link', 'Button link', 'https://example.com', 'Main message'),
  { key: 'hero.image', label: 'Main image', type: 'image', default: photo(page.hero.image, 1600, 1000), group: 'Main message' },
  marqueeVar(page.marquee),
  textVar('features.heading', 'Heading', page.features.heading, 'What you offer'),
  listVar('features', 'What you offer', page.features.items, [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'text', label: 'Text', type: 'longtext' },
  ], 'What you offer'),
  quotesVar(page.quotes),
  faqVar(page.faq),
  ...closingVars(page.closing),
  ...footerVars(page.footer),
], [{
  kind: 'page',
  title: 'Home',
  slug: '',
  seo: { title: '{{headline}}', description: '{{subheadline}}' },
  content: buildContent('p', [
    heroFor(page.style),
    marqueeSection(),
    section([
      sectionHeading('{{features.heading}}'),
      el('Grid', {}, [el('Card', { repeat: { list: 'features', as: 'feature' } }, [heading('{{feature.title}}', 'h3'), text('{{feature.text}}', muted, 'feature.text')])]),
    ]),
    quotesCarousel(),
    faqBlock(),
    closingBand(),
    footerBlock(),
  ]),
}], { category: page.category, titleVariable: 'headline' });

const q = (question: string, answer: string) => ({ question, answer });
const f = (title: string, value: string) => ({ title, text: value });
const who = (quote: string, name: string) => ({ quote, name });

export const INDUSTRY_PAGE_TEMPLATES: TemplateDefinition[] = ([
  {
    id: 'restaurant-opening', title: 'Restaurant opening', description: 'Announce a new restaurant, show the menu highlights and take bookings.', category: 'Hospitality and travel', tags: ['restaurant', 'cafe', 'food', 'opening'],
    theme: THEME_TERRACOTTA, style: 'photo',
    hero: { headline: 'A new table in town', sub: 'Seasonal plates, local wine and a warm welcome. Opening this month.', cta: 'Book your table', image: 'restaurant' },
    marquee: ['Seasonal menu', 'Local producers', 'Walk-ins welcome', 'Private dining', 'Open late on weekends'],
    features: { heading: 'Why you will love it', items: [f('Made from scratch', 'Fresh pasta and bread, every single morning.'), f('Good company', 'Space for two, or for your whole family.'), f('Great wine', 'A short list chosen by people who care.')] },
    quotes: [who('The best meal I have had all year.', 'Priya R.'), who('It feels like eating at a friend\'s house, only better.', 'Marco L.')],
    faq: [q('Do you take walk-ins?', 'Yes, whenever we have a table free. Booking is safest at weekends.'), q('Can you cater for allergies?', 'Of course. Tell us when you book.')],
    closing: { title: 'Save your seat for opening week', label: 'Book now' },
    footer: { brand: 'The Olive Table', text: '12 Market Street. Open Tuesday to Sunday.', email: 'hello@olivetable.example' },
  },
  {
    id: 'real-estate-listing', title: 'Property listing', description: 'One property, its best features and a viewing request.', category: 'Property and construction', tags: ['real estate', 'property', 'listing', 'realtor'],
    theme: THEME_MONO, style: 'split',
    hero: { headline: 'Bright family home near the park', sub: 'Four bedrooms, a sunny garden and a ten-minute walk to the station.', cta: 'Book a viewing', image: 'house' },
    marquee: ['4 bedrooms', '2 bathrooms', 'South-facing garden', 'Off-street parking', 'Near top schools'],
    features: { heading: 'A closer look', items: [f('Room to grow', 'Generous rooms over three floors.'), f('Move-in ready', 'Newly decorated, with a new kitchen and boiler.'), f('A great location', 'Shops, schools and trains all within walking distance.')] },
    quotes: [who('They found us the right home within a month.', 'The Ahmed family'), who('Honest advice from the first call to the last.', 'Daniel F.')],
    faq: [q('Can I view it this week?', 'Yes. Send a request and we will offer you a time.'), q('Is the price negotiable?', 'Talk to us about your offer.')],
    closing: { title: 'See it before it goes', label: 'Request a viewing' },
    footer: { brand: 'Keystone Homes', text: 'Helping families move since 2008.', email: 'viewings@keystone.example' },
  },
  {
    id: 'clinic-booking', title: 'Clinic appointments', description: 'Win new patients with clear services and easy booking.', category: 'Health and wellness', tags: ['clinic', 'doctor', 'dental', 'healthcare'],
    theme: THEME_OCEAN, style: 'split',
    hero: { headline: 'See a doctor today, without the wait', sub: 'Same-day appointments with friendly, experienced doctors.', cta: 'Book an appointment', image: 'clinic' },
    marquee: ['Same-day appointments', 'All ages welcome', 'Most insurers accepted', 'Evening hours', 'Free parking'],
    features: { heading: 'Care for the whole family', items: [f('General check-ups', 'Regular care that keeps small problems small.'), f('Children\'s health', 'Gentle care from doctors who love working with kids.'), f('Vaccinations', 'Travel and seasonal vaccines, without the queue.')] },
    quotes: [who('I was seen within the hour, and nobody rushed me.', 'Grace H.'), who('Our whole family comes here now.', 'Omar S.')],
    faq: [q('Do you accept new patients?', 'Yes, of all ages.'), q('Which insurance do you accept?', 'Most major insurers. Call us to confirm yours.')],
    closing: { title: 'Your health can\'t wait. Neither should you.', label: 'Book today' },
    footer: { brand: 'Riverside Clinic', text: 'Open Monday to Saturday, 8am to 8pm.', email: 'care@riverside.example' },
  },
  {
    id: 'gym-offer', title: 'Gym membership offer', description: 'A bold offer that turns visitors into new members.', category: 'Health and wellness', tags: ['gym', 'fitness', 'yoga', 'trainer'],
    theme: THEME_MIDNIGHT, style: 'photo',
    hero: { headline: 'Your first month is on us', sub: 'Unlimited classes, expert coaches and a community that keeps you going.', cta: 'Claim your free month', image: 'gym' },
    marquee: ['No joining fee', 'Over 40 classes a week', 'Cancel any time', 'Open 24 hours', 'Free personal plan'],
    features: { heading: 'Everything you need to get stronger', items: [f('Classes for every level', 'From your very first session to race day.'), f('Coaches who care', 'A plan built around you and your goals.'), f('Real community', 'People who notice when you don\'t show up.')] },
    quotes: [who('I have never stuck with a gym this long.', 'Sara T.'), who('The coaches changed how I think about training.', 'Ben O.')],
    faq: [q('Do I need to be fit already?', 'Not at all. Every class has options for beginners.'), q('Can I cancel?', 'Yes, at any time, with no fee.')],
    closing: { title: 'Start this week', label: 'Get my free month' },
    footer: { brand: 'Pulse Fitness', text: 'Open every day of the year.', email: 'join@pulse.example' },
  },
  {
    id: 'school-admissions', title: 'School admissions', description: 'Bring in applications with your results, courses and next open day.', category: 'Education', tags: ['school', 'college', 'admissions', 'course'],
    theme: THEME_EMERALD, style: 'center',
    hero: { headline: 'Applications are open for next year', sub: 'Small classes, inspiring teachers and results that open doors.', cta: 'Apply now', image: 'study' },
    marquee: ['Small class sizes', '96% pass rate', 'Scholarships available', 'Open day on 12 March', 'After-school clubs'],
    features: { heading: 'Why families choose us', items: [f('Teachers who know you', 'Classes small enough for everyone to be heard.'), f('A broad curriculum', 'Science, arts and sport, all taken seriously.'), f('Ready for what is next', 'Careers advice from the first year onwards.')] },
    quotes: [who('My daughter found her confidence here.', 'Helen M.'), who('They saw what I could do before I did.', 'Former student')],
    faq: [q('When is the deadline?', 'Applications close on 30 April.'), q('Are scholarships available?', 'Yes. Ask us about the criteria.')],
    closing: { title: 'Come and see us at our open day', label: 'Book your place' },
    footer: { brand: 'Brightpath Academy', text: 'Learning for life since 1985.', email: 'admissions@brightpath.example' },
  },
  {
    id: 'travel-package', title: 'Travel package', description: 'Sell one trip with its highlights, what is included and an enquiry.', category: 'Hospitality and travel', tags: ['travel', 'holiday', 'tour', 'hotel'],
    theme: THEME_OCEAN, style: 'photo',
    hero: { headline: 'Seven days on the coast', sub: 'Quiet beaches, great food and nothing to organize. It is all taken care of.', cta: 'See dates and prices', image: 'travel' },
    marquee: ['Flights included', 'Small groups', 'Local guides', 'Free cancellation', 'Breakfast every day'],
    features: { heading: 'What is included', items: [f('Handpicked stays', 'Small hotels with sea views and real character.'), f('Local guides', 'People who grew up here, and love showing it.'), f('Time to yourself', 'Free afternoons, with ideas if you want them.')] },
    quotes: [who('The most relaxing week we have had in years.', 'Nina and Paul'), who('Every detail was thought through.', 'Claire D.')],
    faq: [q('How big are the groups?', 'Never more than twelve people.'), q('What if I need to cancel?', 'Cancel free of charge up to 30 days before you leave.')],
    closing: { title: 'Places are limited', label: 'Reserve your place' },
    footer: { brand: 'Harbor Journeys', text: 'Small trips, done properly.', email: 'trips@harbor.example' },
  },
  {
    id: 'fintech-app', title: 'Banking app', description: 'Show what a finance app does, and why people can trust it.', category: 'Finance and insurance', tags: ['fintech', 'bank', 'finance', 'app'],
    theme: THEME_INDIGO, style: 'gradient',
    hero: { headline: 'Your money, finally clear', sub: 'See everything in one place, save automatically and spend with confidence.', cta: 'Open a free account', image: 'dashboard' },
    marquee: ['No monthly fees', 'Instant alerts', 'Free transfers', 'Spending insights', 'Bank-grade security'],
    features: { heading: 'Built for everyday life', items: [f('See it all', 'Every account and card, in one simple view.'), f('Save without thinking', 'Round up each purchase, and watch it add up.'), f('Stay in control', 'Freeze a card in one tap, wherever you are.')] },
    quotes: [who('I saved more in three months than in the last year.', 'Leo V.'), who('Finally, an app that doesn\'t make money confusing.', 'Mina C.')],
    faq: [q('Is my money safe?', 'Replace this with how your accounts are protected and regulated.'), q('Are there any fees?', 'Everyday accounts are free. Replace this with your own fees.')],
    closing: { title: 'Get started in five minutes', label: 'Open my account' },
    footer: { brand: 'Northwind Money', text: 'Add the legal details your regulator requires here.', email: 'help@northwind.example' },
  },
  {
    id: 'insurance-quote', title: 'Insurance quote', description: 'Explain your cover simply, and make asking for a quote easy.', category: 'Finance and insurance', tags: ['insurance', 'cover', 'quote', 'finance'],
    theme: THEME_MONO, style: 'split',
    hero: { headline: 'Cover that makes sense', sub: 'Plain-English policies, and real people when you need to claim.', cta: 'Get a free quote', image: 'meeting' },
    marquee: ['Quotes in two minutes', 'No hidden extras', 'Claims help 24 hours', 'Monthly or yearly', 'Cancel any time'],
    features: { heading: 'Simple cover for what matters', items: [f('Home', 'Your home and belongings, covered properly.'), f('Car', 'From the basics up to fully comprehensive.'), f('Life', 'Peace of mind for the people you love.')] },
    quotes: [who('My claim was settled in days, not months.', 'Ruth A.'), who('They actually explained what I was paying for.', 'Sam B.')],
    faq: [q('How long does a quote take?', 'About two minutes.'), q('Can I change my cover later?', 'Yes, at any time.')],
    closing: { title: 'See what you could save', label: 'Get my quote' },
    footer: { brand: 'Evergreen Cover', text: 'Add your licensing and legal details here.', email: 'quotes@evergreen.example' },
  },
  {
    id: 'wedding-event', title: 'Wedding or event', description: 'Share the day\'s details, and let your guests reply.', category: 'Events', tags: ['wedding', 'event', 'party', 'invitation'],
    theme: THEME_CORAL, style: 'photo',
    hero: { headline: 'Maya and Sam are getting married', sub: 'Join us on 14 June for a day of food, music and celebration.', cta: 'Reply to the invitation', image: 'event' },
    marquee: ['14 June', 'Ceremony at 2pm', 'Dinner and dancing', 'Children welcome', 'Please reply by 1 May'],
    features: { heading: 'The day', items: [f('The ceremony', 'Starts at 2pm in the garden. Please be seated by 1:45.'), f('Dinner', 'A long table, seasonal food and too many speeches.'), f('Dancing', 'Until midnight. Comfortable shoes are a good idea.')] },
    quotes: [who('We can\'t wait to celebrate with you.', 'Maya and Sam')],
    faq: [q('Where should we stay?', 'We have saved rooms nearby. Ask us for the details.'), q('What should we wear?', 'Summer smart. The ceremony is on grass.')],
    closing: { title: 'We hope you can make it', label: 'Reply now' },
    footer: { brand: 'Maya and Sam', text: 'With love, and thanks for being part of our day.', email: 'wedding@example.com' },
  },
  {
    id: 'beauty-offer', title: 'Salon or spa offer', description: 'Fill your calendar with a treatment offer and easy booking.', category: 'Health and wellness', tags: ['beauty', 'salon', 'spa', 'hair'],
    theme: THEME_CORAL, style: 'split',
    hero: { headline: 'Take an hour for yourself', sub: '20% off your first treatment, with stylists who really listen.', cta: 'Book my treatment', image: 'salon' },
    marquee: ['20% off first visit', 'Natural products', 'Evening appointments', 'Gift vouchers', 'Free consultation'],
    features: { heading: 'Treatments people love', items: [f('Hair', 'Cuts and color that suit you, and how you live.'), f('Skin', 'Facials that leave you glowing, without the hard sell.'), f('Massage', 'Sixty minutes of properly doing nothing.')] },
    quotes: [who('I walked out feeling like a new person.', 'Lena K.'), who('The only place I trust with my hair.', 'Aya N.')],
    faq: [q('How do I book?', 'Online, or just give us a call.'), q('Can I buy a gift voucher?', 'Yes, for any amount.')],
    closing: { title: 'You deserve this', label: 'Book now' },
    footer: { brand: 'Bloom Studio', text: 'Open Tuesday to Saturday.', email: 'hello@bloom.example' },
  },
] satisfies IndustryPage[]).map(industryPage);
