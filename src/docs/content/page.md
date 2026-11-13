# Pages & Landing Pages

A **Page** is a dedicated, high-converting standalone web page designed for launches, marketing campaigns, personal branding, professional profiles, and portfolio showcases. Unlike a multi-page website, a Page focuses your visitor's attention on a single compelling objective without navigation distractions.

---

## What You Can Build

- **Professional & Regulated Advisor Pages**: e.g., SEBI Registered Research Analysts, wealth managers, financial planners with compliant disclosures and consultation bookings.
- **Product & Feature Launches**: Showcase new SaaS software, mobile apps, or hardware drops.
- **Lead Generation & Waitlists**: Capture emails, survey prospects, and validate demand.
- **Events & Webinars**: Speaker lineups, schedules, live stream embeds, and ticket checkout.
- **Link in Bio / One Link Profiles**: Aggregate your social links, featured articles, and lead capture into one mobile-first URL.

---

## Choosing a Template & Customizing with Variables

FlowPilot provides pre-built, responsive templates tailored for modern businesses:

1. **SEBI Registered Research Analyst / Financial Advisor**: Complete with regulatory compliance badges, SEBI registration number disclosure, advisory track record, client testimonials, subscription plans with star ratings, and contact consultation form.
2. **SaaS Launch**: Hero section with automated text tickers, interactive mockups, API playgrounds, feature grids, and comparison matrices.
3. **Course & Book Launch**: Syllabus preview, author bio, student reviews, and integrated Stripe/LemonSqueezy checkout.
4. **App Waitlist**: Viral referral counters, animated hero shimmer, and email capture.

### Variable-Driven Content
Every template supports variables so you can rebrand in seconds without touching layout code:
- Open the **Variables** tab in the editor.
- Edit values like `{{advisor.name}}`, `{{advisor.sebi_reg}}`, `{{company.name}}`, `{{hero.title}}`, and `{{pricing.monthly}}`.
- All blocks referencing those variables update instantly on the canvas.

---

## Layout, Animations & Interactive Effects

FlowPilot includes rich interactive blocks to bring your landing pages to life:

### 1. Rating Blocks
- Add the **Rating** block from the Layout menu to show customer satisfaction, social proof, and review scores.
- **Customizable Stars**: Adjust the count (e.g. 5 stars, 10 stars), current rating value (e.g. 4.9), step increments (half stars / decimals), and star fill colors (amber, gold, purple, emerald).
- **Labels & Counts**: Display review counts (e.g. "4.9 / 5 from 1,240+ verified clients") and review sources (Google, Trustpilot, G2).

### 2. Auto-Moving Text & Hero Animations
Highlight your core value proposition using dynamic text animations in Heading or Text blocks:
- **Ticker / Marquee**: Continuously scrolls partner logos, press mentions, or breaking announcements across the screen.
- **Word Cycle**: Cycles through key adjectives (e.g., "Fast. Reliable. *Autonomous*.") with smooth fade and slide transitions.
- **Typewriter Effect**: Simulates code or live typing to capture immediate reader attention.
- **Shimmer / Glow**: Adds an animated gradient sweep across headlines or buttons to draw clicks.

### 3. Container Hover Effects & Transitions
- Select any container, card, or button and open **Effects** in the Left Panel.
- Choose hover effects like subtle lift (`translate-y`), glowing border pulse, glassmorphism blur, and box shadow elevation.

---

## Delivery & Sharing Options

Once published, you have 4 flexible ways to distribute your page:

### 1. Direct Share (One Link)
Your page is instantly hosted on FlowPilot's global CDN:
```text
https://your-domain.com/s/your-slug
```
Share this link in your social bios (LinkedIn, Twitter/X, Instagram, TikTok), marketing emails, Slack groups, or WhatsApp chats.

### 2. Responsive Iframe Embed
Embed the entire page seamlessly into any existing website (Webflow, WordPress, Wix, Framer, Squarespace, Shopify, or static HTML):
```html
<iframe
  src="https://your-domain.com/s/your-slug"
  width="100%"
  height="750px"
  style="border:0;border-radius:12px;box-shadow:0 12px 36px rgba(0,0,0,0.12);"
  allow="clipboard-write"
  allowfullscreen
></iframe>
```

### 3. In-App Script Tag
For inline embedding inside your custom single-page application:
```html
<div data-flowpilot="{{PROJECT_ID}}"></div>
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" defer></script>
```

### 4. One-Click "Copy as AI Prompt" (Cursor, Claude, ChatGPT, Copilot)
Don't want to write integration code manually?
- Click the **Copy as AI Prompt** button in the publish dialog or integration guide.
- Paste the generated prompt directly into **Cursor**, **ChatGPT**, **Claude**, **GitHub Copilot**, or **v0**.
- Your AI assistant will automatically inspect your React/Next.js/HTML codebase, generate the responsive wrapper component, handle unmount cleanup, and position the page cleanly.

---

## Custom Domains

You can connect your own branded domain or subdomain (e.g. `pages.yourbrand.com` or `getfinuro.com`):
1. In the project's **Share** tab, open **Use your own domain**.
2. Enter your custom domain name.
3. Add the provided `CNAME` or `A` DNS records at your domain registrar (Cloudflare, GoDaddy, Namecheap, Route53).
4. SSL certificates are provisioned and renewed automatically.

---

## Form Responses & Webhooks

When visitors submit lead forms, newsletter signups, or consultation requests on your page:
- Entries are recorded under the **Responses** tab of the project.
- Export all submissions as CSV anytime.
- Set up real-time **Webhooks** to push leads directly to HubSpot, Salesforce, Zapier, Make, Slack, or your custom CRM backend.
