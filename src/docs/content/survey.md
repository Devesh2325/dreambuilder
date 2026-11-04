# Surveys

A survey asks NPS, rating or open questions inside your product, and floats in a corner.

## Install

```html
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" defer></script>
```

## Questions

Use **Rating scale** for NPS (0 to 10) or satisfaction (1 to 5), and **Form field** for open questions.

Answers appear with the project, and can be exported or sent to a [webhook](webhooks). FlowPilot doesn't calculate an NPS score for you yet, so export to CSV for that.

To avoid asking too soon, set a delay, or use page rules to ask after a key step.
