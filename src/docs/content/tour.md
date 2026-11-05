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

Click an empty part of the page in the editor to set page rules, delay and frequency. Choose **Once per visitor** for onboarding.

To start a tour from a button in your app, use the [JavaScript API](api):

```js
window.FlowPilot?.start('{{PROJECT_ID}}');
```

## Multi-page tours

If a visitor moves to another page during a tour, it continues at the same step on the new page. In a single-page app this works automatically. Set the page rules so they match every page the tour covers.

## Build it on your real site

You don't need to know any code to point a step at something on your site.

1. Add the script to your site, as shown above.
2. In the editor, click **Edit** with nothing selected, and enter the address of your app.
3. Click **Build on my site**. Your site opens in a new tab.
4. Click anything, and it becomes a step here, pointing at what you clicked. Use **Use my site** in the toolbar to move around your app, then **Add steps** to carry on.
5. Click **Test on my site** to play your unpublished tour there. Only you see it.

Your site has to allow pop-ups from this page, and the script has to come from this FlowPilot address. A page where the script isn't found shows you what to add.

## Layouts

Each step has its own layout, under **Content**:

- **Tooltip:** next to an element. Choose its side and where its arrow sits. If there's no room, it flips to the other side.
- **Pop-up:** in the center of the screen. Good for a welcome or a video.
- **Slide-out:** in the corner, without interrupting anyone.
- **Side panel:** the full height of the screen, for longer instructions people follow while using your app.

Add a **Video** block to any step, and paste a YouTube or Vimeo link, or a link to an MP4 file. Long steps scroll inside themselves.

## Options

With nothing selected, **Edit** also has options for the whole tour: progress such as "Step 1 of 5", how long it takes, a close button, closing by clicking outside, arrow keys and Esc, how dark the page goes, the space around a highlighted element, how long to wait for an element to appear, and a page to go to at the end.

A tour can start by itself, when someone clicks an element, or only from your own code with `FlowPilot.start()`. A step can also move on when its element is clicked, and can belong to another page, such as `/reports`.
