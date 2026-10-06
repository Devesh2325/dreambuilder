# FlowPilot — AI Visual Experience Builder
## Master Architecture & Implementation Plan

### 1. Executive Summary & Product Scope
FlowPilot is an enterprise-grade, multi-tenant visual experience builder SaaS. It empowers product managers, growth teams, and developers to visually build, preview, publish, and measure 15 interconnected experience types without code:
1. **Product Tours**: Multi-step interactive walkthroughs with selector targeting, spotlights, tooltips, step navigation, and fallback handling.
2. **Interactive Product Demos**: Guided sandbox walkthroughs with simulated screens, interactive clickable hotspots, branching paths, and completion tracking.
3. **Website Pages & Landing Pages**: Structured responsive section-based landing pages (Hero, Features, Pricing, Testimonials, CTA, Footer).
4. **In-App Banners & Announcements**: Sticky, inline, top/bottom banners with priority and trigger rules.
5. **Navigation Menus**: Desktop dropdowns, mega menus, and responsive mobile nav drawers.
6. **FAQs & Help Centers**: Searchable, categorized accordions with rich answers.
7. **Popups & Modals**: Center modals, slide-ins, full-screen takeovers with time/scroll/exit-intent fallbacks.
8. **Tooltips & Popovers**: Viewport-aware positioned contextual hints with collision avoidance.
9. **Onboarding Checklists**: Progress tracking, action triggers, completion reward animations.
10. **Feedback & Survey Forms**: NPS, star rating, CSAT, multiple choice, free-form text with response data logging.
11. **Reusable Templates**: Built-in searchable template marketplace with 1-click project initialization.
12. **Assets Library**: Tenant-scoped asset management with upload, metadata, and preview.
13. **AI-Generated Website Sections & Experiences**: Integrated AI assistant with Generate, Edit, and Ask capabilities producing typed editor operations.
14. **Publishing & Client Runtime (`flowpilot.js`)**: Immutable versioning, public demo links, and zero-dependency embeddable runtime.
15. **Analytics & Performance Reports**: Real-time event ingestion (impressions, completions, drop-offs, CTA clicks) and visual dashboard.

---

### 2. Tech Stack & Architectural Decisions
- **Frontend Core**: React 18/19, TypeScript, Vite, Tailwind CSS with customized design tokens.
- **State Architecture**:
  - `zustand`: High-performance decoupled editor engine state with transactional undo/redo history, canvas transform/zoom, selection tracking, and autosave dirty-flagging.
  - `@tanstack/react-query`: Server state synchronization, caching, and optimistic mutations.
- **Routing**: `react-router-dom` with role-based protected routes and sub-navigation per module.
- **Data & Multi-tenancy**:
  - Full PostgreSQL schema with Row Level Security (RLS) migrations and seed files.
  - Flexible storage abstraction layer: local persistent storage adapter (IndexedDB / LocalStorage) with seamless cloud Supabase DB/Auth/Storage bindings when environment variables are supplied.
- **Editor Engine**:
  - 100% Custom DOM-based rendering canvas (no third-party canvas builders like GrapesJS or Craft.js).
  - Component registry with 35+ typed component definitions, property schemas, layout rules, and inspector controls.
  - Non-destructive editor overlay layer (selection ring, resize handles, drop indicators, guides) decoupled from production rendering.
- **Testing**: Vitest + React Testing Library unit & integration suites.

---

### 3. Database Schema Overview (Multi-Tenant RLS)
- `organizations`: Tenant account, slug, branding, tier (`free`, `starter`, `pro`, `enterprise`).
- `organization_members`: User linkage, role (`owner`, `admin`, `editor`, `viewer`).
- `user_profiles`: User details, preferences.
- `projects`: Experience projects scoped to organization, type, metadata, status.
- `documents`: Document JSON trees, theme variables, target settings, triggers.
- `document_versions`: Immutable published snapshots for embed runtime and rollbacks.
- `analytics_events`: Granular event logs (type, document_id, step_id, session_id, timestamp, metadata).
- `analytics_aggregates`: Hourly/daily pre-aggregated metrics for high-speed dashboard loading.
- `templates`: Curated templates with category, tags, and document snapshots.
- `assets`: Stored media with dimensions, file size, mime-type, and alt text.
- `surveys_responses`: End-user survey/NPS submissions.
- `checklist_progress`: Persistent visitor progress tracking.
- `integrations`: Webhooks, custom domains, analytics forwarders.

---

### 4. Milestone Roadmap
- **Milestone 1: Foundation & Application Shell** (Vite + Tailwind + Router + Navigation + Layouts + Migrations + Status tracking)
- **Milestone 2: Multi-tenant Auth & Workspace System** (Organizations, Members, Roles, Permissions, Profile)
- **Milestone 3: Custom Visual Editor Core** (Document Model, Component Registry, Canvas, D&D, Inspector, History, Shortcuts, Autosave)
- **Milestone 4: Product Tour Builder & Step Engine** (Target selectors, spotlights, popover positioning, preview runtime)
- **Milestone 5: Interactive Product Demo Builder** (Screens, hotspots, branching logic, interactive sandbox)
- **Milestone 6: Website Page & Section Builder** (Structured sections, layouts, responsive grids, global themes)
- **Milestone 7: Remaining Experience Modules** (Banners, Menus, FAQs, Popups, Checklists, Feedback Surveys)
- **Milestone 8: Templates Marketplace & Asset Management**
- **Milestone 9: AI Assistant Integration** (Generate, Contextual Edit, Ask with structural command validation)
- **Milestone 10: Publishing Pipeline & Embeddable Client Runtime** (`flowpilot.js` lightweight script)
- **Milestone 11: Real Analytics Ingestion & Dashboard**
- **Milestone 12: Billing, Entitlements & Integrations Hub**
- **Milestone 13: QA, Automated Tests, Hardening & Documentation**
