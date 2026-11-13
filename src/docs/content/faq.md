# FAQs & Accordions

The **FAQ** module provides interactive, accordion-style questions and answers that reduce support tickets, improve conversion rates, and clarify product details for prospective customers.

---

## Key Features

- **Smooth Accordion Transitions**: Clean collapsible items with chevron animations and accessible keyboard navigation (WAI-ARIA compliant).
- **Categories & Tabs**: Group questions into logical sections like *Getting Started*, *Pricing & Billing*, *API & Security*, and *Integrations*.
- **Live Search Filtering**: Visitors can type a query to filter questions instantaneously.
- **Rich Answers**: Include markdown, bullet lists, bold text, links, and code snippets inside each answer.
- **Analytics & Tracking**: Tracks which questions visitors expand most frequently, highlighting gaps in your marketing or onboarding.

---

## Managing Questions & Variables

You can manage FAQ questions in two convenient ways:

1. **Directly in Canvas**: Click on any question title or answer text to edit inline.
2. **Via the Variables Panel**:
   - Open **Variables** in the editor left panel.
   - Edit, reorder, add, or remove questions from the structured `faq_items` list.
   - Each item includes:
     - `question`: The heading or prompt.
     - `answer`: The detailed explanation.
     - `category`: (Optional) Grouping tag for multi-category tabs.

---

## How to Share & Embed

FlowPilot supports multiple methods to publish and integrate your FAQ:

### 1. Direct Share (One Link)
Send customers directly to your hosted FAQ knowledge base:
```text
https://your-domain.com/s/your-slug
```
Use this URL in your email signatures, chat widgets, help center menus, and customer support macros.

### 2. Embed into Any Web Page (Iframe)
Drop the FAQ into any CMS or static website:
```html
<iframe
  src="https://your-domain.com/s/your-slug"
  width="100%"
  height="600px"
  style="border:0;border-radius:12px;width:100%;box-shadow:0 10px 30px rgba(0,0,0,0.06);"
  allow="clipboard-write"
></iframe>
```

### 3. In-App Script Tag
Embed natively inside your page layout:
```html
<div data-flowpilot="{{PROJECT_ID}}"></div>
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" defer></script>
```

### 4. Copy as AI Prompt (Cursor, ChatGPT, Claude)
Click **Copy as AI Prompt** in the project publish dialog or install guide, and paste the prompt into your AI coding assistant. The AI will integrate the FAQ component into your Next.js, React, Vue, or Angular codebase with full responsive styling and state hydration.

---

## Analytics & Optimization

Under the project's **Analytics** tab, monitor:
- **Total Views**: Number of visitors who viewed the FAQ.
- **Questions Opened**: Percentage and absolute count of expansions for each question.
- **Search Queries**: The terms visitors searched for that yielded answers or required escalation.
