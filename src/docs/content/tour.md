# Product tours

A tour guides users step by step around your own app, highlighting one element at a time.

## Install

Add the script to your app, as described in the [installation guide](install):

```html
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" defer></script>
```

## Choose what each step points to

Select a step in the editor and set **Target element**:

- **Pick on my site** opens your app so you can click the element. The script must already be installed on that page.
- Or type a CSS selector, such as `#reports` or `[data-tour="reports"]`.

A step with no target appears in the center of the screen, which works well for a welcome message.

Add a stable attribute to elements you want to point at. Selectors based on generated class names break when your app is rebuilt.

```html
<button data-tour="create-report">New report</button>
```

## Step buttons

Set a button's **When clicked** to **Next step**, **Previous step** or **Close**. On the last step, **Next step** finishes the tour.

## If a target is missing

FlowPilot waits about 2.5 seconds for the element to appear. After that, it follows the step's **If the target is missing** setting: show the step in the center, or skip it.

## When it appears

Click an empty part of the canvas to set page rules, delay and frequency. Choose **Once per visitor** for onboarding.

To start a tour from a button in your app, use the [JavaScript API](api):

```js
window.FlowPilot?.start('{{PROJECT_ID}}');
```

## Multi-page tours

If a visitor moves to another page during a tour, it continues at the same step on the new page. In a single-page app this works automatically. Set the page rules so they match every page the tour covers.
