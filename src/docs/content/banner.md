# Banners

A banner gets your message seen. It comes in four styles, all using the same script:

- **Simple:** a message bar at the top or bottom of the page.
- **Modern:** a bolder bar with a gradient, image or button.
- **Popup:** a message in the center of the screen.
- **Carousel:** several messages or slides that take turns.

## Install

```html
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" defer></script>
```

## Position

Click an empty part of the page in the editor, then choose **Top of the page**, **Bottom of the page** or **Inside my page**. To place it inside your page, also add this where it should appear:

```html
<div data-flowpilot="{{PROJECT_ID}}"></div>
```

Popups always appear in the center of the screen. A top or bottom bar covers the content beneath it instead of pushing it down.

## When it appears

In the same place, choose which pages it appears on and how often. You can also show it:

- **After a delay:** seconds after the page loads.
- **After scrolling:** a percentage of the page.
- **When the visitor is about to leave:** the mouse moving out of the window. This doesn't work on touch devices.

If you set more than one, the first to happen wins. Show popups sparingly, because search engines can penalize intrusive ones on mobile.

## Carousels

Edit the slides under **Details**. Select the carousel block to change how many seconds each slide shows and whether arrows appear. Rotation pauses while the mouse is over it, and stops for visitors who have asked their device to reduce motion.
