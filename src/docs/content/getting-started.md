# Getting started

FlowPilot lets you build websites, forms, product tours and other experiences from templates. There are three steps:

1. **Choose a template.** Go to **Create new** and pick one.
2. **Fill in your details.** The preview updates as you type. Your details are stored as variables, so changing one later updates it everywhere it appears.
3. **Edit and publish.** Your project opens in the editor, where you can change anything. Every project gets a web address when you publish it.

## How each type reaches your visitors

| Type | How visitors see it |
|---|---|
| Website, Page | Hosted by FlowPilot at its own web address |
| Tour, Banner | Floats over your site, after you add one script |
| Form, Demo, Menu, FAQ | Sits inside your page, where you place a `<div>` |

Every type can also be opened directly at its web address, which is useful for sharing a form or demo as a link.

## Install on your site

Everything except hosted websites uses the same script. Replace nothing here: when you open this guide from a project, its ID is already filled in.

```html
<script src="{{ORIGIN}}/flowpilot.js" data-project-id="{{PROJECT_ID}}" defer></script>
```

See the [installation guide](install) for your platform.

## Publishing and changes

- Editing never changes what's live. Visitors see the last published version until you publish again.
- Every publish is saved as a version. Open a project to restore an older one into your draft.
- **Take offline** stops a project being shown, without deleting it.

## Where to go next

- [Websites](website), [pages](page), [tours](tour), [forms](form)
- [JavaScript API](api)
- [Troubleshooting](troubleshooting)
