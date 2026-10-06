# FlowPilot — AI Visual Experience Builder SaaS

> **Design Every Experience. Guide Every User.**

FlowPilot is an enterprise-grade, multi-tenant visual experience platform that empowers product teams to create, customize, preview, publish, and measure 15 interactive experience types without coding.

---

## 🌟 Key Features

### 1. 100% Custom DOM Visual Editor Engine
- **No Third-Party Builder Dependencies**: No GrapesJS, Craft.js, or iframe crutches.
- **Real DOM-Based Canvas**: Fully responsive canvas supporting desktop, tablet (768px), and mobile (375px) device viewports.
- **Layer & Hierarchy Tree**: Deep selection, parent-child nesting, element lock, duplicate, and deletion.
- **Point-and-Click Selector Targeting**: Interactive target picker with automatic spotlighting and viewport collision detection.
- **Transactional History**: Instant Undo (`Ctrl+Z`), Redo (`Ctrl+Shift+Z`), Copy/Paste (`Ctrl+C/V`), and Autosave (`Ctrl+S`).

### 2. Supported Experience Modules
1. **Product Tours**: Guided walkthroughs with element spotlights, target selectors, steps management, and missing-target fallbacks.
2. **Interactive Product Demos**: Multi-step simulated screens with pulsing hotspots and branching decision paths.
3. **Landing Pages & Websites**: Structured responsive sections (Hero, Features, Pricing, Testimonials, CTA, Footer) with CSS variable theming.
4. **Banners & Announcements**: Sticky top/bottom and inline announcement bars with dismiss actions.
5. **Navigation Menus**: Header navigation bars with dropdowns and mobile drawer menus.
6. **FAQs & Help Centers**: Searchable accordions with expandable rich answers.
7. **Popups & Modals**: Centered conversion modals, exit-intent triggers, and backdrop controls.
8. **Onboarding Checklists**: Gamified user activation checklists with progress bars and celebratory rewards.
9. **Feedback & NPS Surveys**: Net Promoter Score (0-10) capture with qualitative feedback recording.

### 3. Integrated AI Assistant (Copilot)
- **Generate**: Create entire structured multi-step experiences from natural-language prompts.
- **Edit**: Contextually improve the selected component (contrast, spacing, typography, layouts).
- **Ask**: Design critiques, accessibility suggestions, and conversion rate advice.
- **Safe Operations**: AI outputs typed structural JSON commands with side-by-side diff preview and Apply/Reject controls.

### 4. Zero-Dependency Embed Runtime (`flowpilot.js`)
- Published experiences can be embedded into any web application:
  ```html
  <script src="https://your-domain.com/flowpilot.js" data-project-id="PROJECT_ID" defer></script>
  ```
- Handles trigger conditions (URL rules, delays, frequencies).
- Gracefully handles missing host DOM elements.
- Emits real telemetry and analytics without collecting sensitive PII.

### 5. Multi-Tenant Workspace & Security
- PostgreSQL database schemas with Row Level Security (RLS) migrations (`supabase/migrations/20260101_init.sql`).
- Role-Based Access Control: Owner, Admin, Editor, Viewer.
- Dual-mode persistence: Local development mode with IndexedDB/LocalStorage fallback and seamless Supabase cloud sync.

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9

### Installation
```bash
git clone https://github.com/your-org/flowpilot.git
cd flowpilot
npm install
```

### Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Run Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
```

---

## 🏛 Project Structure
```
d:\Builder\
├── public\
│   └── flowpilot.js               # Standalone embed runtime script
├── src\
│   ├── components\
│   │   ├── modals\                # CreateExperienceModal, etc.
│   │   └── shell\                 # AppLayout, Sidebar, Header
│   ├── editor\
│   │   ├── ai\                    # AI Assistant drawer and diff preview
│   │   ├── canvas\                # Real DOM Canvas renderer and selection rings
│   │   ├── panels\                # TopBar, LeftPanel, RightPanel, PublishModal
│   │   ├── registry\              # 19+ typed visual and interactive components
│   │   └── store\                 # Zustand store with transactional undo/redo
│   ├── pages\
│   │   ├── analytics\             # Analytics dashboard and event streams
│   │   ├── assets\                # Media assets library and upload simulator
│   │   ├── auth\                  # Login, SignUp, ForgotPassword
│   │   ├── billing\               # Subscription tiers and usage meters
│   │   ├── dashboard\             # Unified SaaS dashboard
│   │   ├── domains\               # Custom domains and CDN DNS setup
│   │   ├── integrations\          # Webhooks, GA4, Slack integrations
│   │   ├── modules\               # Dedicated listing & editor launch views
│   │   ├── preview\               # Public Live Preview mode
│   │   ├── projects\              # Project management and filters
│   │   ├── settings\              # Workspace and account settings
│   │   └── templates\             # Templates marketplace
│   ├── runtime\
│   │   └── flowpilot-runtime.ts   # Core client runtime engine
│   ├── services\
│   │   ├── aiService.ts           # Autonomous structured AI generator
│   │   ├── authContext.tsx        # Multi-tenant workspace & role permissions
│   │   ├── seedData.ts            # Realistic pre-built documents and templates
│   │   └── storage.ts             # Storage service with persistent local adapter
│   └── types\                     # Strongly-typed schemas for documents & modules
├── supabase\
│   └── migrations\
│       └── 20260101_init.sql      # Multi-tenant PostgreSQL schema with RLS
├── BUILD_PLAN.md                  # Architectural master plan
└── IMPLEMENTATION_STATUS.md       # Milestone completion tracker
```

---

## 📜 License
MIT © FlowPilot
