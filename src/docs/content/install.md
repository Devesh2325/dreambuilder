# Installing the script

The script is about 21 KB when compressed, loads with `defer` so it doesn't delay your page, and has no dependencies. It keeps its styles in a Shadow DOM, so your CSS and FlowPilot's can't affect each other.

Add it once per project. To use several projects on a page, add one script tag for each.

## Plain HTML

Paste before the closing `</body>` tag:

```html
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" defer></script>
```

For a form, demo, menu or FAQ, also place this where it should appear:

```html
<div data-flowpilot="{{PROJECT_ID}}"></div>
```

## React

Add the script once, in a top-level component:

```jsx
import { useEffect } from 'react';

export function FlowPilot({ projectId }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '{{ORIGIN}}/flowpilot.js';
    script.dataset.projectId = projectId;
    script.defer = true;
    document.body.appendChild(script);
    return () => script.remove();
  }, [projectId]);
  return null;
}
```

Render an inline experience with an ordinary element:

```jsx
<div data-flowpilot="{{PROJECT_ID}}" />
```

An inline `<div>` added after the script has loaded needs one more step, because the script only looks for them when it starts. Call `window.FlowPilot.start('{{PROJECT_ID}}')` after it renders.

## Next.js

Use the built-in `Script` component in your root layout:

```jsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" strategy="afterInteractive" />
      </body>
    </html>
  );
}
```

## Vue

Add the script tag to `index.html`, or load it in your root component:

```js
import { onMounted } from 'vue';

onMounted(() => {
  const script = document.createElement('script');
  script.src = '{{ORIGIN}}/flowpilot.js';
  script.dataset.projectId = '{{PROJECT_ID}}';
  script.defer = true;
  document.body.appendChild(script);
});
```

## WordPress

Use a plugin that adds code to your site's footer, such as WPCode, and paste the HTML snippet into its footer section. For inline experiences, add a **Custom HTML** block containing the `<div>`.

## Shopify

Go to **Online Store > Themes > Edit code**, open `layout/theme.liquid`, and paste the script before `</body>`. For inline experiences, add a **Custom Liquid** section containing the `<div>`.

## Google Tag Manager

Create a **Custom HTML** tag, paste the script, and fire it on **All Pages**. GTM removes `defer` handling differently, but the script works either way.

Inside GTM the script can't identify itself automatically in every setup. If nothing appears, add this to the same tag:

```html
<script>
  window.addEventListener('load', function () {
    if (window.FlowPilot) window.FlowPilot.start('{{PROJECT_ID}}');
  });
</script>
```

This shows the experience right away, ignoring its trigger rules.

## Content Security Policy

If your site uses a CSP, allow these sources:

```
script-src {{ORIGIN}};
connect-src <your-supabase-project-url>;
style-src 'unsafe-inline' https://fonts.googleapis.com;
font-src https://fonts.gstatic.com;
img-src https: data:;
```

## Fonts and privacy

To show your chosen fonts, the script loads them from Google Fonts, which sends the visitor's IP address to Google. To turn this off, add `data-fonts="off"`. Experiences then use a system font.

```html
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" data-fonts="off" defer></script>
```

## What the script stores

The script stores a random visitor ID and a record of what has been shown, in the browser's local and session storage. It doesn't use cookies, and doesn't collect form data unless the visitor submits a FlowPilot form. Check whether your privacy policy or consent banner needs to mention this.
