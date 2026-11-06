# Installing the script

The script is about 21 KB when compressed, loads with `defer` so it doesn't delay your page, and has no dependencies. It keeps its styles in a Shadow DOM, so your CSS and FlowPilot's can't affect each other.

Add it once per project. To use several projects on a page, add one script tag for each.

Each project's **Share and install** tab has these steps with your code filled in, including WordPress, Shopify, Webflow, Wix, Squarespace and Google Tag Manager. Websites and pages don't need the script, since they're hosted for you. To show one of your forms or demos in a website you built here, see [Use your projects inside a page](embedding).

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

## Check that it works

Open the project's **Share and install** tab, and under **Check that it works**, enter the address of a page with the code. FlowPilot opens it and tells you:

- whether the script is on the page, and for which project
- whether the spot for an inline project is there
- whether it's published and loads
- anything your site's security settings blocked

It also shows your latest draft on that page, only to you, so you can see how it looks in place before publishing.

If nothing answers, the most common reason is a Content Security Policy, below.

## Content Security Policy

Many sites, including most built with Next.js, only allow scripts from addresses they list. This is called a Content Security Policy, and when it blocks FlowPilot, your browser's console says "violates the following Content Security Policy directive" with FlowPilot's address.

Add these sources to the matching directives, keeping the ones already there:

```
script-src {{ORIGIN}};
connect-src <your FlowPilot database address>;
style-src 'unsafe-inline' https://fonts.googleapis.com;
font-src https://fonts.gstatic.com;
img-src https: data:;
frame-src https://www.youtube-nocookie.com https://player.vimeo.com;
```

The **Check that it works** step shows the exact lines for your FlowPilot, including the database address, and a message you can send to whoever looks after your site. In Next.js the policy is usually in `next.config.js` or `middleware.ts`. Other places are `vercel.json`, `netlify.toml`, your server settings, or a `<meta http-equiv>` tag.

The script also notices when the policy blocks something it needs, and says what to allow in the console, starting with `[FlowPilot]`.

## Mobile apps

- **An app made from web pages**, such as with Capacitor, Ionic or Cordova, or one that shows your website inside it: add the script exactly as for a website.
- **A native screen**: forms, demos, FAQs, menus, websites and pages each have their own address once published, so show that address in a web view. **Share and install** has the code for React Native, Flutter, Android and iPhone.
- **Tours and banners over native screens** aren't possible yet, since that needs a FlowPilot mobile SDK. They work wherever your app shows web pages.

Changes appear in the app when you publish, with no new app release.

## Fonts and privacy

To show your chosen fonts, the script loads them from Google Fonts, which sends the visitor's IP address to Google. To turn this off, add `data-fonts="off"`. Experiences then use a system font.

```html
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" data-fonts="off" defer></script>
```

## What the script stores

The script stores a random visitor ID and a record of what has been shown, in the browser's local and session storage. It doesn't use cookies, and doesn't collect form data unless the visitor submits a FlowPilot form. Check whether your privacy policy or consent banner needs to mention this.
