# JavaScript API

After the script loads, `window.FlowPilot` is available. Check that it exists first, since a blocker may have stopped the script.

## `FlowPilot.identify(userId)`

Links activity to your own user ID, so analytics can follow a person across devices.

```js
window.FlowPilot?.identify('user_123');
```

Call it before anything is shown, as early as you can. Use an opaque ID rather than an email address, because it's stored with analytics events.

## `FlowPilot.start(projectId)`

Shows an experience now, ignoring its trigger rules and frequency. Use it for a "Show me around" button. It returns a promise that finishes when the experience has been shown.

```js
document.querySelector('#help').addEventListener('click', () => {
  window.FlowPilot?.start('{{PROJECT_ID}}');
});
```

For inline experiences, it fills any `<div data-flowpilot>` that hasn't been filled yet. The project needs to be published.

## `FlowPilot.track(projectId, eventName, metadata)`

Records your own event in Analytics. Names are converted to lowercase with underscores. Don't include personal data in `metadata`.

```js
window.FlowPilot?.track('{{PROJECT_ID}}', 'upgrade_clicked', { plan: 'pro' });
```

## Events recorded automatically

| Event | When |
|---|---|
| `impression` | An experience was shown |
| `page_viewed` | A hosted page was opened |
| `cta_clicked` | A link button was clicked |
| `form_submitted` | A form was sent |
| `tour_step_viewed` | A tour step appeared |
| `tour_step_completed` | Next was clicked on a tour step |
| `tour_step_skipped` | A step was skipped because its target was missing |
| `tour_completed` | The last tour step was finished |
| `tour_skipped` | A tour was closed early |
| `demo_step_viewed` | A demo screen appeared |
| `demo_completed` | The last demo screen was finished |
| `faq_expanded` | An FAQ question was opened |
| `banner_dismissed` | A banner, popup or carousel was closed |

Events are sent in batches every few seconds, so they take a moment to reach your dashboard.

## Single-page apps

The script watches for address changes made with the History API, so React Router, Vue Router and similar work without extra code. On each change it re-checks trigger rules. An overlay stays on screen while the new address still matches its rules, and a tour in progress continues at the same step.
