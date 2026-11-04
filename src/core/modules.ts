import { ProjectType } from './schema';

/**
 * How a published project reaches visitors:
 * - site: hosted pages at /s/slug
 * - overlay: floats over the customer's page, controlled by trigger rules
 * - inline: placed inside the customer's page at a <div> they choose
 * Every type can also be opened at its hosted /s/slug link.
 */
export type DeliveryKind = 'site' | 'overlay' | 'inline';

export interface ModuleInfo {
  type: ProjectType;
  label: string;
  plural: string;
  description: string;
  /** Lucide icon name. */
  icon: string;
  delivery: DeliveryKind;
  /** Shown first in navigation. */
  primary: boolean;
}

const info = (
  type: ProjectType, label: string, plural: string, description: string, icon: string, delivery: DeliveryKind, primary = false,
): ModuleInfo => ({ type, label, plural, description, icon, delivery, primary });

export const MODULES: Record<ProjectType, ModuleInfo> = {
  website: info('website', 'Website', 'Websites', 'A complete multi-page website with shared navigation.', 'Globe', 'site', true),
  page: info('page', 'Page', 'Pages', 'A single landing page for a campaign or launch.', 'FileText', 'site', true),
  tour: info('tour', 'Product tour', 'Product tours', 'Guide users step by step around your own app.', 'Compass', 'overlay', true),
  form: info('form', 'Form', 'Forms', 'Collect leads and answers, on a page or in your site.', 'ClipboardList', 'inline', true),
  demo: info('demo', 'Interactive demo', 'Interactive demos', 'Clickable screens that show your product without a signup.', 'PlaySquare', 'inline'),
  banner: info('banner', 'Banner', 'Banners', 'Announcement bars at the top or bottom of your site.', 'Megaphone', 'overlay'),
  menu: info('menu', 'Menu', 'Menus', 'A navigation bar you can drop into any site.', 'Menu', 'inline'),
  faq: info('faq', 'FAQ', 'FAQs', 'Answer common questions with an accordion.', 'HelpCircle', 'inline'),
  popup: info('popup', 'Popup', 'Popups', 'Offers and messages shown at the right moment.', 'AppWindow', 'overlay'),
  checklist: info('checklist', 'Checklist', 'Checklists', 'Onboarding tasks that remember each visitor\'s progress.', 'CheckSquare', 'overlay'),
  survey: info('survey', 'Survey', 'Surveys', 'NPS and feedback questions inside your product.', 'Star', 'overlay'),
  pricing: info('pricing', 'Pricing table', 'Pricing tables', 'Plans and prices to place on any page.', 'DollarSign', 'inline'),
  testimonials: info('testimonials', 'Testimonials', 'Testimonials', 'Customer quotes that build trust.', 'MessageSquareQuote', 'inline'),
};

export const MODULE_LIST = Object.values(MODULES);
