# Embedding & Code Integration

FlowPilot gives you complete flexibility to embed any interactive experience—websites, pages, forms, interactive demos, tours, banners, and FAQs—into existing platforms, content management systems, or custom web apps.

---

## 4 Ways to Integrate

| Method | Best For | Technical Complexity | Key Benefit |
| :--- | :--- | :--- | :--- |
| **Direct Share (One Link)** | Social bios, sales emails, chat links, Notion | None (0 lines of code) | Instant global CDN hosting with zero configuration |
| **Responsive Iframe** | Webflow, WordPress, Wix, Squarespace, Shopify, Framer | Low (copy & paste HTML) | Works on every CMS without script permissions |
| **Script Tag (flowpilot.js)** | Modern React, Next.js, Vue, Angular, SPAs | Low / Medium | Native in-page feel, zero iframe boundaries, lightweight bundle (<40 KB) |
| **Copy as AI Prompt** | Developers using Cursor, ChatGPT, Claude, Copilot | None (Prompt-driven) | One-click prompt writes the exact integration component for your framework |

---

## 1. Direct Share (One Link)

Every published project receives a clean, memorable URL:
```text
https://your-domain.com/s/your-slug
```
- Completely responsive across mobile, tablet, and desktop viewports.
- Automated OpenGraph social preview tags (title, image, description) for rich previews in WhatsApp, iMessage, Twitter/X, and Slack.
- Supports custom subdomains (e.g., `go.yourdomain.com/demo`).

---

## 2. Responsive Iframe Embed

Iframes provide an isolated, sandboxed environment that works in virtually all content management systems and page builders:

```html
<iframe
  src="https://your-domain.com/s/your-slug"
  title="FlowPilot Project"
  width="100%"
  height="750px"
  style="border:0;border-radius:12px;width:100%;max-width:100%;box-shadow:0 12px 36px rgba(0,0,0,0.12);"
  allow="clipboard-write"
  allowfullscreen
></iframe>
```

### Supported Platforms:
- **Webflow**: Add an **Embed** element, paste the iframe code, and set width to 100%.
- **WordPress**: Insert a **Custom HTML** block in the Gutenberg editor.
- **Shopify**: Paste into `theme.liquid` or inside an HTML section.
- **Squarespace**: Use a **Code Block** and paste the snippet.
- **Wix**: Add an **HTML Embed** element and adjust container dimensions.
- **Notion**: Type `/embed`, paste your One Link, and resize as desired.

---

## 3. In-App Script Tag (`flowpilot.js`)

For projects that require seamless inline embedding without iframe borders or scrollbars, use the FlowPilot lightweight script tag:

```html
<!-- Container where your experience renders -->
<div data-flowpilot="{{PROJECT_ID}}"></div>

<!-- FlowPilot runtime script (< 40 KB gzipped) -->
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" defer></script>
```

### Framework Implementations

#### Next.js (App Router `layout.tsx` or `page.tsx`)
```tsx
import Script from 'next/script';

export default function LandingPage() {
  return (
    <main>
      <h1>Welcome to Our Product</h1>
      
      {/* Target container */}
      <div data-flowpilot="{{PROJECT_ID}}" />
      
      {/* FlowPilot runtime script */}
      <Script
        src="{{ORIGIN}}/flowpilot.js"
        data-project-id="{{PROJECT_ID}}"
        strategy="afterInteractive"
      />
    </main>
  );
}
```

#### React (Vite / CRA / SPA)
1. Add the script to `index.html` inside `<head>` or before `</body>`:
   ```html
   <script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" defer></script>
   ```
2. Render the placeholder in your JSX component:
   ```tsx
   export function ProductTour() {
     return <div data-flowpilot="{{PROJECT_ID}}" className="my-8 w-full" />;
   }
   ```

---

## 4. One-Click "Copy as AI Prompt"

Using **Cursor**, **Claude**, **ChatGPT**, **GitHub Copilot**, or **v0**?

1. In FlowPilot, open the **Publish Dialog** or the **Integrate in Code** guide.
2. Click the **Copy as AI Prompt** button.
3. Paste the copied prompt directly into your AI chat or inline agent:
   > *"Integrate this FlowPilot project into my application... [Includes project ID, live URL, Next.js/React snippets, and cleanup instructions]"*
4. Your AI agent will inspect your current directory, locate the target layout or page, write the clean wrapper component, and ensure zero hydration mismatches.

---

## Embedding a FlowPilot Project Inside Another FlowPilot Page

You can nest projects within other projects using the **Project Embed** block:
1. Open your master Website or Page in the Studio.
2. In the **Add** tab, click **Projects** and select the sub-project (such as a Contact Form, Interactive Demo, or FAQ).
3. The embedded project updates automatically whenever the underlying sub-project is modified and published.
