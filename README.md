# FlowPilot

Build websites, pages, product tours, forms and other in-app experiences from templates. Choose a template, fill in your details, adjust the design in the editor if you want, then publish to a web address or embed it in your own site.

## Try it

```bash
npm install
npm run dev
```

Open http://localhost:5173. With no configuration it runs in demo mode, saving everything in your browser, so you can use the whole app without an account anywhere. Sign up with any email.

To go live, connect Supabase: see [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

## What's included

| Module | How visitors see it |
|---|---|
| Websites, Pages | Hosted at `/s/your-address` |
| Tours, Banners (bars, popups, carousels) | Float over your site, using one script |
| Forms, Demos, Menus, FAQs | Placed inside your page, or shared as a link |

- **Templates with variables:** 73 templates, by industry, including blogs, docs and landing pages. A value changed once updates everywhere it's used.
- **Team library:** 24 ready-made sections, plus sections and templates your team saves for reuse.
- **Module pages:** each module has its own table with search, filters, sorting and row actions, and opens the create page on its own templates.
- **Editor:** drag and drop, per-device styles, a menu editor, undo and redo, autosave, save conflict handling.
- **Publishing:** versions and restore. Editing never affects what's live until you publish.
- **Forms:** multi-step, responses inbox, CSV export, webhooks, spam protection.
- **Tours:** target real elements on your site, with a visual picker, missing-target handling and resume.
- **Embed script:** about 21 KB compressed, isolated in Shadow DOM, with a JavaScript API.
- **Teams:** workspaces, roles enforced by the database, invitation links.
- **Docs:** integration guides inside the app at `/docs`.

## Not included yet

- Online payments. Plan limits are enforced, but plans are changed manually.
- Custom domains.
- Server-side rendering of public sites, which would help SEO.
- Invitation and form notification emails. Invitations are links you send yourself.
- Connectors such as GA4 or Slack. Webhooks are available for forms.
- An AI assistant.

## Commands

```bash
npm run dev        # dev server (also builds the embed script into public/)
npm run build      # typecheck, build the app and embed script, check embed size
npm run lint       # oxlint
npm test           # unit, component and database security tests
npm run test:e2e   # browser tests (first run: npx playwright install chromium)
```

## License

MIT
