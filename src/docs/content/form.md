# Forms & Surveys

The **Form** module allows you to create high-converting multi-step lead forms, client intake questionnaires, feedback surveys, and registration flows.

---

## Form Fields & Components

### 1. Standard Input Fields
- **Text & Email**: With built-in email formatting and syntax validation.
- **Phone / Tel**: Supports international phone inputs and dial codes.
- **Dropdown & Radio Groups**: Single-select choices with one option per line.
- **Checkboxes**: Multi-select options and terms-of-service agreements.
- **Textarea**: Multi-line long-form questions and open feedback.

### 2. Rating Scale & Review Stars
- Add the **Rating Scale** block to capture NPS (Net Promoter Score), customer satisfaction (CSAT), or product reviews.
- **Scale Range**: Customize minimum rating (e.g. 1) and maximum rating (e.g. 5 or 10).
- **Star Color**: Select brand colors (amber, gold, purple, emerald, rose) for active and hovered stars.
- **Labels**: Add context labels for low and high scores (e.g. *"1 = Very Poor"*, *"5 = Outstanding"*).

### 3. Multi-Step Wizard Flow
- Break long forms into manageable steps using **Form Step** blocks.
- Visitors see a clean progress indicator showing current step number and completion percentage.
- Each step is validated before allowing the user to proceed to the next step, preventing incomplete submissions.

---

## Response Management & Webhooks

### 1. View & Export Responses
- Submissions are logged in real time under the project's **Responses** tab.
- Click **Export CSV** to download all submissions with timestamps, field values, and user metadata.

### 2. Webhooks & Integrations
- Navigate to **Webhooks** in the project settings.
- Add an HTTP POST webhook endpoint (e.g., Zapier, Make.com, n8n, Slack, or your custom API endpoint).
- FlowPilot delivers a secure JSON payload with signature verification whenever a submission is received.

---

## Sharing & Embedding

- **One Link**: Share `https://your-domain.com/s/your-form-slug` directly in emails or social bios.
- **Responsive Iframe**: Embed in Webflow, WordPress, Squarespace, or Shopify.
- **In-App Script**: Embed inline with `<div data-flowpilot="{{PROJECT_ID}}"></div>`.
- **Copy as AI Prompt**: Copy the ready-made prompt for Cursor, Claude, or ChatGPT to implement form dialogs or modal triggers automatically.
