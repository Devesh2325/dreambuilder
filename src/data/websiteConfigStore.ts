import { useEffect, useState } from 'react';

export interface SocialLinks {
  twitter: string;
  linkedin: string;
  github: string;
  youtube: string;
  discord: string;
  instagram: string;
}

export interface FooterLink {
  label: string;
  url: string;
  external?: boolean;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar?: string;
}

export interface BlogItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  url: string;
  image?: string;
}

export interface WebsiteConfig {
  company: {
    name: string;
    tagline: string;
    description: string;
    email: string;
    phone: string;
    address: string;
    badgeText?: string;
  };
  social: SocialLinks;
  footer: {
    copyrightText: string;
    statusText: string;
    statusTone: 'success' | 'warning' | 'info';
    columns: FooterColumn[];
    legalLinks: FooterLink[];
  };
  faqs: FAQItem[];
  testimonials: TestimonialItem[];
  blogs: BlogItem[];
}

export const DEFAULT_WEBSITE_CONFIG: WebsiteConfig = {
  company: {
    name: 'FlowPilot',
    tagline: 'The modern visual builder for high-converting customer experiences.',
    description:
      'Build publication-ready websites, interactive product tours, forms, and demos without code. Embed anywhere in seconds with zero layout shift and total CSS isolation.',
    email: 'support@flowpilot.dev',
    phone: '+1 (555) 234-5678',
    address: '100 Montgomery St, Suite 1200, San Francisco, CA 94104',
    badgeText: '🚀 v2.4 Live · Powered by Google Gemini AI',
  },
  social: {
    twitter: 'https://twitter.com/flowpilot',
    linkedin: 'https://linkedin.com/company/flowpilot',
    github: 'https://github.com/flowpilot',
    youtube: 'https://youtube.com/@flowpilot',
    discord: 'https://discord.gg/flowpilot',
    instagram: 'https://instagram.com/flowpilot.app',
  },
  footer: {
    copyrightText: '© 2026 FlowPilot Inc. All rights reserved.',
    statusText: 'All Systems Operational',
    statusTone: 'success',
    columns: [
      {
        title: 'Product',
        links: [
          { label: 'Interactive Tours', url: '/tour' },
          { label: 'Landing Pages & Sites', url: '/website' },
          { label: 'Interactive Demos', url: '/demo' },
          { label: 'Forms & Surveys', url: '/form' },
          { label: 'Template Library', url: '/templates' },
          { label: 'AI Engine Assistant', url: '/templates?tab=ai' },
        ],
      },
      {
        title: 'Resources',
        links: [
          { label: 'Documentation', url: '/docs' },
          { label: 'Installation Guide', url: '/docs/install' },
          { label: 'JavaScript API Reference', url: '/docs/api' },
          { label: 'DOM & CSS Isolation', url: '/docs/tour' },
          { label: 'Pricing & Plans', url: '/plans' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About FlowPilot', url: '/#features' },
          { label: 'Customer Stories', url: '/#testimonials' },
          { label: 'Help & Support Desk', url: '/support' },
          { label: 'Super Admin Portal', url: '/superadmin' },
        ],
      },
    ],
    legalLinks: [
      { label: 'Privacy Policy', url: '/privacy' },
      { label: 'Terms of Service', url: '/terms' },
      { label: 'Security & Compliance', url: '/security' },
      { label: 'Cookie Preferences', url: '#' },
    ],
  },
  faqs: [
    {
      id: 'faq-1',
      question: 'Do I need coding experience to use FlowPilot?',
      answer:
        'None at all. You can pick an industry template, edit on the visual canvas, or generate complete experiences with our Gemini AI engine. For developers, a JavaScript SDK is also available.',
      category: 'General',
    },
    {
      id: 'faq-2',
      question: 'Will integrating the script break my website CSS or layout?',
      answer:
        'Guaranteed zero breakage. FlowPilot renders within a native browser Shadow DOM with :where(.fp-root) zero-specificity CSS variables. Host styles cannot break FlowPilot, and FlowPilot will never override your site styles.',
      category: 'Technical',
    },
    {
      id: 'faq-3',
      question: 'Are Product Tours and Demos compatible with Dark and Light Mode?',
      answer:
        'Yes! Both tours and interactive demos natively adapt to dark and light modes. Tooltips, highlights, and backdrop scrims maintain crisp contrast on any background.',
      category: 'Design',
    },
    {
      id: 'faq-4',
      question: 'Can I connect a custom domain with SSL?',
      answer:
        'Yes. You can publish websites and landing pages to custom apex domains and subdomains (e.g. app.yourcompany.com) with automatic free SSL certificate provisioning.',
      category: 'Domains',
    },
    {
      id: 'faq-5',
      question: 'Can my whole team collaborate on projects?',
      answer:
        'Yes. Invite team members with role-based permissions (Admin, Editor, Viewer), share custom design sections, and manage global brand variables in one central workspace.',
      category: 'Teams',
    },
  ],
  testimonials: [
    {
      id: 'test-1',
      name: 'Sarah Jenkins',
      role: 'VP of Product',
      company: 'StackWave',
      content:
        'FlowPilot increased our user activation rate by 42% within two weeks of launching our interactive guided tour. The visual builder is a joy to use.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&auto=format&fit=crop',
    },
    {
      id: 'test-2',
      name: 'Rajesh Mehta',
      role: 'Founder & CTO',
      company: 'FinPulse Systems',
      content:
        'The dark theme spotlight highlights and SEBI research templates let us launch our financial advisory terminal in days rather than months. Outstanding product.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&auto=format&fit=crop',
    },
    {
      id: 'test-3',
      name: 'Elena Rostova',
      role: 'Lead UX Architect',
      company: 'CloudForge',
      content:
        'Total DOM and CSS isolation was the deciding factor for our enterprise security team. The embed script is tiny (under 37 KB) and never interferes with host CSS.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&auto=format&fit=crop',
    },
  ],
  blogs: [
    {
      id: 'blog-1',
      title: '5 Psychological Principles of High-Converting Landing Pages',
      excerpt: 'How strategic visual hierarchy, friction reduction, and social proof directly double user signup rates.',
      category: 'UX & Design',
      readTime: '5 min read',
      date: 'Nov 17, 2026',
      url: '/docs/page',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=360&auto=format&fit=crop',
    },
    {
      id: 'blog-2',
      title: 'Zero-Lag Script Embedding: How We Kept FlowPilot Under 40 KB',
      excerpt: 'A deep dive into tree-shaking, lightweight reactive signals, and direct DOM hydration techniques.',
      category: 'Engineering',
      readTime: '7 min read',
      date: 'Nov 15, 2026',
      url: '/docs/install',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=360&auto=format&fit=crop',
    },
    {
      id: 'blog-3',
      title: 'The Playbook: Reducing User Drop-Off in Guided Walkthroughs',
      excerpt: 'Proven methods to keep visitors focused and eliminate cognitive overload during initial onboarding.',
      category: 'Product Growth',
      readTime: '4 min read',
      date: 'Nov 12, 2026',
      url: '/docs/tour',
      image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&h=360&auto=format&fit=crop',
    },
  ],
};

const WEBSITE_CONFIG_KEY = 'fp_admin_website_config';
const WEBSITE_CONFIG_EVENT = 'fp_website_config_updated';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getWebsiteConfig(): WebsiteConfig {
  if (!isBrowser()) return DEFAULT_WEBSITE_CONFIG;
  try {
    const raw = localStorage.getItem(WEBSITE_CONFIG_KEY);
    if (!raw) return DEFAULT_WEBSITE_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_WEBSITE_CONFIG,
      ...parsed,
      company: { ...DEFAULT_WEBSITE_CONFIG.company, ...(parsed.company ?? {}) },
      social: { ...DEFAULT_WEBSITE_CONFIG.social, ...(parsed.social ?? {}) },
      footer: { ...DEFAULT_WEBSITE_CONFIG.footer, ...(parsed.footer ?? {}) },
      faqs: Array.isArray(parsed.faqs) && parsed.faqs.length > 0 ? parsed.faqs : DEFAULT_WEBSITE_CONFIG.faqs,
      testimonials:
        Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0
          ? parsed.testimonials
          : DEFAULT_WEBSITE_CONFIG.testimonials,
      blogs: Array.isArray(parsed.blogs) && parsed.blogs.length > 0 ? parsed.blogs : DEFAULT_WEBSITE_CONFIG.blogs,
    };
  } catch {
    return DEFAULT_WEBSITE_CONFIG;
  }
}

export function saveWebsiteConfig(config: WebsiteConfig): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(WEBSITE_CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(WEBSITE_CONFIG_EVENT, { detail: config }));
  } catch {
    // Local storage might be disabled
  }
}

export function resetWebsiteConfig(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(WEBSITE_CONFIG_KEY);
    window.dispatchEvent(new CustomEvent(WEBSITE_CONFIG_EVENT, { detail: DEFAULT_WEBSITE_CONFIG }));
  } catch {
    // Ignore
  }
}

/** Reactive hook to read and subscribe to global website configuration */
export function useWebsiteConfig(): WebsiteConfig {
  const [config, setConfig] = useState<WebsiteConfig>(getWebsiteConfig);

  useEffect(() => {
    const handleUpdate = () => {
      setConfig(getWebsiteConfig());
    };

    window.addEventListener(WEBSITE_CONFIG_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(WEBSITE_CONFIG_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return config;
}
