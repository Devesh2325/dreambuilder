# Forms

Forms collect answers, as a hosted link or inside your own page.

## Share as a link

Publish it and share `{{ORIGIN}}/s/your-address`.

## Put it in your site

```html
<div data-flowpilot="{{PROJECT_ID}}"></div>
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" defer></script>
```

## Build the form

In the editor's **Add** tab, use **Form field** and **Rating scale**. For each field, set its label, type, and whether it's required.

**Field name** identifies the answer in responses, exports and webhooks. Keep it short and unchanged once you're collecting data.

For select and radio fields, put one option per line.

## Multi-step forms

Add **Form step** blocks inside the form and move fields into them. Visitors then see one step at a time with a progress bar, and each step must be valid before moving on.

## Responses

Open the project to see responses and export them as CSV. To send them to your own system, see [form data and webhooks](webhooks).
