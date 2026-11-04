# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

FlowPilot builds websites, pages, tours, forms and other in-app experiences from variable-driven templates. It is a React 19 + TypeScript + Vite + Tailwind 3 app with a Supabase backend, and has no server code of its own.

## Commands

```bash
npm run dev        # builds the embed into public/, then starts Vite on :5173
npm run build      # tsc -b, app build, embed build, embed size check
npm run lint       # oxlint
npm test           # vitest: unit, component and database tests
npm run test:e2e   # Playwright (first run: npx playwright install chromium)

npx tsc -b                                  # typecheck only
npx vitest run src/test/core/studio.test.ts # one file
npx vitest run src/test/db -t "invitations" # by name
npx playwright test -g "survey"             # one browser test
```

## Backends

`src/data/services.ts` defines the interfaces the app uses, and `AppServices` reaches components through `useServices()`. App code must not import the Supabase client directly.

- `supabaseServices.ts`: real backend. `publicApi.ts` is the visitor-facing part, using plain `fetch` so public pages and the embed don't bundle supabase-js.
- `localServices.ts`: stores everything in `localStorage`. Used for demos and Playwright. `src/data/index.ts` selects it when `VITE_BACKEND=local`, or in dev when Supabase isn't configured, and never otherwise in production. It isn't secure and only approximates the database's rules.

A new data feature needs changes in the interface, both implementations, and usually a migration.

## Database and security

Security lives in `supabase/migrations/`, not the UI. `useWorkspace().can()` only hides buttons.

- Default grants are revoked and re-granted **per column**. A new client-writable column needs a `grant`, and columns like `plan`, `status` and `published_version_id` are deliberately not writable by clients.
- Privileged writes go through `SECURITY DEFINER` functions, which must set `search_path = ''` and check roles themselves. New functions need an explicit `revoke`/`grant`: `engagement.sql` re-grants them all, so a later migration must repeat this for its own.
- Visitors have no login. They only reach functions that require the project to be published. Webhook addresses are stripped from public snapshots, in `public_snapshot` and in the local backend.
- Plan limits are in both `src/types/auth.ts` and `plan_max_*` in the migrations. Keep them in step.

`src/test/db/` runs the migrations on PGlite (in-process Postgres, no Docker), with Supabase's `auth`, `storage` and default grants stubbed. Every migration change needs tests there. PGlite's `query` takes one statement at a time; use `t.db.exec` for several.

## How rendering works

A document is `{ rootId, nodes }`: a flat map of `DocNode`s, where `children` lists ids (`src/core/schema.ts`). Node ids become CSS class names, so their characters are restricted.

`expandContent` (`src/core/variables.ts`) turns a document plus variable values into a `RenderNode` tree: it resolves `{{tokens}}`, repeats nodes over list variables, and applies `showIf`. A repeated node gets a unique `key` per instance, while `sourceId` still points at the stored node.

There is **one renderer** for the editor, previews, public sites and the embed: `src/renderer/`. Consequences:

- `blocks.tsx` must not use Tailwind or lucide, because it also runs in a Shadow DOM on customers' sites under Preact. Styling is `BASE_CSS` plus generated per-node rules in `css.ts`. Blocks must spread `attrs` on their outer element, which carries the style class and the `data-fp-node` attribute the editor relies on.
- Device styles become real media queries. The editor and previews draw inside an iframe (`Frame.tsx`) so those queries respond to the simulated width.
- User data reaches CSS and links, so `safeCssValue` and `safeUrl` must stay in the path. Public sites share an origin with the builder, so there is deliberately no custom HTML or script block, and text is never rendered as HTML.

`src/experience/` is what plays published content: `ExperiencePlayer` for tours, demos, overlays and so on, and `SiteView` for multi-page sites (header + page + footer). Each module's `delivery` in `src/core/modules.ts` (`site`, `overlay`, `inline`) decides how it reaches visitors.

To add a block, add it to both `blockMeta.ts` and `BLOCK_RENDERERS`; a test checks they match. The properties panel is generated from `fields`.

## Templates

`src/templates/` defines templates with the `el()` helpers. Each declares `variables`, which also generate the wizard form (`VariableForm`). Values are stored per project, and nodes keep their tokens, so a change in **Details** updates everywhere. Typing over a token in the editor detaches only that spot.

`src/test/core/templates.test.tsx` is a contract test over every template: tokens must be declared and used, defaults must validate, block nesting must be allowed, and nothing may render a leftover `{{`.

## Editor

`src/studio/store.ts` is a Zustand store.

- All edits go through `editDocument` or `updateDraft`, which use immer `produceWithPatches` to record undo history. Edits with the same `key` within 1 second merge into one undo step.
- A website canvas shows header + page + footer together, so actions find the owning document with `documentOfNode`.
- Autosave is debounced. Each save sends the `revision` it loaded; a stale one matches no rows and returns `conflict`, which the UI resolves through `reloadFromServer` or `overwriteServer`.
- `Canvas.tsx` attaches native listeners to the iframe's document, and draws the selection overlay inside the iframe with inline styles, since app CSS doesn't reach it. Elements there fail `instanceof` checks because they belong to another document.

## Embed script

`src/embed/flowpilot.tsx`, built by `vite.embed.config.ts` into one file with Preact replacing React. `npm run build` fails if it exceeds the limit in `scripts/check-embed-size.mjs`. Avoid importing `zod` or `src/core/schema.ts` values into anything it reaches, which is why validation lives in `core/validation.ts`.

`public/flowpilot.js` is generated and ignored by git. The script reads Supabase settings at build time. Failures must never break the customer's page.

The docs in `src/docs/content/` are checked by `src/test/core/docs.test.ts` against the JS API, recorded events and script attributes. Update them together.

## Browser tests

`e2e/` runs against the local backend. `host-server.mjs` plays a customer's site on a second origin, with the real embed built to point at `http://supabase.test`, which `embed.spec.ts` intercepts. This means the Supabase client code path isn't covered by automated tests, only the database rules and the local backend separately.
