import { DocumentModel, ComponentNode, ExperienceType } from '../types/document';
import { Project, Template, Asset, IntegrationConfig } from '../types/modules';
import { Organization, UserProfile, OrganizationMember } from '../types/auth';

export const SEED_USER: UserProfile = {
  id: 'usr_flowpilot_admin',
  email: 'alex@flowpilot.dev',
  fullName: 'Alex Vance (Lead Architect)',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  createdAt: new Date().toISOString(),
};

export const SEED_ORGANIZATION: Organization = {
  id: 'org_flowpilot_demo',
  name: 'Acme SaaS Cloud',
  slug: 'acme-saas',
  plan: 'pro',
  branding: {
    primaryColor: '#6366f1',
    companyName: 'Acme SaaS',
    brandType: 'SaaS & Web App',
    fontFamily: 'Inter',
    baseFontSize: 16,
    secondaryColor: '#4f46e5',
    accentColor: '#10b981',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    darkThemeEnabled: false,
  },
  createdAt: new Date().toISOString(),
};

export const SEED_MEMBERS: OrganizationMember[] = [
  {
    id: 'mem_1',
    organizationId: SEED_ORGANIZATION.id,
    userId: SEED_USER.id,
    user: SEED_USER,
    role: 'owner',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mem_2',
    organizationId: SEED_ORGANIZATION.id,
    userId: 'usr_sarah_chen',
    user: {
      id: 'usr_sarah_chen',
      email: 'sarah.chen@acme.io',
      fullName: 'Sarah Chen (Growth Lead)',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    },
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mem_3',
    organizationId: SEED_ORGANIZATION.id,
    userId: 'usr_marcus_dev',
    user: {
      id: 'usr_marcus_dev',
      email: 'marcus@acme.io',
      fullName: 'Marcus Brody (UI Engineer)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    },
    role: 'editor',
    createdAt: new Date().toISOString(),
  },
];

// Helper to construct a standard Tour Document
export function createTourDocument(id: string, projectId: string, title: string): DocumentModel {
  return {
    id,
    projectId,
    organizationId: SEED_ORGANIZATION.id,
    title,
    documentType: 'tour',
    schemaVersion: 1,
    themeVariables: {
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderRadius: '8px',
      fontFamily: 'Inter',
    },
    responsiveSettings: {
      breakpoints: { mobile: 480, tablet: 768, desktop: 1200 },
    },
    experienceSettings: {
      showBackdrop: true,
      backdropColor: '#0f172a',
      backdropOpacity: 0.65,
      closeOnBackdropClick: false,
      closeOnEscape: true,
      showProgress: true,
      allowSkip: true,
      brandingEnabled: false,
      accentColor: '#6366f1',
    },
    triggerConditions: {
      urlRules: [{ type: 'contains', value: '/dashboard' }],
      delaySeconds: 1,
      frequency: 'once_per_visitor',
    },
    isPublished: true,
    publishedVersionId: 'ver_tour_v1',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
    rootNode: {
      id: 'tour_root',
      type: 'TourContainer',
      name: 'Product Tour Root',
      props: { currentStepIndex: 0 },
      styles: { width: '100%' },
      children: [
        {
          id: 'step_1',
          type: 'TourStep',
          name: 'Welcome Step',
          target: {
            selector: '#nav-dashboard',
            placement: 'bottom',
            offset: 14,
            highlight: true,
            spotlightPadding: 8,
            fallbackBehavior: 'center',
          },
          props: {
            stepNumber: 1,
            title: 'Welcome to your Workspace 👋',
            description: 'This is your mission control. Easily access your projects, live analytics, and active onboarding flows.',
            nextButtonText: 'Next: Analytics Tour →',
            skipButtonText: 'Skip Tour',
          },
          styles: { width: '380px', backgroundColor: '#ffffff', borderRadius: '12px', paddingLeft: '24px', paddingRight: '24px', paddingTop: '20px', paddingBottom: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' },
          children: [],
        },
        {
          id: 'step_2',
          type: 'TourStep',
          name: 'Analytics Step',
          target: {
            selector: '#metrics-overview',
            placement: 'right',
            offset: 16,
            highlight: true,
            spotlightPadding: 10,
            fallbackBehavior: 'center',
          },
          props: {
            stepNumber: 2,
            title: 'Real-Time Insights 📊',
            description: 'Track impressions, conversion funnels, and completion drop-off rates across all published experiences.',
            prevButtonText: '← Back',
            nextButtonText: 'Next: Creating Flows →',
            skipButtonText: 'Skip Tour',
          },
          styles: { width: '380px', backgroundColor: '#ffffff', borderRadius: '12px', paddingLeft: '24px', paddingRight: '24px', paddingTop: '20px', paddingBottom: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' },
          children: [],
        },
        {
          id: 'step_3',
          type: 'TourStep',
          name: 'Action Step',
          target: {
            selector: '#btn-create-experience',
            placement: 'bottom',
            offset: 14,
            highlight: true,
            spotlightPadding: 6,
            fallbackBehavior: 'center',
          },
          props: {
            stepNumber: 3,
            title: 'Create Your First Flow 🚀',
            description: 'Click here anytime to start building tours, interactive demos, announcements, popups, or surveys!',
            prevButtonText: '← Back',
            nextButtonText: 'Got It! Complete Tour 🎉',
            skipButtonText: 'Dismiss',
          },
          styles: { width: '380px', backgroundColor: '#ffffff', borderRadius: '12px', paddingLeft: '24px', paddingRight: '24px', paddingTop: '20px', paddingBottom: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' },
          children: [],
        },
      ],
    },
  };
}

// Helper to construct interactive demo document
export function createDemoDocument(id: string, projectId: string, title: string): DocumentModel {
  return {
    id,
    projectId,
    organizationId: SEED_ORGANIZATION.id,
    title,
    documentType: 'demo',
    schemaVersion: 1,
    themeVariables: {
      primaryColor: '#8b5cf6',
      secondaryColor: '#6d28d9',
      backgroundColor: '#f8fafc',
      textColor: '#0f172a',
      borderRadius: '8px',
      fontFamily: 'Inter',
    },
    responsiveSettings: {
      breakpoints: { mobile: 480, tablet: 768, desktop: 1200 },
    },
    experienceSettings: {
      showProgress: true,
      accentColor: '#8b5cf6',
    },
    triggerConditions: {
      urlRules: [],
      delaySeconds: 0,
      frequency: 'always',
    },
    isPublished: true,
    publishedVersionId: 'ver_demo_v1',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
    rootNode: {
      id: 'demo_root',
      type: 'DemoContainer',
      name: 'Interactive Demo Flow',
      props: { currentScreenIndex: 0 },
      styles: { width: '100%', minHeight: '600px' },
      children: [
        {
          id: 'screen_1',
          type: 'DemoScreen',
          name: 'Dashboard Overview Screen',
          props: {
            title: 'Simulated Dashboard',
            imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
            screenNumber: 1,
          },
          styles: { width: '100%', height: '540px', position: 'relative' },
          children: [
            {
              id: 'hotspot_1',
              type: 'DemoHotspot',
              name: 'Clickable Filter Hotspot',
              props: {
                tooltipTitle: 'Explore Filter',
                tooltipText: 'Click here to switch to customer segmentation view',
                targetScreenId: 'screen_2',
                pulseAnimation: true,
              },
              styles: { position: 'absolute', top: '130px', left: '260px', width: '36px', height: '36px' },
              children: [],
            },
          ],
        },
        {
          id: 'screen_2',
          type: 'DemoScreen',
          name: 'Customer Details Screen',
          props: {
            title: 'Filtered Customers Screen',
            imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
            screenNumber: 2,
          },
          styles: { width: '100%', height: '540px', position: 'relative' },
          children: [
            {
              id: 'hotspot_2',
              type: 'DemoHotspot',
              name: 'Export Report Hotspot',
              props: {
                tooltipTitle: 'Instant Export',
                tooltipText: 'Click to trigger automated PDF / CSV generation',
                targetScreenId: 'screen_1',
                pulseAnimation: true,
              },
              styles: { position: 'absolute', top: '210px', left: '720px', width: '36px', height: '36px' },
              children: [],
            },
          ],
        },
      ],
    },
  };
}

// Helper to construct structured Page document
export function createPageDocument(id: string, projectId: string, title: string): DocumentModel {
  return {
    id,
    projectId,
    organizationId: SEED_ORGANIZATION.id,
    title,
    documentType: 'page',
    schemaVersion: 1,
    themeVariables: {
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderRadius: '8px',
      fontFamily: 'Inter',
    },
    responsiveSettings: {
      breakpoints: { mobile: 480, tablet: 768, desktop: 1200 },
    },
    experienceSettings: {
      accentColor: '#6366f1',
    },
    triggerConditions: {
      urlRules: [],
      delaySeconds: 0,
      frequency: 'always',
    },
    isPublished: true,
    publishedVersionId: 'ver_page_v1',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    rootNode: {
      id: 'page_root',
      type: 'Container',
      name: 'Landing Page Root',
      props: {},
      styles: { width: '100%', minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' },
      children: [
        {
          id: 'sec_hero',
          type: 'HeroSection',
          name: 'Hero Section',
          props: {
            badge: '⚡ Powered by Autonomous Visual Tech',
            headline: 'Convert Every Visitor with Guided Experiences',
            subheadline: 'Build interactive product tours, in-app announcements, checklists, and responsive landing pages in minutes without engineers.',
            primaryCtaText: 'Start Free Trial',
            secondaryCtaText: 'Book Interactive Demo',
          },
          styles: { width: '100%', paddingTop: '64px', paddingBottom: '64px', backgroundColor: '#faf5ff', textAlign: 'center' },
          children: [],
        },
        {
          id: 'sec_features',
          type: 'FeaturesSection',
          name: 'Features Grid',
          props: {
            title: 'Built for High-Growth Product Teams',
            subtitle: 'Everything you need to onboard, activate, and retain users effortlessly.',
          },
          styles: { width: '100%', paddingTop: '56px', paddingBottom: '56px', backgroundColor: '#ffffff' },
          children: [],
        },
        {
          id: 'sec_cta',
          type: 'CtaSection',
          name: 'Bottom CTA Section',
          props: {
            headline: 'Ready to 10x your activation rates?',
            subheadline: 'Join over 4,500 product leaders building with FlowPilot today.',
            buttonText: 'Get Started for Free',
          },
          styles: { width: '100%', paddingTop: '60px', paddingBottom: '60px', backgroundColor: '#1e1b4b', color: '#ffffff', textAlign: 'center' },
          children: [],
        },
      ],
    },
  };
}

// Helper to construct Banner document
export function createBannerDocument(id: string, projectId: string, title: string): DocumentModel {
  return {
    id,
    projectId,
    organizationId: SEED_ORGANIZATION.id,
    title,
    documentType: 'banner',
    schemaVersion: 1,
    themeVariables: {
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      backgroundColor: '#1e1b4b',
      textColor: '#ffffff',
      borderRadius: '6px',
      fontFamily: 'Inter',
    },
    responsiveSettings: {
      breakpoints: { mobile: 480, tablet: 768, desktop: 1200 },
    },
    experienceSettings: {
      accentColor: '#6366f1',
    },
    triggerConditions: {
      urlRules: [{ type: 'exact', value: '/' }],
      delaySeconds: 0,
      frequency: 'always',
    },
    isPublished: true,
    publishedVersionId: 'ver_banner_v1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rootNode: {
      id: 'banner_root',
      type: 'BannerContainer',
      name: 'Banner Canvas',
      props: { placement: 'top', sticky: true },
      styles: { width: '100%', minHeight: '60px', backgroundColor: '#312e81', display: 'flex', flexDirection: 'column' },
      children: [
        {
          id: 'banner_w_1',
          type: 'BannerWidget',
          name: 'Announcement Bar',
          props: {
            badgeText: 'NEW RELEASE',
            message: 'FlowPilot 2.0 is live! Explore our new AI-assisted visual builder & instant publishing engine.',
            ctaText: 'See What’s New →',
            ctaUrl: 'https://flowpilot.dev/updates',
            isDismissible: true,
            placement: 'top',
          },
          styles: { width: '100%', backgroundColor: '#4338ca', color: '#ffffff', paddingTop: '10px', paddingBottom: '10px', paddingLeft: '16px', paddingRight: '16px' },
          children: [],
        },
      ],
    },
  };
}

// Helper to construct Menu document
export function createMenuDocument(id: string, projectId: string, title: string): DocumentModel {
  return {
    id,
    projectId,
    organizationId: SEED_ORGANIZATION.id,
    title,
    documentType: 'menu',
    schemaVersion: 1,
    themeVariables: {
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderRadius: '6px',
      fontFamily: 'Inter',
    },
    responsiveSettings: {
      breakpoints: { mobile: 480, tablet: 768, desktop: 1200 },
    },
    experienceSettings: {
      accentColor: '#6366f1',
    },
    triggerConditions: {
      urlRules: [],
      delaySeconds: 0,
      frequency: 'always',
    },
    isPublished: true,
    publishedVersionId: 'ver_menu_v1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rootNode: {
      id: 'menu_root',
      type: 'MenuContainer',
      name: 'Navigation Bar',
      props: {},
      styles: { width: '100%', minHeight: '64px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' },
      children: [
        {
          id: 'menu_w_1',
          type: 'MenuWidget',
          name: 'Global Header Navigation',
          props: {
            logoText: 'Acme Cloud',
            ctaText: 'Sign In',
            items: [
              { label: 'Platform', href: '#platform', children: ['Tours & Demos', 'In-App Banners', 'Analytics'] },
              { label: 'Solutions', href: '#solutions', children: ['For SaaS', 'For E-Commerce', 'For Agencies'] },
              { label: 'Templates', href: '#templates' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Changelog', href: '#changelog' },
            ],
          },
          styles: { width: '100%', backgroundColor: '#ffffff', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '24px', paddingRight: '24px' },
          children: [],
        },
      ],
    },
  };
}

// Helper to construct FAQ document
export function createFaqDocument(id: string, projectId: string, title: string): DocumentModel {
  return {
    id,
    projectId,
    organizationId: SEED_ORGANIZATION.id,
    title,
    documentType: 'faq',
    schemaVersion: 1,
    themeVariables: {
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderRadius: '8px',
      fontFamily: 'Inter',
    },
    responsiveSettings: {
      breakpoints: { mobile: 480, tablet: 768, desktop: 1200 },
    },
    experienceSettings: {
      accentColor: '#6366f1',
    },
    triggerConditions: {
      urlRules: [],
      delaySeconds: 0,
      frequency: 'always',
    },
    isPublished: true,
    publishedVersionId: 'ver_faq_v1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rootNode: {
      id: 'faq_root',
      type: 'FaqContainer',
      name: 'Customer Support FAQ Canvas',
      props: {},
      styles: { width: '100%', minHeight: '200px', display: 'flex', flexDirection: 'column' },
      children: [
        {
          id: 'faq_w_1',
          type: 'FaqWidget',
          name: 'Customer Support FAQ',
          props: {
            title: 'Frequently Asked Questions',
            subtitle: 'Everything you need to know about our visual adoption engine and integrations.',
            showSearch: true,
            items: [
              {
                q: 'How does the FlowPilot embed script work without slowing down my site?',
                a: 'The FlowPilot client snippet is ultra-lightweight (<18kb gzip) and loads asynchronously (defer). It initializes only when DOM content is ready and executes with zero external dependencies.',
              },
              {
                q: 'Can I target specific customer cohorts or paid user plans?',
                a: 'Yes. You can configure audience trigger rules by URL paths, user roles, device types, or custom metadata passed through your frontend application.',
              },
              {
                q: 'Do I need developer support to create or edit tours?',
                a: 'None! Our point-and-click target picker and visual editor allow any product manager or marketer to build and deploy experiences safely without code.',
              },
              {
                q: 'Are my analytics captured with privacy compliance?',
                a: 'Yes. FlowPilot utilizes privacy-conscious, pseudonymous visitor identifiers and never captures sensitive PII unless explicitly mapped in your survey responses.',
              },
            ],
          },
          styles: { width: '100%', maxWidth: '800px', margin: '0 auto', paddingTop: '40px', paddingBottom: '40px' },
          children: [],
        },
      ],
    },
  };
}

// Helper to construct Popup document
export function createPopupDocument(id: string, projectId: string, title: string): DocumentModel {
  return {
    id,
    projectId,
    organizationId: SEED_ORGANIZATION.id,
    title,
    documentType: 'popup',
    schemaVersion: 1,
    themeVariables: {
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderRadius: '16px',
      fontFamily: 'Inter',
    },
    responsiveSettings: {
      breakpoints: { mobile: 480, tablet: 768, desktop: 1200 },
    },
    experienceSettings: {
      showBackdrop: true,
      backdropColor: '#000000',
      backdropOpacity: 0.5,
      closeOnBackdropClick: true,
      closeOnEscape: true,
      accentColor: '#6366f1',
    },
    triggerConditions: {
      urlRules: [{ type: 'exact', value: '/pricing' }],
      delaySeconds: 5,
      scrollPercentage: 50,
      frequency: 'once_per_visitor',
    },
    isPublished: true,
    publishedVersionId: 'ver_popup_v1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rootNode: {
      id: 'popup_root',
      type: 'PopupContainer',
      name: 'Popup Lightbox Canvas',
      props: {},
      styles: { width: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' },
      children: [
        {
          id: 'popup_w_1',
          type: 'PopupWidget',
          name: 'Special Offer Modal',
          props: {
            headline: 'Unlock 25% Off Annual Pro 🎁',
            bodyText: 'Upgrade your workspace today and get full access to our AI generation suite, unlimited tours, and custom domain hosting.',
            ctaText: 'Claim Your Discount Now',
            cancelText: 'Maybe later',
            icon: 'Sparkles',
          },
          styles: { width: '480px', backgroundColor: '#ffffff', borderRadius: '16px', paddingLeft: '32px', paddingRight: '32px', paddingTop: '28px', paddingBottom: '28px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
          children: [],
        },
      ],
    },
  };
}

// Helper to construct Checklist document
export function createChecklistDocument(id: string, projectId: string, title: string): DocumentModel {
  return {
    id,
    projectId,
    organizationId: SEED_ORGANIZATION.id,
    title,
    documentType: 'checklist',
    schemaVersion: 1,
    themeVariables: {
      primaryColor: '#10b981',
      secondaryColor: '#059669',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderRadius: '12px',
      fontFamily: 'Inter',
    },
    responsiveSettings: {
      breakpoints: { mobile: 480, tablet: 768, desktop: 1200 },
    },
    experienceSettings: {
      accentColor: '#10b981',
    },
    triggerConditions: {
      urlRules: [],
      delaySeconds: 2,
      frequency: 'always',
    },
    isPublished: true,
    publishedVersionId: 'ver_checklist_v1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rootNode: {
      id: 'checklist_root',
      type: 'ChecklistContainer',
      name: 'Activation Checklist Canvas',
      props: {},
      styles: { width: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column' },
      children: [
        {
          id: 'checklist_w_1',
          type: 'ChecklistWidget',
          name: 'Get Started Checklist',
          props: {
            title: 'Complete Your Setup (2 of 4 done)',
            subtitle: 'Follow these essential steps to maximize your platform activation.',
            rewardMessage: 'Congratulations! You unlocked the Early Adopter Badge! 🎉',
            tasks: [
              { id: 't1', title: 'Connect your corporate workspace', completed: true, url: '/settings' },
              { id: 't2', title: 'Create your first interactive tour', completed: true, url: '/tours' },
              { id: 't3', title: 'Invite team members to collaborate', completed: false, url: '/team' },
              { id: 't4', title: 'Publish client embed script to staging', completed: false, url: '/domains' },
            ],
          },
          styles: { width: '360px', backgroundColor: '#ffffff', borderRadius: '12px', paddingLeft: '20px', paddingRight: '20px', paddingTop: '18px', paddingBottom: '18px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
          children: [],
        },
      ],
    },
  };
}

// Helper to construct Survey document
export function createSurveyDocument(id: string, projectId: string, title: string): DocumentModel {
  return {
    id,
    projectId,
    organizationId: SEED_ORGANIZATION.id,
    title,
    documentType: 'survey',
    schemaVersion: 1,
    themeVariables: {
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderRadius: '12px',
      fontFamily: 'Inter',
    },
    responsiveSettings: {
      breakpoints: { mobile: 480, tablet: 768, desktop: 1200 },
    },
    experienceSettings: {
      accentColor: '#6366f1',
    },
    triggerConditions: {
      urlRules: [],
      delaySeconds: 15,
      frequency: 'once_per_visitor',
    },
    isPublished: true,
    publishedVersionId: 'ver_survey_v1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rootNode: {
      id: 'survey_root',
      type: 'SurveyContainer',
      name: 'Customer Feedback Survey Canvas',
      props: {},
      styles: { width: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column' },
      children: [
        {
          id: 'survey_w_1',
          type: 'SurveyWidget',
          name: 'Product NPS Survey',
          props: {
            question: 'How likely are you to recommend FlowPilot to a colleague?',
            type: 'nps', // 0 - 10
            followUpQuestion: 'What is the primary reason for your score?',
            submitButtonText: 'Submit Feedback',
            thankYouTitle: 'Thank you for your feedback! ❤️',
            thankYouSubtitle: 'Your response helps us continuously improve the experience builder.',
          },
          styles: { width: '420px', backgroundColor: '#ffffff', borderRadius: '12px', paddingLeft: '24px', paddingRight: '24px', paddingTop: '20px', paddingBottom: '20px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' },
          children: [],
        },
      ],
    },
  };
}

// Helper to construct Pricing document
export function createPricingDocument(id: string, projectId: string, title: string): DocumentModel {
  return {
    id,
    projectId,
    organizationId: SEED_ORGANIZATION.id,
    title,
    documentType: 'pricing',
    schemaVersion: 1,
    themeVariables: {
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderRadius: '12px',
      fontFamily: 'Inter',
    },
    responsiveSettings: {
      breakpoints: { mobile: 480, tablet: 768, desktop: 1200 },
    },
    experienceSettings: { accentColor: '#6366f1' },
    triggerConditions: { urlRules: [], delaySeconds: 0, frequency: 'always' },
    isPublished: true,
    publishedVersionId: 'ver_pricing_v1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rootNode: {
      id: 'pricing_root',
      type: 'Container',
      name: 'Pricing Canvas Root',
      props: {},
      styles: { width: '100%', minHeight: '500px', display: 'flex', flexDirection: 'column', padding: '24px' },
      children: [
        {
          id: 'pricing_sec_1',
          type: 'PricingSection',
          name: 'Subscription Tiers',
          props: {
            headline: 'Simple, Transparent Pricing',
            subheadline: 'Choose the plan that fits your growth stage. Upgrade or downgrade anytime.',
          },
          styles: { width: '100%' },
          children: [],
        },
      ],
    },
  };
}

// Helper to construct Testimonials document
export function createTestimonialsDocument(id: string, projectId: string, title: string): DocumentModel {
  return {
    id,
    projectId,
    organizationId: SEED_ORGANIZATION.id,
    title,
    documentType: 'testimonials',
    schemaVersion: 1,
    themeVariables: {
      primaryColor: '#8b5cf6',
      secondaryColor: '#7c3aed',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderRadius: '12px',
      fontFamily: 'Inter',
    },
    responsiveSettings: {
      breakpoints: { mobile: 480, tablet: 768, desktop: 1200 },
    },
    experienceSettings: { accentColor: '#8b5cf6' },
    triggerConditions: { urlRules: [], delaySeconds: 0, frequency: 'always' },
    isPublished: true,
    publishedVersionId: 'ver_test_v1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rootNode: {
      id: 'test_root',
      type: 'Container',
      name: 'Testimonials Canvas Root',
      props: {},
      styles: { width: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column', padding: '24px' },
      children: [
        {
          id: 'test_sec_1',
          type: 'TestimonialsSection',
          name: 'Customer Wall of Love',
          props: {
            title: 'Loved by Product Teams Worldwide',
            subtitle: 'See how market leaders transform user adoption with FlowPilot.',
          },
          styles: { width: '100%' },
          children: [],
        },
      ],
    },
  };
}

// Helper to construct Form document
export function createFormDocument(id: string, projectId: string, title: string): DocumentModel {
  return {
    id,
    projectId,
    organizationId: SEED_ORGANIZATION.id,
    title,
    documentType: 'form',
    schemaVersion: 1,
    themeVariables: {
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderRadius: '12px',
      fontFamily: 'Inter',
    },
    responsiveSettings: {
      breakpoints: { mobile: 480, tablet: 768, desktop: 1200 },
    },
    experienceSettings: { accentColor: '#6366f1' },
    triggerConditions: { urlRules: [], delaySeconds: 0, frequency: 'always' },
    isPublished: true,
    publishedVersionId: 'ver_form_v1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rootNode: {
      id: 'form_root',
      type: 'Container',
      name: 'Lead Capture Canvas Root',
      props: {},
      styles: { width: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column', padding: '24px' },
      children: [
        {
          id: 'form_sec_1',
          type: 'FormSection',
          name: 'Contact & Demo Inquiries',
          props: {
            title: 'Schedule a Guided Demo',
            subtitle: 'Talk with our product adoption specialists and discover what FlowPilot can do for your metrics.',
            buttonText: 'Submit Request',
          },
          styles: { width: '100%' },
          children: [],
        },
      ],
    },
  };
}

// Helper to construct clean blank documents (without bloated dummy data)
export function createBlankDocument(id: string, projectId: string, title: string, type: ExperienceType): DocumentModel {
  const baseDoc: Omit<DocumentModel, 'rootNode' | 'documentType'> = {
    id,
    projectId,
    organizationId: SEED_ORGANIZATION.id,
    title,
    schemaVersion: 1,
    themeVariables: {
      primaryColor: '#6366f1',
      secondaryColor: '#4f46e5',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderRadius: '8px',
      fontFamily: 'Inter',
    },
    responsiveSettings: {
      breakpoints: { mobile: 480, tablet: 768, desktop: 1200 },
    },
    experienceSettings: {
      accentColor: '#6366f1',
      showProgress: true,
    },
    triggerConditions: {
      urlRules: [],
      delaySeconds: 0,
      frequency: 'always',
    },
    isPublished: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  switch (type) {
    case 'tour':
      return {
        ...baseDoc,
        documentType: 'tour',
        rootNode: {
          id: 'tour_root',
          type: 'TourContainer',
          name: 'Product Tour Canvas',
          props: {},
          styles: { width: '100%', minHeight: '500px' },
          children: [
            {
              id: `step_${Date.now()}_1`,
              type: 'TourStep',
              name: 'Step 1: Welcome',
              target: {
                selector: 'header',
                placement: 'bottom',
                offset: 12,
                highlight: true,
                spotlightPadding: 8,
                fallbackBehavior: 'center',
              },
              props: {
                stepNumber: 1,
                title: 'Welcome to your experience',
                description: 'Add your message here or customize this step using the right properties panel.',
                prevButtonText: 'Back',
                nextButtonText: 'Next →',
                skipButtonText: 'Skip',
              },
              styles: {
                width: '380px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                paddingLeft: '24px',
                paddingRight: '24px',
                paddingTop: '20px',
                paddingBottom: '20px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              },
              children: [],
            },
          ],
        },
      };

    case 'demo':
      return {
        ...baseDoc,
        documentType: 'demo',
        rootNode: {
          id: 'demo_root',
          type: 'DemoContainer',
          name: 'Interactive Demo Canvas',
          props: { currentScreenIndex: 0 },
          styles: { width: '100%', minHeight: '600px' },
          children: [
            {
              id: `screen_${Date.now()}_1`,
              type: 'DemoScreen',
              name: 'Demo Screen 1',
              props: {
                title: 'Screen 1',
                imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
                screenNumber: 1,
              },
              styles: { width: '100%', minHeight: '520px', position: 'relative' },
              children: [],
            },
          ],
        },
      };

    case 'faq':
      return {
        ...baseDoc,
        documentType: 'faq',
        rootNode: {
          id: 'faq_root',
          type: 'FaqContainer',
          name: 'FAQ Canvas',
          props: {},
          styles: { width: '100%', minHeight: '320px', display: 'flex', flexDirection: 'column' },
          children: [
            {
              id: `faq_${Date.now()}`,
              type: 'FaqWidget',
              name: 'FAQ Section',
              props: {
                title: 'Frequently Asked Questions',
                subtitle: 'Find clear answers to help you navigate our platform.',
                items: [
                  {
                    question: 'How does this work?',
                    answer: 'You can customize questions, add new blocks from the sidebar, or configure targeting rules in the top bar.',
                  },
                ],
              },
              styles: { width: '100%', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '24px', paddingRight: '24px', paddingTop: '32px', paddingBottom: '32px' },
              children: [],
            },
          ],
        },
      };

    case 'banner':
      return {
        ...baseDoc,
        documentType: 'banner',
        rootNode: {
          id: 'banner_root',
          type: 'BannerContainer',
          name: 'Banner Canvas',
          props: {},
          styles: { width: '100%', minHeight: '80px', display: 'flex', flexDirection: 'column' },
          children: [
            {
              id: `banner_${Date.now()}`,
              type: 'Banner',
              name: 'Announcement Banner',
              props: {
                text: 'New Announcement: Update your content here or drag blocks into the canvas.',
                buttonText: 'Learn More',
                linkUrl: '#',
                dismissible: true,
              },
              styles: { width: '100%', backgroundColor: '#6366f1', color: '#ffffff', paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px', borderRadius: '8px' },
              children: [],
            },
          ],
        },
      };

    case 'popup':
      return {
        ...baseDoc,
        documentType: 'popup',
        rootNode: {
          id: 'popup_root',
          type: 'PopupContainer',
          name: 'Popup Canvas',
          props: {},
          styles: { width: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
          children: [
            {
              id: `popup_${Date.now()}`,
              type: 'PopupModal',
              name: 'Modal Card',
              props: {
                title: 'Special Notice',
                content: 'Add your notice or promotional offer content here.',
                buttonText: 'Get Started',
                cancelButtonText: 'Maybe Later',
              },
              styles: { width: '480px', backgroundColor: '#ffffff', borderRadius: '16px', paddingLeft: '32px', paddingRight: '32px', paddingTop: '32px', paddingBottom: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
              children: [],
            },
          ],
        },
      };

    case 'checklist':
      return {
        ...baseDoc,
        documentType: 'checklist',
        rootNode: {
          id: 'chk_root',
          type: 'ChecklistContainer',
          name: 'Checklist Canvas',
          props: {},
          styles: { width: '380px', backgroundColor: '#ffffff', borderRadius: '16px', paddingLeft: '20px', paddingRight: '20px', paddingTop: '20px', paddingBottom: '20px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' },
          children: [
            {
              id: `chk_item_${Date.now()}`,
              type: 'ChecklistItem',
              name: 'Checklist Item 1',
              props: {
                title: 'Complete your first task',
                description: 'Click to mark as done or edit this step in the properties panel.',
                isCompleted: false,
              },
              styles: {},
              children: [],
            },
          ],
        },
      };

    case 'survey':
      return {
        ...baseDoc,
        documentType: 'survey',
        rootNode: {
          id: 'survey_root',
          type: 'SurveyContainer',
          name: 'Survey Canvas',
          props: { surveyType: 'csat' },
          styles: { width: '420px', backgroundColor: '#ffffff', borderRadius: '16px', paddingLeft: '24px', paddingRight: '24px', paddingTop: '24px', paddingBottom: '24px', boxShadow: '0 15px 30px -10px rgba(0, 0, 0, 0.15)' },
          children: [
            {
              id: `survey_q_${Date.now()}`,
              type: 'SurveyQuestion',
              name: 'Rating Question',
              props: {
                questionText: 'How would you rate your experience?',
                questionType: 'rating',
              },
              styles: {},
              children: [],
            },
          ],
        },
      };

    case 'pricing':
      return {
        ...baseDoc,
        documentType: 'pricing',
        rootNode: {
          id: 'pricing_root',
          type: 'PricingTable',
          name: 'Pricing Canvas',
          props: {
            title: 'Simple, Transparent Pricing',
            subtitle: 'Choose the plan that fits your business needs.',
          },
          styles: { width: '100%', maxWidth: '1000px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '24px', paddingRight: '24px', paddingTop: '36px', paddingBottom: '36px' },
          children: [],
        },
      };

    case 'testimonials':
      return {
        ...baseDoc,
        documentType: 'testimonials',
        rootNode: {
          id: 'test_root',
          type: 'TestimonialsGrid',
          name: 'Testimonials Canvas',
          props: {
            title: 'Customer Stories',
            subtitle: 'See how innovative teams achieve results with our platform.',
          },
          styles: { width: '100%', maxWidth: '1000px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '24px', paddingRight: '24px', paddingTop: '36px', paddingBottom: '36px' },
          children: [],
        },
      };

    case 'form':
      return {
        ...baseDoc,
        documentType: 'form',
        rootNode: {
          id: 'form_root',
          type: 'FormContainer',
          name: 'Form Canvas',
          props: {},
          styles: { width: '100%', minHeight: '320px', display: 'flex', flexDirection: 'column', padding: '24px' },
          children: [
            {
              id: `form_sec_${Date.now()}`,
              type: 'FormSection',
              name: 'Inquiry Form',
              props: {
                title: 'Get in Touch',
                subtitle: 'Send us a message and our team will get back to you promptly.',
                buttonText: 'Submit Inquiry',
              },
              styles: { width: '100%', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' },
              children: [],
            },
          ],
        },
      };

    case 'menu':
      return {
        ...baseDoc,
        documentType: 'menu',
        rootNode: {
          id: 'menu_root',
          type: 'MenuContainer',
          name: 'Navigation Header Canvas',
          props: { brandName: 'FlowPilot Brand' },
          styles: { width: '100%', backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderWidth: '1px', borderStyle: 'solid', paddingLeft: '24px', paddingRight: '24px', paddingTop: '16px', paddingBottom: '16px' },
          children: [],
        },
      };

    case 'page':
    default:
      return {
        ...baseDoc,
        documentType: 'page',
        rootNode: {
          id: 'root',
          type: 'Container',
          name: 'Main Page Canvas',
          props: {},
          styles: {
            width: '100%',
            minHeight: '600px',
            backgroundColor: '#ffffff',
            paddingLeft: '32px',
            paddingRight: '32px',
            paddingTop: '48px',
            paddingBottom: '48px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          },
          children: [],
        },
      };
  }
}

// All Seed Projects
export const SEED_PROJECTS: Project[] = [
  {
    id: 'proj_tour_1',
    organizationId: SEED_ORGANIZATION.id,
    title: 'Customer Onboarding Walkthrough',
    description: '3-step interactive spotlight tour guiding new users through their core workspace metrics.',
    type: 'tour',
    status: 'published',
    tags: ['onboarding', 'core', 'activation'],
    documentId: 'doc_tour_1',
    createdBy: SEED_USER.id,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    viewsCount: 3420,
    completionRate: 78.4,
  },
  {
    id: 'proj_demo_1',
    organizationId: SEED_ORGANIZATION.id,
    title: 'Interactive CRM Demo Experience',
    description: 'Guided simulated product screens with clickable hotspots showcasing customer search & exports.',
    type: 'demo',
    status: 'published',
    tags: ['sales', 'demo', 'marketing'],
    documentId: 'doc_demo_1',
    createdBy: SEED_USER.id,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
    viewsCount: 1840,
    completionRate: 64.2,
  },
  {
    id: 'proj_page_1',
    organizationId: SEED_ORGANIZATION.id,
    title: 'High-Converting SaaS Landing Page',
    description: 'Structured responsive page with Hero, Feature grid, and high-impact CTA sections.',
    type: 'page',
    status: 'published',
    tags: ['landing-page', 'marketing'],
    documentId: 'doc_page_1',
    createdBy: SEED_USER.id,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
    viewsCount: 12900,
    completionRate: 22.8,
  },
  {
    id: 'proj_banner_1',
    organizationId: SEED_ORGANIZATION.id,
    title: 'Product 2.0 Launch Announcement',
    description: 'Top-anchored announcement banner with call-to-action button and dismiss behavior.',
    type: 'banner',
    status: 'published',
    tags: ['announcement', 'growth'],
    documentId: 'doc_banner_1',
    createdBy: SEED_USER.id,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    viewsCount: 8400,
    completionRate: 14.1,
  },
  {
    id: 'proj_menu_1',
    organizationId: SEED_ORGANIZATION.id,
    title: 'Universal Header Navigation Menu',
    description: 'Accessible header navigation bar with dropdown menus and mobile drawer support.',
    type: 'menu',
    status: 'published',
    tags: ['navigation', 'header'],
    documentId: 'doc_menu_1',
    createdBy: SEED_USER.id,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    viewsCount: 22000,
    completionRate: 91.5,
  },
  {
    id: 'proj_faq_1',
    organizationId: SEED_ORGANIZATION.id,
    title: 'Support & Knowledge Base FAQ',
    description: 'Searchable accordion-style FAQ widget with expandable answers and category filtering.',
    type: 'faq',
    status: 'published',
    tags: ['support', 'help-center'],
    documentId: 'doc_faq_1',
    createdBy: SEED_USER.id,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
    viewsCount: 4210,
    completionRate: 52.0,
  },
  {
    id: 'proj_popup_1',
    organizationId: SEED_ORGANIZATION.id,
    title: 'Quarterly Upgrade Modal Popup',
    description: 'Centrally anchored conversion modal with exit-intent trigger and discount incentives.',
    type: 'popup',
    status: 'published',
    tags: ['conversion', 'monetization'],
    documentId: 'doc_popup_1',
    createdBy: SEED_USER.id,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
    viewsCount: 6150,
    completionRate: 18.7,
  },
  {
    id: 'proj_checklist_1',
    organizationId: SEED_ORGANIZATION.id,
    title: 'New Account Activation Checklist',
    description: 'Collapsible floating onboarding checklist with step completion tracking and rewards.',
    type: 'checklist',
    status: 'published',
    tags: ['activation', 'retention'],
    documentId: 'doc_checklist_1',
    createdBy: SEED_USER.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewsCount: 2890,
    completionRate: 68.3,
  },
  {
    id: 'proj_survey_1',
    organizationId: SEED_ORGANIZATION.id,
    title: 'Quarterly Customer NPS Survey',
    description: 'NPS rating score widget (0-10) with follow-up feedback capture and response recording.',
    type: 'survey',
    status: 'published',
    tags: ['feedback', 'csat', 'nps'],
    documentId: 'doc_survey_1',
    createdBy: SEED_USER.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewsCount: 1950,
    completionRate: 41.2,
  },
  {
    id: 'proj_pricing_1',
    organizationId: SEED_ORGANIZATION.id,
    title: 'Tiered SaaS Subscription Pricing Table',
    description: 'Responsive multi-tier pricing grid with feature comparison lists and checkout CTAs.',
    type: 'pricing',
    status: 'published',
    tags: ['pricing', 'monetization', 'saas'],
    documentId: 'doc_pricing_1',
    createdBy: SEED_USER.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewsCount: 5120,
    completionRate: 29.4,
  },
  {
    id: 'proj_testimonials_1',
    organizationId: SEED_ORGANIZATION.id,
    title: 'Customer Success & Reviews Grid',
    description: 'Social proof testimonial cards featuring customer avatars, star ratings, and company badges.',
    type: 'testimonials',
    status: 'published',
    tags: ['social-proof', 'testimonials', 'reviews'],
    documentId: 'doc_testimonials_1',
    createdBy: SEED_USER.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewsCount: 3890,
    completionRate: 35.8,
  },
  {
    id: 'proj_form_1',
    organizationId: SEED_ORGANIZATION.id,
    title: 'Executive Demo Request Lead Form',
    description: 'High-conversion contact & demo inquiry form with client validation and feedback response.',
    type: 'form',
    status: 'published',
    tags: ['leads', 'contact', 'form'],
    documentId: 'doc_form_1',
    createdBy: SEED_USER.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewsCount: 2410,
    completionRate: 48.0,
  },
];

// All Seed Documents mapped to projects
export const SEED_DOCUMENTS: Record<string, DocumentModel> = {
  doc_tour_1: createTourDocument('doc_tour_1', 'proj_tour_1', 'Customer Onboarding Walkthrough'),
  doc_demo_1: createDemoDocument('doc_demo_1', 'proj_demo_1', 'Interactive CRM Demo Experience'),
  doc_page_1: createPageDocument('doc_page_1', 'proj_page_1', 'High-Converting SaaS Landing Page'),
  doc_banner_1: createBannerDocument('doc_banner_1', 'proj_banner_1', 'Product 2.0 Launch Announcement'),
  doc_menu_1: createMenuDocument('doc_menu_1', 'proj_menu_1', 'Universal Header Navigation Menu'),
  doc_faq_1: createFaqDocument('doc_faq_1', 'proj_faq_1', 'Support & Knowledge Base FAQ'),
  doc_popup_1: createPopupDocument('doc_popup_1', 'proj_popup_1', 'Quarterly Upgrade Modal Popup'),
  doc_checklist_1: createChecklistDocument('doc_checklist_1', 'proj_checklist_1', 'New Account Activation Checklist'),
  doc_survey_1: createSurveyDocument('doc_survey_1', 'proj_survey_1', 'Quarterly Customer NPS Survey'),
  doc_pricing_1: createPricingDocument('doc_pricing_1', 'proj_pricing_1', 'Tiered SaaS Subscription Pricing Table'),
  doc_testimonials_1: createTestimonialsDocument('doc_testimonials_1', 'proj_testimonials_1', 'Customer Success & Reviews Grid'),
  doc_form_1: createFormDocument('doc_form_1', 'proj_form_1', 'Executive Demo Request Lead Form'),
};

// Seed Templates across categories
export const SEED_TEMPLATES: Template[] = [
  // 1. Tours
  {
    id: 'tpl_tour_saas',
    title: 'SaaS First-Time User Onboarding Tour',
    description: '4-step tour highlighting main dashboard features, analytics cards, and quick actions.',
    category: 'tour',
    tags: ['saas', 'onboarding', 'walkthrough'],
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80',
    stepsCount: 4,
    isPopular: true,
    documentData: createTourDocument('tpl_doc_1', 'tpl_proj_1', 'SaaS Onboarding Tour'),
  },
  {
    id: 'tpl_tour_feature',
    title: 'New Feature Spotlight Tour',
    description: 'Targeted 3-step walkthrough focusing exclusively on new workflow tools and action buttons.',
    category: 'tour',
    tags: ['feature', 'spotlight', 'adoption'],
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=80',
    stepsCount: 3,
    isPopular: false,
    documentData: createTourDocument('tpl_doc_1b', 'tpl_proj_1b', 'New Feature Spotlight Tour'),
  },

  // 2. Demos
  {
    id: 'tpl_demo_crm',
    title: 'Interactive CRM & Pipeline Demo',
    description: 'Multi-screen interactive walkthrough with clickable hotspots for lead qualification.',
    category: 'demo',
    tags: ['crm', 'demo', 'sales'],
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=80',
    stepsCount: 3,
    isPopular: true,
    documentData: createDemoDocument('tpl_doc_2', 'tpl_proj_2', 'Interactive CRM Demo'),
  },
  {
    id: 'tpl_demo_analytics',
    title: 'Executive Analytics Product Tour',
    description: 'Self-guided interactive prototype exploring dashboard charts and filters without login.',
    category: 'demo',
    tags: ['analytics', 'demo', 'b2b'],
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80',
    stepsCount: 2,
    isPopular: false,
    documentData: createDemoDocument('tpl_doc_2b', 'tpl_proj_2b', 'Executive Analytics Demo'),
  },

  // 3. Pages
  {
    id: 'tpl_page_b2b',
    title: 'Modern B2B AI SaaS Landing Page',
    description: 'Responsive layout with Hero, Features grid, Social proof, and High-conversion CTA.',
    category: 'page',
    tags: ['b2b', 'landing-page', 'saas'],
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop&q=80',
    stepsCount: 5,
    isPopular: true,
    documentData: createPageDocument('tpl_doc_3', 'tpl_proj_3', 'B2B SaaS Landing Page'),
  },

  // 4. Banners
  {
    id: 'tpl_banner_promo',
    title: 'Urgent Flash Sale & Announcement Banner',
    description: 'Vibrant sticky announcement bar with countdown timer and CTA button.',
    category: 'banner',
    tags: ['banner', 'promo', 'announcement'],
    thumbnail: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&auto=format&fit=crop&q=80',
    stepsCount: 1,
    isPopular: true,
    documentData: createBannerDocument('tpl_doc_4', 'tpl_proj_4', 'Flash Sale Banner'),
  },
  {
    id: 'tpl_banner_release',
    title: 'Product Changelog & Update Bar',
    description: 'Clean notification bar informing visitors about system upgrades and new capabilities.',
    category: 'banner',
    tags: ['changelog', 'release', 'banner'],
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80',
    stepsCount: 1,
    isPopular: false,
    documentData: createBannerDocument('tpl_doc_4b', 'tpl_proj_4b', 'Changelog Announcement Bar'),
  },

  // 5. Menus
  {
    id: 'tpl_menu_saas',
    title: 'Universal Modern SaaS Header Menu',
    description: 'Sticky header navigation with dropdown columns, search trigger, and login action.',
    category: 'menu',
    tags: ['menu', 'header', 'navigation'],
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop&q=80',
    stepsCount: 1,
    isPopular: true,
    documentData: createMenuDocument('tpl_doc_menu_1', 'tpl_proj_menu_1', 'Modern SaaS Header Menu'),
  },

  // 6. FAQs
  {
    id: 'tpl_faq_support',
    title: 'Help Center & Searchable FAQ Accordion',
    description: 'Categorized collapsible questions with instant search and rich answers.',
    category: 'faq',
    tags: ['support', 'help', 'faq'],
    thumbnail: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&auto=format&fit=crop&q=80',
    stepsCount: 6,
    isPopular: true,
    documentData: createFaqDocument('tpl_doc_5', 'tpl_proj_5', 'Searchable FAQ'),
  },

  // 7. Popups
  {
    id: 'tpl_popup_lead',
    title: 'Exit-Intent Lead Magnet Modal',
    description: 'High-converting popup capturing email subscribers before they leave.',
    category: 'popup',
    tags: ['popup', 'modal', 'leads'],
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&auto=format&fit=crop&q=80',
    stepsCount: 1,
    isPopular: true,
    documentData: createPopupDocument('tpl_doc_6', 'tpl_proj_6', 'Lead Magnet Popup'),
  },
  {
    id: 'tpl_popup_offer',
    title: 'Flash Discount Promotional Lightbox',
    description: 'Centrally anchored lightbox modal offering 25% discount to annual upgraders.',
    category: 'popup',
    tags: ['discount', 'offer', 'popup'],
    thumbnail: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&auto=format&fit=crop&q=80',
    stepsCount: 1,
    isPopular: false,
    documentData: createPopupDocument('tpl_doc_6b', 'tpl_proj_6b', 'Special Promotion Modal'),
  },

  // 8. Checklists
  {
    id: 'tpl_checklist_gamified',
    title: 'Gamified Product Adoption Checklist',
    description: 'Task checklist with progress bar and celebratory confetti upon completion.',
    category: 'checklist',
    tags: ['checklist', 'adoption', 'gamification'],
    thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=500&auto=format&fit=crop&q=80',
    stepsCount: 4,
    isPopular: true,
    documentData: createChecklistDocument('tpl_doc_7', 'tpl_proj_7', 'Gamified Checklist'),
  },

  // 9. Surveys
  {
    id: 'tpl_survey_nps',
    title: 'Quarterly Executive Net Promoter Score (NPS)',
    description: 'Clean 0-10 score picker with conditional qualitative feedback.',
    category: 'survey',
    tags: ['survey', 'nps', 'feedback'],
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=80',
    stepsCount: 2,
    isPopular: true,
    documentData: createSurveyDocument('tpl_doc_8', 'tpl_proj_8', 'Executive NPS Survey'),
  },

  // 10. Pricing
  {
    id: 'tpl_pricing_tiers',
    title: 'SaaS 3-Tier Subscription Pricing Table',
    description: 'Clean Free, Pro, and Enterprise columns with feature checks and checkout CTAs.',
    category: 'pricing',
    tags: ['pricing', 'plans', 'saas'],
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80',
    stepsCount: 3,
    isPopular: true,
    documentData: createPricingDocument('tpl_doc_pricing_1', 'tpl_proj_pricing_1', 'SaaS Pricing Table'),
  },

  // 11. Testimonials
  {
    id: 'tpl_testimonials_grid',
    title: 'Social Proof & Verified Review Grid',
    description: '3-column card grid with verified customer quotes, 5-star badges, and company roles.',
    category: 'testimonials',
    tags: ['testimonials', 'reviews', 'social-proof'],
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=80',
    stepsCount: 3,
    isPopular: true,
    documentData: createTestimonialsDocument('tpl_doc_test_1', 'tpl_proj_test_1', 'Customer Reviews Grid'),
  },

  // 12. Forms
  {
    id: 'tpl_form_lead_demo',
    title: 'B2B Demo Request & Inquiries Form',
    description: 'Validated form with name, work email, company size, and custom inquiry fields.',
    category: 'form',
    tags: ['form', 'leads', 'contact'],
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop&q=80',
    stepsCount: 1,
    isPopular: true,
    documentData: createFormDocument('tpl_doc_form_1', 'tpl_proj_form_1', 'Demo Request Form'),
  },
];

// Seed Assets
export const SEED_ASSETS: Asset[] = [
  {
    id: 'ast_1',
    organizationId: SEED_ORGANIZATION.id,
    name: 'analytics-dashboard-hero.png',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80',
    type: 'image',
    sizeBytes: 420800,
    altText: 'Overview analytics dashboard screenshot',
    folder: 'screenshots',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ast_2',
    organizationId: SEED_ORGANIZATION.id,
    name: 'team-collaboration.jpg',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
    type: 'image',
    sizeBytes: 680400,
    altText: 'Engineers and designers collaborating',
    folder: 'marketing',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ast_3',
    organizationId: SEED_ORGANIZATION.id,
    name: 'growth-chart-metrics.png',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
    type: 'image',
    sizeBytes: 310500,
    altText: 'Quarterly user growth bar charts',
    folder: 'metrics',
    createdAt: new Date().toISOString(),
  },
];

// Seed Integrations
export const SEED_INTEGRATIONS: IntegrationConfig[] = [
  {
    id: 'int_web',
    organizationId: SEED_ORGANIZATION.id,
    provider: 'custom_domain',
    name: 'Custom Domain & CDN',
    description: 'Host experiences on your white-labeled domain (e.g. guide.yourcompany.com).',
    status: 'connected',
    config: { domain: 'experiences.acme.io', verified: true, sslActive: true },
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'int_ga',
    organizationId: SEED_ORGANIZATION.id,
    provider: 'google_analytics',
    name: 'Google Analytics 4 (GA4)',
    description: 'Stream impression, step completion, and drop-off events directly into GA4.',
    status: 'connected',
    config: { measurementId: 'G-FP9823412', sendEvents: true },
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'int_webhook',
    organizationId: SEED_ORGANIZATION.id,
    provider: 'webhook',
    name: 'Custom Event Webhooks',
    description: 'Receive real-time HTTP POST webhooks on survey submissions and tour finishes.',
    status: 'connected',
    config: { endpointUrl: 'https://api.acme.io/webhooks/flowpilot', secret: 'whsec_••••••••••••••••' },
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'int_slack',
    organizationId: SEED_ORGANIZATION.id,
    provider: 'slack',
    name: 'Slack Alerts',
    description: 'Instant notification in #customer-feedback when negative NPS or feedback arrives.',
    status: 'disconnected',
    config: {},
    updatedAt: new Date().toISOString(),
  },
];
