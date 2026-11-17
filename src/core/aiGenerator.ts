import { DocContent, DocNode, DocumentKind, GLOBAL_FOOTER_SLUG, GLOBAL_HEADER_SLUG, ProjectSettings, ProjectType, Theme } from './schema';
import { VariableDef } from './variables';
import { BLOCK_META } from '../renderer/blockMeta';
import { button, el, El, heading, image, section, text } from '../templates/dsl';
import { THEME_INDIGO, THEME_MIDNIGHT, THEME_EMERALD, THEME_OCEAN, THEME_CORAL, THEME_MONO } from '../templates/themes';
import { photo } from '../templates/assets';

const styledButton = (label: string, href = '#', variant = 'primary', styles: DocNode['styles'] = {}) =>
  el('Button', { props: { text: label, href, variant, action: 'link' }, styles });

export type AiInputMode = 'prompt' | 'url' | 'image';

export interface AiGenerationRequest {
  type: ProjectType;
  mode: AiInputMode;
  prompt?: string;
  url?: string;
  imageDataUrl?: string;
  imageName?: string;
  themeTone?: 'indigo' | 'midnight' | 'emerald' | 'ocean' | 'coral' | 'mono';
  device?: 'desktop' | 'tablet' | 'mobile';
  language?: string;
}

export interface GeneratedProjectPayload {
  title: string;
  type: ProjectType;
  theme: Theme;
  settings: ProjectSettings;
  variables: Record<string, string | number | boolean | Record<string, unknown>[]>;
  variableDefs: VariableDef[];
  documents: {
    kind: DocumentKind;
    title: string;
    slug: string;
    position: number;
    content: DocContent;
  }[];
}

export interface BrandIntelligence {
  brand: string;
  domain: string;
  archetype: string;
  suggestedTheme: 'indigo' | 'midnight' | 'emerald' | 'ocean' | 'coral' | 'mono';
}

/** Utility to clean and extract rich brand intelligence from a URL */
export function extractBrandFromUrl(rawUrl: string): BrandIntelligence {
  try {
    let normalized = rawUrl.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    const parsed = new URL(normalized);
    const domain = parsed.hostname.replace(/^www\./, '');
    const parts = domain.split('.');

    // Multi-segment subdomains: deveshchat.finuro.app -> finuro
    let namePart = parts[0] || 'App';
    if (parts.length >= 3) {
      const secondToLast = parts[parts.length - 2];
      const commonTlds = ['co', 'com', 'org', 'net', 'io', 'gov', 'edu', 'app', 'dev', 'in', 'ai', 'me'];
      if (!commonTlds.includes(secondToLast)) {
        namePart = secondToLast;
      } else if (parts.length >= 4 && !commonTlds.includes(parts[parts.length - 3])) {
        namePart = parts[parts.length - 3];
      }
    }

    // Format brand name (e.g. "finuro" -> "Finuro", "devesh-analytics" -> "Devesh Analytics")
    const brand = namePart
      .replace(/[-_]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Platform';

    const fullText = (domain + parsed.pathname).toLowerCase();
    let archetype = 'Modern Cloud Platform';
    let suggestedTheme: 'indigo' | 'midnight' | 'emerald' | 'ocean' | 'coral' | 'mono' = 'indigo';

    if (/fin|finuro|wealth|invest|trade|stock|sebi|advisory|portfolio|mutual|fund|capital|broker|equity|crypto/i.test(fullText)) {
      archetype = 'FinTech & Wealth Advisory';
      suggestedTheme = 'emerald';
    } else if (/api|apidog|postman|dev|code|sdk|cli|terminal|debug|git|cloud|backend|query|sql/i.test(fullText)) {
      archetype = 'Developer Tools & API Platform';
      suggestedTheme = 'midnight';
    } else if (/pay|stripe|checkout|billing|invoice|gateway|subscription|razorpay|bank/i.test(fullText)) {
      archetype = 'Payments & Financial Infrastructure';
      suggestedTheme = 'indigo';
    } else if (/task|project|linear|jira|notion|board|team|collab|workflow|sprint|crm/i.test(fullText)) {
      archetype = 'Productivity & Team Collaboration';
      suggestedTheme = 'ocean';
    } else if (/ai|gpt|llm|bot|agent|neural|chat|copilot|genai|intelligence/i.test(fullText)) {
      archetype = 'AI & Intelligent Automation';
      suggestedTheme = 'indigo';
    } else if (/shop|store|buy|cart|market|boutique|fashion|cloth|retail|product|shoe/i.test(fullText)) {
      archetype = 'E-Commerce & Digital Store';
      suggestedTheme = 'coral';
    } else if (/health|clinic|med|care|doctor|dental|fit|gym|wellness|yoga|therapy/i.test(fullText)) {
      archetype = 'Healthcare & Wellness';
      suggestedTheme = 'ocean';
    } else if (/edu|learn|course|academy|school|bootcamp|train|tutor|class|masterclass/i.test(fullText)) {
      archetype = 'Education & Academy';
      suggestedTheme = 'indigo';
    } else if (/agency|design|creative|studio|media|art|photo|visual|film|ux|ui/i.test(fullText)) {
      archetype = 'Creative & Digital Agency';
      suggestedTheme = 'mono';
    } else if (/estate|realt|home|house|property|rent|build|architect|interior/i.test(fullText)) {
      archetype = 'Real Estate & Architecture';
      suggestedTheme = 'mono';
    } else if (/food|cafe|dining|restaurant|menu|bistro|bar|coffee|pizza|hotel|travel/i.test(fullText)) {
      archetype = 'Restaurant & Hospitality';
      suggestedTheme = 'coral';
    }

    return { brand, domain, archetype, suggestedTheme };
  } catch {
    return { brand: 'FlowApp', domain: 'flowapp.io', archetype: 'Modern Cloud Platform', suggestedTheme: 'indigo' };
  }
}

interface ArchetypeContent {
  companyName: string;
  tagline: string;
  heroHeadline: string;
  heroSubtitle: string;
  features: { title: string; desc: string; icon: string }[];
  deepFeatures: { title: string; desc: string; tag: string; icon: string }[];
  ratingScore: number;
  ratingReviews: string;
  faq: { q: string; a: string }[];
  plans: { name: string; price: string; period: string; features: string[]; popular?: boolean }[];
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  isAdvisor: boolean;
  isDev: boolean;
}

/** Generates rich, custom brand copy tailored to the exact brand name and industry archetype */
function synthesizeBrandContent(brandName: string, domainName: string, archetype: string, promptText: string): ArchetypeContent {
  const p = promptText.toLowerCase();
  const brand = brandName || 'Platform';
  const domain = domainName || 'platform.com';

  const isAdvisor = archetype === 'FinTech & Wealth Advisory' || /sebi|financial|advisor|research analyst|invest|wealth|stock|finuro/i.test(p);
  const isDev = archetype === 'Developer Tools & API Platform' || /api|developer|code|cli|sdk|terminal|apidog|debug|backend/i.test(p);
  const isPay = archetype === 'Payments & Financial Infrastructure' || /pay|stripe|billing|invoice|checkout/i.test(p);
  const isAi = archetype === 'AI & Intelligent Automation' || /ai|agent|copilot|gpt|llm|automation/i.test(p);
  const isCommerce = archetype === 'E-Commerce & Digital Store' || /shop|store|brand|cloth|retail/i.test(p);
  const isHealth = archetype === 'Healthcare & Wellness' || /health|clinic|med|care|fit|wellness/i.test(p);
  const isEdu = archetype === 'Education & Academy' || /edu|course|learn|academy|bootcamp/i.test(p);
  const isAgency = archetype === 'Creative & Digital Agency' || /agency|design|studio|creative/i.test(p);

  // 1. FinTech & Advisory
  if (isAdvisor) {
    return {
      companyName: brand,
      tagline: 'Disciplined Market Research & Intelligent Portfolio Advisory',
      heroHeadline: `Disciplined Market Research for Consistent Wealth Growth`,
      heroSubtitle: `Direct, research-backed equity calls, swing strategies, and portfolio advisory with full regulatory compliance and transparent audit track records.`,
      features: [
        { title: 'High-Conviction Equity Setups', desc: 'In-depth fundamental and techno-funda setups vetted across sector cycles.', icon: 'TrendingUp' },
        { title: 'SEBI Compliant Disclosures', desc: 'Transparent trade risk parameters, target rationales, and complete regulatory disclosures.', icon: 'ShieldCheck' },
        { title: 'Real-Time Market Alerts', desc: 'Instant WhatsApp and Telegram push notifications for rapid execution and entry/exit updates.', icon: 'Bell' },
        { title: 'Weekly Macro & Sector Audits', desc: 'Deep-dive institutional commentary on Nifty, BankNifty, and high-beta breakout baskets.', icon: 'BarChart3' },
      ],
      deepFeatures: [
        { title: 'Algorithmic Breakout Scanners', desc: 'Proprietary volatility-compression algorithms screening 1,500+ NSE & BSE stocks daily.', tag: 'Screening', icon: 'Cpu' },
        { title: 'Disciplined Risk-Reward Sizing', desc: 'Strict 1:2.5+ minimum risk-reward rules with pre-defined stop loss levels to safeguard capital.', tag: 'Risk Control', icon: 'ShieldAlert' },
        { title: 'Portfolio Rebalancing Alerts', desc: 'Timely profit booking and re-allocation recommendations as macroeconomic trends shift.', tag: 'Advisory', icon: 'RefreshCw' },
        { title: 'Institutional Flow Tracking', desc: 'Real-time FII and DII derivatives positioning and block deal volume cluster analysis.', tag: 'Flow Analytics', icon: 'Activity' },
        { title: 'SEBI Regulatory Transparency', desc: 'Every call logged in transparent publicly verifiable audit logs with zero post-facto edits.', tag: 'Compliance', icon: 'FileCheck' },
        { title: 'Direct Senior Analyst Desk', desc: 'Quarterly 1-on-1 portfolio review calls with registered research analysts.', tag: 'VIP Access', icon: 'Headphones' },
      ],
      ratingScore: 4.9,
      ratingReviews: '1,420+ Active Subscribers',
      faq: [
        { q: 'What is your SEBI registration number?', a: `${brand} operates strictly under SEBI Research Analyst regulations. All research recommendations comply with statutory guidelines.` },
        { q: 'How are trade alerts delivered?', a: 'Trade alerts are dispatched in real-time through private Telegram VIP channels and WhatsApp broadcasting.' },
        { q: 'What is the minimum capital required?', a: 'Our swing trading and portfolio services are tailored for portfolios starting from ₹1,00,000 and above.' },
        { q: 'Do you offer a trial period?', a: 'We publish free weekly macro reports and historical trade logs so you can inspect our methodology before subscribing.' },
      ],
      plans: [
        { name: 'Swing Research', price: '₹4,999', period: '/quarter', features: ['3-5 High Conviction Swing Calls/mo', 'Clear Entry, Stop Loss & Targets', 'Telegram & WhatsApp Alerts'] },
        { name: 'Elite Advisory', price: '₹9,999', period: '/half-year', features: ['All Swing + Long Term Portfolio', 'Sector Allocation Reports', 'Quarterly Portfolio Health Check', 'Direct Analyst Q&A'], popular: true },
        { name: 'Annual Pro', price: '₹17,999', period: '/year', features: ['Full Master Access', 'Macro Strategy Playbooks', 'Priority VIP Desk Access', 'Dedicated Relationship Manager'] },
      ],
      contactEmail: `research@${domain}`,
      contactPhone: '+91 98200 12345',
      contactAddress: 'Financial District, Bandra Kurla Complex (BKC), Mumbai',
      isAdvisor: true,
      isDev: false,
    };
  }

  // 2. Developer Tools & API Platforms (e.g. Apidog, Postman)
  if (isDev) {
    return {
      companyName: brand,
      tagline: 'All-in-One API Development, Mocking & Automated Testing Platform',
      heroHeadline: 'Stop Juggling 5 API Tools. Meet the Unified Platform.',
      heroSubtitle: `Design OpenAPI specifications, execute live debugging, spin up smart mock servers, and run automated CI/CD testing — all in ${brand}.`,
      features: [
        { title: 'Visual API Designer', desc: 'Define OpenAPI 3.1 & JSON Schemas with instant visual validation and branch versioning.', icon: 'Code' },
        { title: 'Zero-Config Mock Servers', desc: 'Simulate dynamic edge cases and custom responses instantly without waiting for backend deployment.', icon: 'Server' },
        { title: 'Automated CI/CD Testing', desc: 'Chain complex multi-stage test scenarios and automate continuous regression testing.', icon: 'CheckCircle' },
        { title: 'Interactive Documentation', desc: 'Auto-generate clean, interactive API reference docs your engineering teams love.', icon: 'FileText' },
      ],
      deepFeatures: [
        { title: 'Git-Native Branching', desc: 'Sync API specs directly to GitHub and GitLab repos with pull request schema diffs.', tag: 'Version Control', icon: 'GitBranch' },
        { title: 'Smart Response Generators', desc: 'Generate mock JSON payloads automatically using AI-assisted schema type inference.', tag: 'Smart Mocks', icon: 'Sparkles' },
        { title: 'CLI & GitHub Actions Runner', desc: 'Run comprehensive test suites in headless CI/CD environments with JUnit reports.', tag: 'CI/CD Automation', icon: 'Terminal' },
        { title: 'WebSocket & gRPC Support', desc: 'Debug binary protocols, streaming SSE, and bi-directional RPC alongside standard REST.', tag: 'Protocols', icon: 'Radio' },
        { title: 'Enterprise SSO & RBAC', desc: 'Enforce SAML 2.0, Okta authentication, role-based access, and detailed audit trails.', tag: 'Security', icon: 'Lock' },
        { title: 'Private Cloud & VPC Agent', desc: 'Deploy lightweight agents to test staging APIs securely inside your private VPC.', tag: 'Deployment', icon: 'Cloud' },
      ],
      ratingScore: 4.95,
      ratingReviews: '35,000+ Developers & Teams',
      faq: [
        { q: 'Can I import Postman and Swagger collections?', a: `Yes! ${brand} provides instant 1-click lossless import from Postman, Swagger 2.0, OpenAPI 3.0/3.1, and HAR files.` },
        { q: 'Is there an on-premise or self-hosted deployment?', a: 'Yes, enterprise plans support private cloud VPC and on-premise air-gapped deployments.' },
        { q: 'Does it support automated CI/CD runs?', a: 'Yes, use our native CLI or GitHub Actions runner to run tests in your continuous integration pipeline.' },
        { q: 'How does mock server generation work?', a: 'Mock servers are generated instantly from your schema with realistic mock data rules.' },
      ],
      plans: [
        { name: 'Developer', price: '$0', period: '/forever', features: ['Up to 5 Projects', 'API Debugging & Mocks', 'Community Support'] },
        { name: 'Team Pro', price: '$29', period: '/seat/mo', features: ['Unlimited Projects', 'Automated CI/CD Test Pipelines', 'Shared Team Workspaces', 'Git Version Sync'], popular: true },
        { name: 'Enterprise', price: '$99', period: '/seat/mo', features: ['SSO SAML / SCIM', 'Self-Hosted Private Runner', 'Audit Logs & RBAC', 'Dedicated 24/7 Support SLA'] },
      ],
      contactEmail: `support@${domain}`,
      contactPhone: '+1 (800) 555-0149',
      contactAddress: '548 Market St, Suite 300, San Francisco, CA',
      isAdvisor: false,
      isDev: true,
    };
  }

  // 3. Payments & Billing (e.g. Stripe)
  if (isPay) {
    return {
      companyName: brand,
      tagline: 'Global Payment Infrastructure & Automated Subscription Billing',
      heroHeadline: `Accept Payments Globally with Zero Friction and 99.999% Reliability`,
      heroSubtitle: `The complete payment engine to process credit cards, local wallets, recurring subscriptions, and global payouts seamlessly with ${brand}.`,
      features: [
        { title: 'Global Payment Methods', desc: 'Accept credit cards, Apple Pay, Google Pay, UPI, and bank debits in 135+ currencies.', icon: 'CreditCard' },
        { title: 'Smart Subscription Billing', desc: 'Automate recurring billing, usage-based metering, prorations, and automated dunning.', icon: 'RefreshCw' },
        { title: 'AI Fraud Prevention', desc: 'Advanced machine learning models that stop fraudsters while optimizing authorization rates.', icon: 'ShieldCheck' },
        { title: 'Instant Global Payouts', desc: 'Route funds and issue instant payouts to contractors, vendors, and marketplace sellers.', icon: 'Zap' },
      ],
      deepFeatures: [
        { title: 'Adaptive 3D Secure', desc: 'Dynamically routes high-risk transactions through authentication while keeping friction zero for safe shoppers.', tag: 'Auth Optimization', icon: 'Shield' },
        { title: 'Multi-Currency Settlement', desc: 'Hold and settle funds in local currencies to avoid unnecessary conversion fees.', tag: 'Treasury', icon: 'Globe' },
        { title: 'Automated Tax Compliance', desc: 'Calculate and collect sales tax, VAT, and GST in over 50 countries with zero code changes.', tag: 'Tax Engine', icon: 'FileText' },
        { title: 'Unified Financial Reporting', desc: 'Reconcile accounting, bank statements, and transactions in automated QuickBooks & Xero syncs.', tag: 'Accounting', icon: 'PieChart' },
        { title: 'Developer SDKs in 8 Languages', desc: 'Drop-in client libraries for React, Vue, Node.js, Python, Ruby, Go, iOS, and Android.', tag: 'Developer First', icon: 'Code' },
        { title: 'PCI-DSS Level 1 Certified', desc: 'Tokenized client-side inputs keep sensitive cardholder data off your web servers entirely.', tag: 'Compliance', icon: 'Lock' },
      ],
      ratingScore: 4.95,
      ratingReviews: '50,000+ Modern Businesses',
      faq: [
        { q: `How fast can I start accepting payments with ${brand}?`, a: 'You can go live in under 10 minutes with our pre-built hosted checkout or drop-in JavaScript SDK.' },
        { q: 'What are the transaction fees?', a: 'We offer competitive flat-rate pricing with volume discounts for businesses processing over $100k/month.' },
        { q: 'Is customer card data stored securely?', a: 'Yes, card data is tokenized and stored in PCI-DSS Level 1 certified vaults.' },
      ],
      plans: [
        { name: 'Starter', price: '2.9% + 30¢', period: '/transaction', features: ['All Payment Methods', 'Hosted Checkout', 'Standard 2-Day Payouts'] },
        { name: 'Growth', price: '$49', period: '/mo + 2.4%', features: ['Automated Billing & Dunning', 'Instant Payouts', 'Priority Fraud Radar', 'Custom Domain Checkout'], popular: true },
        { name: 'Scale & Enterprise', price: 'Custom', period: 'volume tiering', features: ['Interchange-Plus Pricing', 'Dedicated Account Manager', 'Custom Migration Assistance', '99.999% SLA'] },
      ],
      contactEmail: `sales@${domain}`,
      contactPhone: '+1 (888) 555-PAYM',
      contactAddress: 'One Financial Plaza, New York, NY',
      isAdvisor: false,
      isDev: false,
    };
  }

  // 4. AI & Intelligent Automation
  if (isAi) {
    return {
      companyName: brand,
      tagline: 'Autonomous AI Agents & Enterprise Workflow Intelligence',
      heroHeadline: `Supercharge Operations with Autonomous AI Intelligence`,
      heroSubtitle: `Deploy specialized AI copilots that execute multi-step workflows, analyze complex unstructured data, and assist customers 24/7 with ${brand}.`,
      features: [
        { title: 'Multi-Agent Orchestration', desc: 'Coordinate autonomous AI agents that collaborate across tools, APIs, and databases.', icon: 'Bot' },
        { title: 'Private Knowledge Retrieval', desc: 'Connect internal docs, databases, and spreadsheets with zero data leakage or training leaks.', icon: 'Database' },
        { title: 'Real-Time Streaming Voice & Chat', desc: 'Deliver ultra-low latency voice and text interactions powered by next-gen foundation models.', icon: 'Mic' },
        { title: 'Enterprise Guardrails & Evals', desc: 'Enforce deterministic brand tone, hallucination checks, and rigorous safety boundaries.', icon: 'ShieldCheck' },
      ],
      deepFeatures: [
        { title: 'Autonomous Task Execution', desc: 'Agents trigger background workflows, database updates, and email dispatches automatically.', tag: 'Agents', icon: 'Cpu' },
        { title: 'Hybrid Semantic Search', desc: 'Combines dense vector embeddings with BM25 keyword matching for 99.4% retrieval recall.', tag: 'RAG', icon: 'Search' },
        { title: 'Granular Role-Based Access', desc: 'Isolate sensitive internal knowledge bases by user permissions and departments.', tag: 'Security', icon: 'Lock' },
        { title: 'Model-Agnostic LLM Gateway', desc: 'Switch dynamically between Gemini, Claude, and local models to optimize latency and cost.', tag: 'Routing', icon: 'Layers' },
        { title: 'Automated Evaluation Suite', desc: 'Benchmark agent accuracy continuously against curated test datasets before deployment.', tag: 'Evals', icon: 'CheckCircle' },
        { title: 'Zero Data Retention Option', desc: 'Opt out of data logging entirely for HIPAA, SOC-2, and GDPR compliant environments.', tag: 'Privacy', icon: 'FileText' },
      ],
      ratingScore: 4.9,
      ratingReviews: '20,000+ Automated Tasks Daily',
      faq: [
        { q: `Will my data be used to train external models?`, a: `No! ${brand} adheres to strict enterprise privacy: your proprietary data is never used for foundation model training.` },
        { q: 'How do agents connect to our existing tools?', a: 'We provide pre-built integrations for Slack, Google Workspace, GitHub, Postgres, and REST APIs.' },
      ],
      plans: [
        { name: 'Starter Agent', price: '$29', period: '/mo', features: ['5 Active Agents', '50,000 Tokens/mo', 'Slack & Webchat Embeds'] },
        { name: 'Team Intelligence', price: '$99', period: '/mo', features: ['25 Active Agents', '500,000 Tokens/mo', 'Custom Vector Databases', 'Webhook Triggers'], popular: true },
        { name: 'Enterprise Cluster', price: '$299', period: '/mo', features: ['Unlimited Agents', 'Dedicated GPU Inference', 'SOC-2 Type II & HIPAA', 'Dedicated AI Engineer'] },
      ],
      contactEmail: `ai@${domain}`,
      contactPhone: '+1 (800) 555-0182',
      contactAddress: '701 Tech Boulevard, Austin, TX',
      isAdvisor: false,
      isDev: false,
    };
  }

  // 5. General SaaS / Tailored Universal Default
  return {
    companyName: brand,
    tagline: `Intelligent Cloud Platform Engineered for ${brand}`,
    heroHeadline: `Accelerate Growth and Automate Experiences with ${brand}`,
    heroSubtitle: `The complete platform to launch high-converting digital experiences, automate customer interactions, and scale business operations seamlessly.`,
    features: [
      { title: 'Autonomous Workflows', desc: `Automate end-to-end customer touchpoints and reduce manual operational overhead with ${brand}.`, icon: 'Sparkles' },
      { title: 'Real-Time Insights & Telemetry', desc: 'Track key performance indicators, user engagement, and conversion funnels live.', icon: 'BarChart3' },
      { title: 'Enterprise-Grade Security', desc: 'Built-in 256-bit encryption, role-based permissions, and 99.99% infrastructure uptime.', icon: 'ShieldCheck' },
      { title: 'Seamless Third-Party Ecosystem', desc: 'Integrate directly with modern CRMs, email service providers, and cloud databases.', icon: 'Globe' },
    ],
    deepFeatures: [
      { title: 'Instant Cloud Deployment', desc: 'Publish globally across distributed edge networks in under 50 milliseconds.', tag: 'Performance', icon: 'Zap' },
      { title: 'Custom Branding & Theming', desc: 'Align every pixel to your brand guidelines with complete typography and color token control.', tag: 'Branding', icon: 'Palette' },
      { title: 'Multi-Tenant Workspaces', desc: 'Collaborate with cross-functional teams with granular permissions and activity logs.', tag: 'Teams', icon: 'Users' },
      { title: 'Automated Daily Backups', desc: 'Point-in-time document restore with continuous automated disaster recovery.', tag: 'Reliability', icon: 'Database' },
      { title: 'High-Converting Integrations', desc: 'Native Webhooks, REST API endpoints, and Zapier triggers for instant connectivity.', tag: 'Ecosystem', icon: 'Layers' },
      { title: 'Dedicated Customer Support', desc: '24/7 technical assistance and dedicated onboarding engineers for your team.', tag: 'Support', icon: 'Headphones' },
    ],
    ratingScore: 4.9,
    ratingReviews: '12,500+ Happy Customers',
    faq: [
      { q: `What makes ${brand} different from alternatives?`, a: `${brand} combines high performance, flexible customization, and built-in automation in a unified interface.` },
      { q: 'Can I cancel or change plans at any time?', a: 'Yes! Subscriptions can be modified or cancelled at any time from your account settings with zero penalties.' },
      { q: 'Do you offer custom enterprise onboarding?', a: 'Yes, our solutions architects provide dedicated migration assistance and onboarding workshops.' },
    ],
    plans: [
      { name: 'Starter', price: '$19', period: '/mo', features: ['15 Active Projects', '25,000 Monthly Impressions', 'Custom Branding', 'Email Support'] },
      { name: 'Pro Growth', price: '$49', period: '/mo', features: ['100 Active Projects', '250,000 Monthly Impressions', 'Custom Domains & SSL', 'Remove Watermark', 'Priority Support'], popular: true },
      { name: 'Enterprise', price: '$149', period: '/mo', features: ['Unlimited Projects', '1,000,000+ Impressions', '30 Team Workspaces', 'Custom SLA & Onboarding'] },
    ],
    contactEmail: `hello@${domain}`,
    contactPhone: '+1 (800) 555-0120',
    contactAddress: '100 Innovation Way, Suite 400, Seattle, WA',
    isAdvisor: false,
    isDev: false,
  };
}

/** Theme resolver */
function resolveTheme(tone?: AiGenerationRequest['themeTone']): Theme {
  switch (tone) {
    case 'midnight': return THEME_MIDNIGHT.theme;
    case 'emerald': return THEME_EMERALD.theme;
    case 'ocean': return THEME_OCEAN.theme;
    case 'coral': return THEME_CORAL.theme;
    case 'mono': return THEME_MONO.theme;
    case 'indigo':
    default:
      return THEME_INDIGO.theme;
  }
}

/** Converts an El tree into schema-valid DocContent */
export function synthesizeContent(prefix: string, elements: El[], rootStyles: DocNode['styles'] = {}): DocContent {
  const nodes: DocContent['nodes'] = {};
  let counter = 0;

  const add = (element: El): string => {
    counter += 1;
    const id = `${prefix}${counter}`;
    const meta = BLOCK_META[element.type] ?? BLOCK_META['Box'];
    nodes[id] = {
      id,
      type: element.type,
      name: element.name,
      props: { ...(meta?.defaultProps ? structuredClone(meta.defaultProps) : {}), ...element.props },
      styles: element.styles ?? {},
      children: [],
    };
    if (element.responsive) nodes[id].responsive = element.responsive;
    if (element.repeat) nodes[id].repeat = element.repeat;
    if (element.showIf) nodes[id].showIf = element.showIf;
    nodes[id].children = (element.children ?? []).map(add);
    return id;
  };

  const rootId = add(el('Root', { styles: rootStyles }, elements));
  return { rootId, nodes };
}

/**
 * Main AI Project Synthesizer
 * Generates production-ready Websites (multi-page with global header/footer), Pages, Tours, and Modules from Prompts, URLs, or Uploaded Images.
 */
export async function generateProjectWithAi(request: AiGenerationRequest, organizationId: string): Promise<GeneratedProjectPayload> {
  const mode = request.mode;
  let promptText = request.prompt?.trim() || '';
  let brandName = 'FlowApp';
  let domainName = 'flowapp.io';
  let archetype = 'Modern Cloud Platform';
  let suggestedThemeTone: AiGenerationRequest['themeTone'] = request.themeTone || 'indigo';

  // 1. Process URL mode
  if (mode === 'url' && request.url) {
    const intel = extractBrandFromUrl(request.url);
    brandName = intel.brand;
    domainName = intel.domain;
    archetype = intel.archetype;
    if (!request.themeTone) {
      suggestedThemeTone = intel.suggestedTheme;
    }
  } else if (promptText) {
    // Try to derive brand from prompt if specified
    const nameMatch = promptText.match(/(?:called|named|brand|for)\s+([A-Z][A-Za-z0-9_-]+)/);
    if (nameMatch && nameMatch[1]) {
      brandName = nameMatch[1];
      domainName = `${brandName.toLowerCase()}.com`;
    }
  }

  const data = synthesizeBrandContent(brandName, domainName, archetype, promptText);
  const theme = resolveTheme(request.themeTone || suggestedThemeTone);
  const isTour = request.type === 'tour';
  const isWebsite = request.type === 'website';
  const heroImageSrc = request.imageDataUrl || photo('dashboard', 1200, 750);

  // Build Variables Record
  const variables: Record<string, string | number | boolean | Record<string, unknown>[]> = {
    'company.name': data.companyName,
    'company.domain': domainName,
    'company.tagline': data.tagline,
    'hero.title': data.heroHeadline,
    'hero.subtitle': data.heroSubtitle,
    'hero.cta_primary': isTour ? 'Start Interactive Tour' : 'Get Started for Free',
    'hero.cta_secondary': isTour ? 'Skip & Explore' : 'Book a Live Demo',
    'rating.score': data.ratingScore,
    'rating.reviews': data.ratingReviews,
    'features': data.features,
    'faqs': data.faq,
    'pricing.plans': data.plans,
    'contact.email': data.contactEmail,
    'contact.phone': data.contactPhone,
    'contact.address': data.contactAddress,
  };

  const variableDefs: VariableDef[] = [
    { key: 'company.name', label: 'Company Name', type: 'text', default: data.companyName, group: 'Branding' },
    { key: 'company.tagline', label: 'Tagline', type: 'text', default: data.tagline, group: 'Branding' },
    { key: 'hero.title', label: 'Hero Headline', type: 'text', default: data.heroHeadline, group: 'Hero' },
    { key: 'hero.subtitle', label: 'Hero Subtitle', type: 'longtext', default: data.heroSubtitle, group: 'Hero' },
    { key: 'hero.cta_primary', label: 'Primary CTA Button', type: 'text', default: String(variables['hero.cta_primary']), group: 'Hero' },
    { key: 'rating.score', label: 'Star Rating Score', type: 'number', default: data.ratingScore, group: 'Social Proof' },
    { key: 'rating.reviews', label: 'Review Count Text', type: 'text', default: data.ratingReviews, group: 'Social Proof' },
    { key: 'contact.email', label: 'Contact Email', type: 'text', default: data.contactEmail, group: 'Contact' },
    { key: 'contact.phone', label: 'Contact Phone', type: 'text', default: data.contactPhone, group: 'Contact' },
  ];

  // ---------------------------------------------------------------------------
  // 1. TOUR GENERATION
  // ---------------------------------------------------------------------------
  if (isTour) {
    const tourElements: El[] = [
      el('TourStep', {
        props: {
          title: `Welcome to ${data.companyName}`,
          subtitle: `Let us take you on a quick interactive walkthrough of our core platform features.`,
          layout: 'modal',
          placement: 'center',
          backdrop: true,
          nextLabel: 'Start Walkthrough →',
          skipLabel: 'Skip Tour',
        },
      }, [
        el('Box', { styles: { textAlign: 'center', gap: '16px' } }, [
          image(heroImageSrc, 'Platform preview', { borderRadius: '12px', maxHeight: '220px', objectFit: 'cover' }),
          heading(`Experience the power of ${data.companyName}`, 'h3', { fontSize: '1.25rem', fontWeight: 700 }),
          text(data.tagline, { color: 'var(--fp-muted)', fontSize: '0.9375rem' }),
        ]),
      ]),
      el('TourStep', {
        props: {
          title: 'Explore Feature Pillars',
          subtitle: 'Access your analytics, workspaces, and automated workflows right from the main navigation.',
          layout: 'tooltip',
          placement: 'bottom',
          targetSelector: 'nav',
          nextLabel: 'Next Feature →',
          skipLabel: 'Skip',
        },
      }),
      el('TourStep', {
        props: {
          title: 'Live Interactive Controls',
          subtitle: 'Adjust filters, monitor performance, and trigger automated actions with 1 click.',
          layout: 'tooltip',
          placement: 'right',
          targetSelector: 'main',
          nextLabel: 'Final Step →',
          skipLabel: 'Skip',
        },
      }),
      el('TourStep', {
        props: {
          title: `You are ready to build with ${data.companyName}!`,
          subtitle: 'Explore our documentation or get started right away with our free tier.',
          layout: 'slideout',
          placement: 'bottom-right',
          nextLabel: 'Get Started Now 🚀',
          nextHref: '#get-started',
        },
      }),
    ];

    const tourContent = synthesizeContent('tour', tourElements, {
      minHeight: '100vh',
      background: 'var(--fp-background)',
      color: 'var(--fp-text)',
    });

    return {
      title: `${data.companyName} Interactive Tour`,
      type: 'tour',
      theme,
      settings: {
        targetDevice: request.device || 'desktop',
        targetLanguage: request.language || 'en',
      },
      variables,
      variableDefs,
      documents: [
        {
          kind: 'experience',
          title: 'Interactive Tour',
          slug: '',
          position: 0,
          content: tourContent,
        },
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // 2. MULTI-PAGE WEBSITE GENERATION
  // ---------------------------------------------------------------------------
  if (isWebsite) {
    // A. Global Header
    const headerDoc = {
      kind: 'global' as DocumentKind,
      title: 'Header',
      slug: GLOBAL_HEADER_SLUG,
      position: -1,
      content: synthesizeContent('hdr', [
        el('Navbar', {
          props: {
            brand: '{{company.name}}',
            logo: '',
            ctaText: '{{hero.cta_primary}}',
            ctaHref: '/pricing',
          },
          styles: {
            backgroundColor: 'var(--fp-background)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          },
        }),
      ]),
    };

    // B. Global Footer
    const footerDoc = {
      kind: 'global' as DocumentKind,
      title: 'Footer',
      slug: GLOBAL_FOOTER_SLUG,
      position: 99,
      content: synthesizeContent('ftr', [
        section([
          el('Grid', {
            styles: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '32px' },
            responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
          }, [
            el('Box', { styles: { gap: '10px' } }, [
              heading('{{company.name}}', 'h4', { fontSize: '1.25rem', fontWeight: 800 }),
              text('{{company.tagline}}', { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
              text(`© ${new Date().getFullYear()} {{company.name}}. All rights reserved.`, { fontSize: '0.8125rem', color: 'var(--fp-muted)' }),
            ]),
            el('Box', { styles: { gap: '8px', alignItems: 'flex-start' } }, [
              heading('Solutions', 'h4', { fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }),
              button('Platform Overview', '/features', 'link'),
              button('Transparent Plans', '/pricing', 'link'),
              button('Client Testimonials', '/#testimonials', 'link'),
              button('Help Center & FAQs', '/#faq', 'link'),
            ]),
            el('Box', { styles: { gap: '8px', alignItems: 'flex-start' } }, [
              heading('Company', 'h4', { fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }),
              button('Contact Team', '/contact', 'link'),
              button('Privacy Policy', '#privacy', 'link'),
              button('Terms of Service', '#terms', 'link'),
              button('Regulatory Disclosures', '#disclosures', 'link'),
            ]),
            el('Box', { styles: { gap: '8px', alignItems: 'flex-start' } }, [
              heading('Contact', 'h4', { fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }),
              text('{{contact.email}}', { fontSize: '0.875rem', color: 'var(--fp-primary)', fontWeight: 600 }),
              text('{{contact.phone}}', { fontSize: '0.875rem', color: 'var(--fp-muted)' }),
              text('{{contact.address}}', { fontSize: '0.8125rem', color: 'var(--fp-muted)' }),
            ]),
          ]),
        ], { backgroundColor: 'var(--fp-surface)', paddingTop: '56px', paddingBottom: '56px' }),
      ]),
    };

    // C. Home Page Elements
    const homeElements: El[] = [
      // Hero Section
      section([
        el('Box', { styles: { textAlign: 'center', maxWidth: '820px', margin: '0 auto', gap: '20px' } }, [
          el('Box', { styles: { display: 'inline-flex', padding: '4px 14px', borderRadius: '9999px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--fp-primary)', fontSize: '0.75rem', fontWeight: 800, margin: '0 auto', letterSpacing: '0.05em' } }, [
            text(`✨ INTRODUCING ${data.companyName.toUpperCase()}`),
          ]),
          heading(data.heroHeadline, 'h1', {
            fontSize: '3.5rem',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            animation: 'shimmer 4s ease-in-out infinite alternate',
          }),
          text(data.heroSubtitle, {
            color: 'var(--fp-muted)',
            fontSize: '1.25rem',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: '0 auto',
          }),
          el('Row', { styles: { gap: '16px', justifyContent: 'center', marginTop: '12px' } }, [
            styledButton('{{hero.cta_primary}}', '/pricing', 'primary', { padding: '14px 32px', fontSize: '1rem', fontWeight: 700 }),
            styledButton('Explore Features →', '/features', 'secondary', { padding: '14px 28px', fontSize: '1rem' }),
          ]),
          el('Row', { styles: { justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' } }, [
            el('Rating', { props: { rating: data.ratingScore, maxRating: 5, starColor: '#f59e0b' } }),
            text(`${data.ratingScore} / 5 (${data.ratingReviews})`, { color: 'var(--fp-muted)', fontSize: '0.875rem', fontWeight: 600 }),
          ]),
        ]),
        // Browser Mockup Showcase Card
        el('Box', {
          styles: {
            background: 'var(--fp-surface)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '20px',
            padding: '24px',
            marginTop: '48px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.15)',
          },
        }, [
          el('Row', { styles: { justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' } }, [
            el('Row', { styles: { gap: '8px', alignItems: 'center' } }, [
              el('Box', { styles: { width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 } }),
              el('Box', { styles: { width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 } }),
              el('Box', { styles: { width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', flexShrink: 0 } }),
              text(`${data.companyName} Live Workspace & Analytics`, { fontSize: '0.8125rem', color: 'var(--fp-muted)', marginLeft: '12px' }),
            ]),
            el('Row', { styles: { gap: '8px', alignItems: 'center' } }, [
              el('Badge', { props: { text: 'Active & Verified', tone: 'success' } }),
              el('Badge', { props: { text: '99.99% Uptime', tone: 'neutral' } }),
            ]),
          ]),
          image(heroImageSrc, `${data.companyName} Dashboard Preview`, {
            width: '100%',
            maxHeight: '440px',
            objectFit: 'cover',
            borderRadius: '12px',
            marginTop: '16px',
          }),
        ]),
      ], { paddingTop: '60px', paddingBottom: '60px' }),

      // Features Overview Section
      section([
        el('Box', { styles: { textAlign: 'center', gap: '12px', maxWidth: '640px', margin: '0 auto 48px auto' } }, [
          el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: 'var(--fp-primary)', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
            text('CORE CAPABILITIES'),
          ]),
          heading('Engineered for High-Velocity Execution', 'h2', { fontSize: '2.25rem', fontWeight: 800 }),
          text(`Discover why thousands trust ${data.companyName} for critical operations.`, { color: 'var(--fp-muted)', fontSize: '1rem' }),
        ]),
        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px' },
          responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        }, [
          ...data.features.map((feat) =>
            el('Card', {
              styles: {
                background: 'var(--fp-surface)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '28px',
                gap: '12px',
                display: 'flex',
                flexDirection: 'column',
              },
            }, [
              el('Box', { styles: { width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fp-primary)', marginBottom: '8px' } }, [
                el('Icon', { props: { name: feat.icon || 'Sparkles' } }),
              ]),
              heading(feat.title, 'h3', { fontSize: '1.25rem', fontWeight: 700 }),
              text(feat.desc, { color: 'var(--fp-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }),
            ])
          ),
        ]),
      ], { id: 'features', paddingTop: '60px', paddingBottom: '60px' }),

      // Testimonials with 5-Star Ratings
      section([
        el('Box', { styles: { textAlign: 'center', gap: '12px', maxWidth: '640px', margin: '0 auto 40px auto' } }, [
          el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
            text('VERIFIED REVIEWS'),
          ]),
          heading('Loved by Fast-Growing Teams', 'h2', { fontSize: '2.25rem', fontWeight: 800 }),
          text(`See what clients achieve daily with ${data.companyName}.`, { color: 'var(--fp-muted)', fontSize: '1rem' }),
        ]),
        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' },
          responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        }, [
          el('Card', { styles: { background: 'var(--fp-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', gap: '14px', display: 'flex', flexDirection: 'column' } }, [
            el('Rating', { props: { rating: 5, maxRating: 5, starColor: '#f59e0b' } }),
            text(`"The speed and clarity provided by ${data.companyName} transformed our execution. We 4x-ed our performance within 2 weeks."`, { fontSize: '0.9375rem', lineHeight: 1.6, fontStyle: 'italic' }),
            el('Row', { styles: { alignItems: 'center', gap: '10px', marginTop: 'auto' } }, [
              el('Avatar', { props: { name: 'Sarah Lin', role: 'Head of Growth' } }),
            ]),
          ]),
          el('Card', { styles: { background: 'var(--fp-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', gap: '14px', display: 'flex', flexDirection: 'column' } }, [
            el('Rating', { props: { rating: 5, maxRating: 5, starColor: '#f59e0b' } }),
            text(`"Clean interface, disciplined execution, and rock-solid reliability. ${data.companyName} is indispensable to our daily routine."`, { fontSize: '0.9375rem', lineHeight: 1.6, fontStyle: 'italic' }),
            el('Row', { styles: { alignItems: 'center', gap: '10px', marginTop: 'auto' } }, [
              el('Avatar', { props: { name: 'Vikram Mehta', role: 'Managing Partner' } }),
            ]),
          ]),
          el('Card', { styles: { background: 'var(--fp-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', gap: '14px', display: 'flex', flexDirection: 'column' } }, [
            el('Rating', { props: { rating: 5, maxRating: 5, starColor: '#f59e0b' } }),
            text(`"Exceptional support and transparent deliverables. Best investment decision we made this year."`, { fontSize: '0.9375rem', lineHeight: 1.6, fontStyle: 'italic' }),
            el('Row', { styles: { alignItems: 'center', gap: '10px', marginTop: 'auto' } }, [
              el('Avatar', { props: { name: 'Elena Rostova', role: 'Founder & CEO' } }),
            ]),
          ]),
        ]),
      ], { id: 'testimonials', paddingTop: '40px', paddingBottom: '60px' }),

      // Pricing Plans
      section([
        el('Box', { styles: { textAlign: 'center', gap: '12px', maxWidth: '640px', margin: '0 auto 40px auto' } }, [
          el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: 'var(--fp-primary)', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
            text('TRANSPARENT PLANS'),
          ]),
          heading('Simple, Predictable Investment', 'h2', { fontSize: '2.25rem', fontWeight: 800 }),
          text('No hidden contracts. Upgrade, downgrade, or cancel at any time with confidence.', { color: 'var(--fp-muted)', fontSize: '1rem' }),
        ]),
        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px', alignItems: 'stretch' },
          responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        }, [
          ...data.plans.map((plan) =>
            el('Card', {
              styles: {
                background: plan.popular ? 'linear-gradient(180deg, rgba(99,102,241,0.15) 0%, var(--fp-surface) 100%)' : 'var(--fp-surface)',
                border: plan.popular ? '2px solid var(--fp-primary)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
              },
            }, [
              ...(plan.popular
                ? [
                    el('Box', { styles: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--fp-primary)', color: '#fff', fontSize: '0.6875rem', fontWeight: 800, padding: '3px 12px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, [
                      text('Most Popular'),
                    ]),
                  ]
                : []),
              heading(plan.name, 'h3', { fontSize: '1.25rem', fontWeight: 800 }),
              el('Row', { styles: { alignItems: 'baseline', gap: '4px' } }, [
                heading(plan.price, 'h2', { fontSize: '2.5rem', fontWeight: 900 }),
                text(plan.period, { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
              ]),
              el('Box', { styles: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', flexGrow: 1 } }, [
                ...plan.features.map((feat) =>
                  el('Row', { styles: { alignItems: 'center', gap: '8px', fontSize: '0.875rem' } }, [
                    el('Box', { styles: { color: '#10b981', fontWeight: 800 } }, [text('✓')]),
                    text(feat, { color: 'var(--fp-text)' }),
                  ])
                ),
              ]),
              button(plan.popular ? 'Get Started Pro' : 'Choose Plan', '/pricing', plan.popular ? 'primary' : 'secondary'),
            ])
          ),
        ]),
      ], { id: 'pricing', paddingTop: '40px', paddingBottom: '60px' }),

      // FAQ
      section([
        el('Box', { styles: { textAlign: 'center', gap: '12px', maxWidth: '640px', margin: '0 auto 40px auto' } }, [
          el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: 'var(--fp-primary)', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
            text('FAQS'),
          ]),
          heading('Frequently Asked Questions', 'h2', { fontSize: '2.25rem', fontWeight: 800 }),
          text(`Everything you need to know about getting started with ${data.companyName}.`, { color: 'var(--fp-muted)', fontSize: '1rem' }),
        ]),
        el('Box', { styles: { maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' } }, [
          ...data.faq.map((item) =>
            el('Card', { styles: { background: 'var(--fp-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px 24px', gap: '8px' } }, [
              heading(item.q, 'h4', { fontSize: '1.0625rem', fontWeight: 700 }),
              text(item.a, { color: 'var(--fp-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }),
            ])
          ),
        ]),
      ], { id: 'faq', paddingTop: '40px', paddingBottom: '60px' }),
    ];

    // D. Features Page Elements
    const featuresPageElements: El[] = [
      section([
        el('Box', { styles: { textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px auto', gap: '16px' } }, [
          el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: 'var(--fp-primary)', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
            text('PLATFORM ARCHITECTURE'),
          ]),
          heading(`Everything Built into ${data.companyName}`, 'h1', { fontSize: '3rem', fontWeight: 900 }),
          text('Deep dive into our enterprise architecture, compliance safeguards, and automated execution engines.', { color: 'var(--fp-muted)', fontSize: '1.125rem' }),
        ]),
        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px' },
          responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        }, [
          ...data.deepFeatures.map((feat) =>
            el('Card', {
              styles: {
                background: 'var(--fp-surface)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '28px',
                gap: '14px',
                display: 'flex',
                flexDirection: 'column',
              },
            }, [
              el('Row', { styles: { justifyContent: 'space-between', alignItems: 'center' } }, [
                el('Box', { styles: { width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fp-primary)' } }, [
                  el('Icon', { props: { name: feat.icon } }),
                ]),
                el('Badge', { props: { text: feat.tag, tone: 'primary' } }),
              ]),
              heading(feat.title, 'h3', { fontSize: '1.25rem', fontWeight: 700 }),
              text(feat.desc, { color: 'var(--fp-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }),
            ])
          ),
        ]),
        el('Box', { styles: { textAlign: 'center', marginTop: '60px' } }, [
          styledButton('View Transparent Pricing Plans →', '/pricing', 'primary', { padding: '14px 32px' }),
        ]),
      ], { paddingTop: '60px', paddingBottom: '80px' }),
    ];

    // E. Pricing Page Elements
    const pricingPageElements: El[] = [
      section([
        el('Box', { styles: { textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px auto', gap: '16px' } }, [
          el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: 'var(--fp-primary)', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
            text('PLANS & MEMBERSHIPS'),
          ]),
          heading('Choose the Right Plan for You', 'h1', { fontSize: '3rem', fontWeight: 900 }),
          text('Transparent pricing backed by strict risk guardrails and dedicated support.', { color: 'var(--fp-muted)', fontSize: '1.125rem' }),
        ]),
        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px', alignItems: 'stretch' },
          responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        }, [
          ...data.plans.map((plan) =>
            el('Card', {
              styles: {
                background: plan.popular ? 'linear-gradient(180deg, rgba(99,102,241,0.15) 0%, var(--fp-surface) 100%)' : 'var(--fp-surface)',
                border: plan.popular ? '2px solid var(--fp-primary)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '36px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
              },
            }, [
              ...(plan.popular
                ? [
                    el('Box', { styles: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--fp-primary)', color: '#fff', fontSize: '0.6875rem', fontWeight: 800, padding: '3px 12px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, [
                      text('Recommended'),
                    ]),
                  ]
                : []),
              heading(plan.name, 'h3', { fontSize: '1.375rem', fontWeight: 800 }),
              el('Row', { styles: { alignItems: 'baseline', gap: '4px' } }, [
                heading(plan.price, 'h2', { fontSize: '2.75rem', fontWeight: 900 }),
                text(plan.period, { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
              ]),
              el('Box', { styles: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', flexGrow: 1 } }, [
                ...plan.features.map((feat) =>
                  el('Row', { styles: { alignItems: 'center', gap: '10px', fontSize: '0.9375rem' } }, [
                    el('Box', { styles: { color: '#10b981', fontWeight: 800 } }, [text('✓')]),
                    text(feat, { color: 'var(--fp-text)' }),
                  ])
                ),
              ]),
              button(plan.popular ? 'Subscribe Now' : 'Select Plan', '/contact', plan.popular ? 'primary' : 'secondary'),
            ])
          ),
        ]),
      ], { paddingTop: '60px', paddingBottom: '80px' }),
    ];

    // F. Contact Page Elements
    const contactPageElements: El[] = [
      section([
        el('Box', { styles: { textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px auto', gap: '16px' } }, [
          el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: 'var(--fp-primary)', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
            text('GET IN TOUCH'),
          ]),
          heading(`Connect with ${data.companyName}`, 'h1', { fontSize: '3rem', fontWeight: 900 }),
          text('Our advisory and technical teams are here to assist with onboarding, questions, or custom enterprise requirements.', { color: 'var(--fp-muted)', fontSize: '1.125rem' }),
        ]),
        el('Grid', {
          styles: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '32px' },
          responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
        }, [
          el('Card', {
            styles: {
              background: 'var(--fp-surface)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            },
          }, [
            heading('Direct Inquiry Channels', 'h3', { fontSize: '1.375rem', fontWeight: 700 }),
            el('Box', { styles: { gap: '6px' } }, [
              text('OFFICIAL EMAIL', { fontSize: '0.6875rem', fontWeight: 800, color: 'var(--fp-muted)', letterSpacing: '0.05em' }),
              text('{{contact.email}}', { fontSize: '1.125rem', color: 'var(--fp-primary)', fontWeight: 700 }),
            ]),
            el('Box', { styles: { gap: '6px' } }, [
              text('TELEPHONE & WHATSAPP SUPPORT', { fontSize: '0.6875rem', fontWeight: 800, color: 'var(--fp-muted)', letterSpacing: '0.05em' }),
              text('{{contact.phone}}', { fontSize: '1.125rem', fontWeight: 600 }),
            ]),
            el('Box', { styles: { gap: '6px' } }, [
              text('REGISTERED OFFICE', { fontSize: '0.6875rem', fontWeight: 800, color: 'var(--fp-muted)', letterSpacing: '0.05em' }),
              text('{{contact.address}}', { fontSize: '0.9375rem', color: 'var(--fp-muted)' }),
            ]),
          ]),
          el('Card', {
            styles: {
              background: 'var(--fp-surface)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            },
          }, [
            heading('Schedule a Consultation', 'h3', { fontSize: '1.375rem', fontWeight: 700 }),
            text('Fill in your details and a senior advisor will reach out within 2 hours during market hours.', { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
            el('Box', { styles: { display: 'flex', flexDirection: 'column', gap: '12px' } }, [
              el('Input', { props: { label: 'Full Name', placeholder: 'Enter your name' } }),
              el('Input', { props: { label: 'Email Address', placeholder: 'you@example.com' } }),
              el('Input', { props: { label: 'Phone Number', placeholder: '+91 98765 43210' } }),
              styledButton('Send Inquiry →', '#', 'primary', { padding: '12px 24px', width: '100%' }),
            ]),
          ]),
        ]),
      ], { paddingTop: '60px', paddingBottom: '80px' }),
    ];

    return {
      title: `${data.companyName} Official Website`,
      type: 'website',
      theme,
      settings: {
        targetDevice: request.device || 'desktop',
        targetLanguage: request.language || 'en',
      },
      variables,
      variableDefs,
      documents: [
        headerDoc,
        {
          kind: 'page',
          title: 'Home',
          slug: '',
          position: 0,
          content: synthesizeContent('hm', homeElements),
        },
        {
          kind: 'page',
          title: 'Features',
          slug: 'features',
          position: 1,
          content: synthesizeContent('feat', featuresPageElements),
        },
        {
          kind: 'page',
          title: 'Pricing',
          slug: 'pricing',
          position: 2,
          content: synthesizeContent('prc', pricingPageElements),
        },
        {
          kind: 'page',
          title: 'Contact',
          slug: 'contact',
          position: 3,
          content: synthesizeContent('cnt', contactPageElements),
        },
        footerDoc,
      ],
    };
  }

  // ---------------------------------------------------------------------------
  // 3. LANDING PAGE & OTHER MODULE GENERATION (Single Page)
  // ---------------------------------------------------------------------------
  const pageElements: El[] = [
    // Top Brand Bar
    el('Row', { styles: { justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' } }, [
      heading(data.companyName, 'h3', { fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }),
      el('Row', { styles: { gap: '12px', alignItems: 'center' } }, [
        button('Features', '#features', 'ghost'),
        button('Testimonials', '#testimonials', 'ghost'),
        button('Pricing', '#pricing', 'ghost'),
        button('FAQ', '#faq', 'ghost'),
        styledButton('{{hero.cta_primary}}', '#pricing', 'primary', { padding: '8px 20px', fontSize: '0.875rem' }),
      ]),
    ]),

    // Hero Section with Ticker and Mockup
    section([
      el('Box', { styles: { textAlign: 'center', maxWidth: '800px', margin: '0 auto', gap: '20px' } }, [
        el('Box', { styles: { display: 'inline-flex', padding: '4px 14px', borderRadius: '9999px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--fp-primary)', fontSize: '0.75rem', fontWeight: 800, margin: '0 auto', letterSpacing: '0.05em' } }, [
          text(`✨ INTRODUCING ${data.companyName.toUpperCase()}`),
        ]),
        heading(data.heroHeadline, 'h1', {
          fontSize: '3.5rem',
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          animation: 'shimmer 4s ease-in-out infinite alternate',
        }),
        text(data.heroSubtitle, {
          color: 'var(--fp-muted)',
          fontSize: '1.25rem',
          lineHeight: 1.6,
          maxWidth: '680px',
          margin: '0 auto',
        }),
        el('Row', { styles: { gap: '16px', justifyContent: 'center', marginTop: '12px' } }, [
          styledButton('{{hero.cta_primary}}', '#pricing', 'primary', { padding: '14px 32px', fontSize: '1rem', fontWeight: 700 }),
          styledButton('{{hero.cta_secondary}}', '#features', 'secondary', { padding: '14px 28px', fontSize: '1rem' }),
        ]),
        el('Row', { styles: { justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' } }, [
          el('Rating', { props: { rating: data.ratingScore, maxRating: 5, starColor: '#f59e0b' } }),
          text(`${data.ratingScore} / 5 (${data.ratingReviews})`, { color: 'var(--fp-muted)', fontSize: '0.875rem', fontWeight: 600 }),
        ]),
      ]),

      // Browser Mockup Showcase Card
      el('Box', {
        styles: {
          background: 'var(--fp-surface)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px',
          padding: '24px',
          marginTop: '48px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.15)',
        },
      }, [
        el('Row', { styles: { justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' } }, [
          el('Row', { styles: { gap: '8px', alignItems: 'center' } }, [
            el('Box', { styles: { width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 } }),
            el('Box', { styles: { width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 } }),
            el('Box', { styles: { width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', flexShrink: 0 } }),
            text(`${data.companyName} Live Playground & Analytics`, { fontSize: '0.8125rem', color: 'var(--fp-muted)', marginLeft: '12px' }),
          ]),
          el('Row', { styles: { gap: '8px', alignItems: 'center' } }, [
            el('Badge', { props: { text: '200 OK', tone: 'success' } }),
            el('Badge', { props: { text: '18ms', tone: 'neutral' } }),
          ]),
        ]),
        image(heroImageSrc, `${data.companyName} Dashboard Preview`, {
          width: '100%',
          maxHeight: '440px',
          objectFit: 'cover',
          borderRadius: '12px',
          marginTop: '16px',
        }),
      ]),
    ], { paddingTop: '40px', paddingBottom: '60px' }),

    // Features Section
    section([
      el('Box', { styles: { textAlign: 'center', gap: '12px', maxWidth: '640px', margin: '0 auto 48px auto' } }, [
        el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: 'var(--fp-primary)', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
          text('PLATFORM CAPABILITIES'),
        ]),
        heading('Engineered for High-Velocity Execution', 'h2', { fontSize: '2.25rem', fontWeight: 800 }),
        text(`Every capability you need to scale workflows, convert prospective visitors, and automate operations with ${data.companyName}.`, { color: 'var(--fp-muted)', fontSize: '1rem' }),
      ]),
      el('Grid', {
        styles: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px' },
        responsive: { mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
      }, [
        ...data.features.map((feat) =>
          el('Card', {
            styles: {
              background: 'var(--fp-surface)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '28px',
              gap: '12px',
              display: 'flex',
              flexDirection: 'column',
            },
          }, [
            el('Box', { styles: { width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fp-primary)', marginBottom: '8px' } }, [
              el('Icon', { props: { name: feat.icon || 'Sparkles' } }),
            ]),
            heading(feat.title, 'h3', { fontSize: '1.25rem', fontWeight: 700 }),
            text(feat.desc, { color: 'var(--fp-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }),
          ])
        ),
      ]),
    ], { id: 'features', paddingTop: '60px', paddingBottom: '60px' }),

    // Testimonials
    section([
      el('Box', { styles: { textAlign: 'center', gap: '12px', maxWidth: '640px', margin: '0 auto 40px auto' } }, [
        el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
          text('CLIENT TESTIMONIALS'),
        ]),
        heading('Loved by Fast-Growing Teams', 'h2', { fontSize: '2.25rem', fontWeight: 800 }),
        text(`Discover how industry leaders accelerate their pipeline with ${data.companyName}.`, { color: 'var(--fp-muted)', fontSize: '1rem' }),
      ]),
      el('Grid', {
        styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' },
        responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
      }, [
        el('Card', { styles: { background: 'var(--fp-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', gap: '14px', display: 'flex', flexDirection: 'column' } }, [
          el('Rating', { props: { rating: 5, maxRating: 5, starColor: '#f59e0b' } }),
          text(`"The fastest way to launch new customer experiences. We 4x-ed our conversion rate within 2 weeks of deploying ${data.companyName}."`, { fontSize: '0.9375rem', lineHeight: 1.6, fontStyle: 'italic' }),
          el('Row', { styles: { alignItems: 'center', gap: '10px', marginTop: 'auto' } }, [
            el('Avatar', { props: { name: 'Sarah Lin', role: 'VP Growth at Apex' } }),
          ]),
        ]),
        el('Card', { styles: { background: 'var(--fp-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', gap: '14px', display: 'flex', flexDirection: 'column' } }, [
          el('Rating', { props: { rating: 5, maxRating: 5, starColor: '#f59e0b' } }),
          text(`"Completely replaced our previous clunky workflow. The AI synthesis and live analytics are an absolute game changer."`, { fontSize: '0.9375rem', lineHeight: 1.6, fontStyle: 'italic' }),
          el('Row', { styles: { alignItems: 'center', gap: '10px', marginTop: 'auto' } }, [
            el('Avatar', { props: { name: 'Michael Vance', role: 'Head of Engineering' } }),
          ]),
        ]),
        el('Card', { styles: { background: 'var(--fp-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', gap: '14px', display: 'flex', flexDirection: 'column' } }, [
          el('Rating', { props: { rating: 5, maxRating: 5, starColor: '#f59e0b' } }),
          text(`"Incredible support, clean code embeds, and rock-solid performance under heavy multi-tenant production load."`, { fontSize: '0.9375rem', lineHeight: 1.6, fontStyle: 'italic' }),
          el('Row', { styles: { alignItems: 'center', gap: '10px', marginTop: 'auto' } }, [
            el('Avatar', { props: { name: 'Elena Rostova', role: 'Founder & CEO' } }),
          ]),
        ]),
      ]),
    ], { id: 'testimonials', paddingTop: '40px', paddingBottom: '60px' }),

    // Pricing Plans
    section([
      el('Box', { styles: { textAlign: 'center', gap: '12px', maxWidth: '640px', margin: '0 auto 40px auto' } }, [
        el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: 'var(--fp-primary)', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
          text('TRANSPARENT PLANS'),
        ]),
        heading('Simple, Predictable Investment', 'h2', { fontSize: '2.25rem', fontWeight: 800 }),
        text('No hidden contracts. Upgrade, downgrade, or cancel at any time with confidence.', { color: 'var(--fp-muted)', fontSize: '1rem' }),
      ]),
      el('Grid', {
        styles: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px', alignItems: 'stretch' },
        responsive: { tablet: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, mobile: { gridTemplateColumns: 'minmax(0, 1fr)' } },
      }, [
        ...data.plans.map((plan) =>
          el('Card', {
            styles: {
              background: plan.popular ? 'linear-gradient(180deg, rgba(99,102,241,0.15) 0%, var(--fp-surface) 100%)' : 'var(--fp-surface)',
              border: plan.popular ? '2px solid var(--fp-primary)' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative',
            },
          }, [
            ...(plan.popular
              ? [
                  el('Box', { styles: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--fp-primary)', color: '#fff', fontSize: '0.6875rem', fontWeight: 800, padding: '3px 12px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, [
                    text('Most Popular'),
                  ]),
                ]
              : []),
            heading(plan.name, 'h3', { fontSize: '1.25rem', fontWeight: 800 }),
            el('Row', { styles: { alignItems: 'baseline', gap: '4px' } }, [
              heading(plan.price, 'h2', { fontSize: '2.5rem', fontWeight: 900 }),
              text(plan.period, { color: 'var(--fp-muted)', fontSize: '0.875rem' }),
            ]),
            el('Box', { styles: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', flexGrow: 1 } }, [
              ...plan.features.map((feat) =>
                el('Row', { styles: { alignItems: 'center', gap: '8px', fontSize: '0.875rem' } }, [
                  el('Box', { styles: { color: '#10b981', fontWeight: 800 } }, [text('✓')]),
                  text(feat, { color: 'var(--fp-text)' }),
                ])
              ),
            ]),
            button(plan.popular ? 'Get Started Pro' : 'Choose Plan', '#pricing', plan.popular ? 'primary' : 'secondary'),
          ])
        ),
      ]),
    ], { id: 'pricing', paddingTop: '40px', paddingBottom: '60px' }),

    // FAQ
    section([
      el('Box', { styles: { textAlign: 'center', gap: '12px', maxWidth: '640px', margin: '0 auto 40px auto' } }, [
        el('Box', { styles: { display: 'inline-flex', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(99,102,241,0.1)', color: 'var(--fp-primary)', fontSize: '0.75rem', fontWeight: 700, margin: '0 auto' } }, [
          text('FAQS'),
        ]),
        heading('Frequently Asked Questions', 'h2', { fontSize: '2.25rem', fontWeight: 800 }),
        text('Everything you need to know about getting started.', { color: 'var(--fp-muted)', fontSize: '1rem' }),
      ]),
      el('Box', { styles: { maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' } }, [
        ...data.faq.map((item) =>
          el('Card', { styles: { background: 'var(--fp-surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px 24px', gap: '8px' } }, [
            heading(item.q, 'h4', { fontSize: '1.0625rem', fontWeight: 700 }),
            text(item.a, { color: 'var(--fp-muted)', fontSize: '0.9375rem', lineHeight: 1.6 }),
          ])
        ),
      ]),
    ], { id: 'faq', paddingTop: '40px', paddingBottom: '60px' }),

    // Footer
    section([
      el('Row', { styles: { justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.08)' }, responsive: { mobile: { flexDirection: 'column', gap: '16px', textAlign: 'center' } } }, [
        text(`© ${new Date().getFullYear()} ${data.companyName}. All rights reserved.`, { color: 'var(--fp-muted)', fontSize: '0.8125rem' }),
        el('Row', { styles: { gap: '16px' } }, [
          button('Privacy Policy', '#', 'ghost'),
          button('Terms of Service', '#', 'ghost'),
          button('Regulatory Disclosures', '#', 'ghost'),
        ]),
      ]),
    ], { paddingTop: '20px', paddingBottom: '40px' }),
  ];

  const docContent = synthesizeContent('ai', pageElements, {
    minHeight: '100vh',
    background: 'var(--fp-background)',
    color: 'var(--fp-text)',
    fontFamily: 'var(--fp-font-body)',
  });

  return {
    title: `${data.companyName} Landing Page`,
    type: request.type,
    theme,
    settings: {
      targetDevice: request.device || 'desktop',
      targetLanguage: request.language || 'en',
    },
    variables,
    variableDefs,
    documents: [
      {
        kind: 'page',
        title: 'Home',
        slug: '',
        position: 0,
        content: docContent,
      },
    ],
  };
}

/**
 * AI Content Rewriter for Studio
 * Updates variables in place according to prompt instructions.
 */
export function rebrandVariablesWithAi(
  currentVariables: Record<string, unknown>,
  prompt: string
): Record<string, unknown> {
  const brandName = (currentVariables['company.name'] as string) || 'Company';
  const domain = (currentVariables['company.domain'] as string) || 'company.com';
  const data = synthesizeBrandContent(brandName, domain, 'Modern Cloud Platform', prompt);

  return {
    ...currentVariables,
    'company.name': data.companyName,
    'company.tagline': data.tagline,
    'hero.title': data.heroHeadline,
    'hero.subtitle': data.heroSubtitle,
    'rating.score': data.ratingScore,
    'rating.reviews': data.ratingReviews,
    'features': data.features,
    'faqs': data.faq,
    'pricing.plans': data.plans,
  };
}
