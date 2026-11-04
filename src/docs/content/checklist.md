# Checklists

A checklist shows onboarding tasks in a corner of your app, and remembers each visitor's progress.

## Install

```html
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" defer></script>
```

## Keep progress across devices

Progress is stored per visitor. Without more information, that means per browser. To follow a logged-in user, call `identify` before the script shows the checklist:

```js
window.FlowPilot?.identify('user_123');
```

Visitors tick items themselves. Items don't complete automatically when someone does the task.

Changing the list of tasks after publishing can reset progress for visitors whose saved items no longer match.
