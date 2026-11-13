# Interactive Product Demos

An **Interactive Demo** lets prospective customers experience your software, SaaS app, mobile application, or workflow through a guided, clickable simulation without requiring account sign-ups, API tokens, or credit cards.

Inspired by industry-standard interactive demo platforms (such as Navattic, Supademo, and Storylane), FlowPilot interactive demos dramatically increase conversion rates and qualify sales leads before booking discovery calls.

---

## How It Works

1. **Upload Screenshots**: Upload high-fidelity screenshots or screen recordings of your product interface.
2. **Place Hotspots & Tooltips**: Click anywhere on the screenshot to position clickable hotspots.
3. **Set Up Narrative & Actions**: Add titles, explanatory notes, next-step buttons, and branching logic.
4. **Publish & Share**: Distribute via a standalone One Link, embed in marketing pages via responsive iframes, or integrate via code with our AI prompt helper.

---

## Building Your Demo

### 1. Screen Management
- Use the screen selector bar above the canvas to navigate between screens, duplicate screens, or append new steps.
- Set screen background color, border radius, and aspect ratios (16:9, 4:3, or full desktop browser mockup).

### 2. Hotspots & Tooltip Placement
- With a screen selected, click **Add Hotspot** or drag from the blocks menu.
- **Positioning**: Drag the hotspot directly onto the UI element you want the visitor to click (e.g., a "Create Workspace" button). Position coordinates are stored as percentages, ensuring responsive alignment across desktop, tablet, and mobile displays.
- **Pulse Animation**: Enable the pulsing beacon animation to guide the user's attention.
- **Tooltip Options**: Configure title, text description, button label (e.g. *"Next Step →"*), tooltip placement (top, bottom, left, right), and arrow orientation.

### 3. Branching Logic & Nonlinear Tours
- By default, clicking a hotspot navigates to the next sequential screen (`n + 1`).
- To create persona-based or feature-specific branches, set **Target Screen Number** in the hotspot settings (e.g., Hotspot 1 routes to "Developer Workflow" on Screen 4, while Hotspot 2 routes to "Admin Settings" on Screen 8).
- The final screen includes a customizable **Restart Demo** action or a lead capture Call-To-Action (CTA).

### 4. Lead Capture & CTAs
- Insert form fields or a **Payment / Sign-up Button** on any screen or at the demo conclusion.
- Collect visitor email, company name, and feedback before letting them test advanced screens.

---

## Distribution & Embedding

### 1. Direct Share (One Link)
Send prospective buyers directly to your full-screen demo link:
```text
https://your-domain.com/s/your-demo-slug
```
Ideal for:
- Cold outreach and sales follow-up emails
- Product Hunt launch pages
- LinkedIn and Twitter demo spotlights
- Notion customer onboarding portals

### 2. Responsive Iframe Embed
Embed the interactive demo right into your marketing homepage or documentation:
```html
<iframe
  src="https://your-domain.com/s/your-demo-slug"
  width="100%"
  height="700px"
  style="border:0;border-radius:12px;width:100%;max-width:100%;box-shadow:0 12px 36px rgba(0,0,0,0.12);"
  allow="clipboard-write"
  allowfullscreen
></iframe>
```

### 3. In-App Script Tag
For native single-page embedding in your existing app:
```html
<div data-flowpilot="{{PROJECT_ID}}"></div>
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" defer></script>
```

### 4. Copy as AI Prompt (Cursor, ChatGPT, Claude)
Use the **Copy as AI Prompt** button in the publish modal to generate a tailor-made prompt. Paste it into Cursor or Claude to automatically generate an interactive demo modal, tabbed walkthrough, or embedded tour in your Next.js, React, or Vue application.

---

## Analytics & Insights

In the **Analytics** dashboard, track:
- **Completion Rate**: Percentage of users who finish all screens.
- **Drop-off Funnel**: Pinpoints exact screens where visitors exit or get stuck.
- **Hotspot Heatmap**: Relative engagement on each clickable hotspot.
