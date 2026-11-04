# Popups

A popup shows a message or offer in the center of the screen.

## Install

```html
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" defer></script>
```

## When it appears

Click an empty part of the canvas to choose:

- **Delay:** seconds after the page loads.
- **After scrolling:** a percentage of the page.
- **When the visitor is about to leave:** the mouse moving out of the window. This doesn't work on touch devices.

If you set more than one, the first to happen shows the popup. Show popups sparingly: search engines can penalize intrusive ones on mobile.

Clicking outside the popup closes it. A button set to **Close** does the same.
