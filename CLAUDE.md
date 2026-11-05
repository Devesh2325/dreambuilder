# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

FlowPilot builds websites, pages, tours, forms, demos, banners, menus and FAQs from variable-driven templates. Logged-out visitors at `/` see `src/app/landing/LandingPage.tsx`. Popups and carousels are styles of the banner module, not modules of their own. It is a React 19 + TypeScript + Vite + Tailwind 3 app with a Supabase backend, and has no server code of its own.

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
- `localServices.ts`: keeps everything in this browser, in IndexedDB through `localStore.ts` (localStorage holds only about 5 MB, and tests without IndexedDB fall back to it). Used for demos and Playwright. `src/data/index.ts` selects it when `VITE_BACKEND=local`, or in dev when Supabase isn't configured, and never otherwise in production. It isn't secure and only approximates the database's rules.

A new data feature needs changes in the interface, both implementations, and usually a migration.

Super admins, plans, nudges and support are repositories too (`admin`, `plans`, `nudges`, `support`, `profile`). On the real backend a super admin is a row in `platform_admins`, added only by SQL (`docs/SUPABASE_SETUP.md`), and every `admin_*` function checks it. In the local backend the first account made in that browser is the super admin, so the demo can try it.

## Database and security

Security lives in `supabase/migrations/`, not the UI. `useWorkspace().can()` only hides buttons.

- Default grants are revoked and re-granted **per column**. A new client-writable column needs a `grant`, and columns like `plan`, `status` and `published_version_id` are deliberately not writable by clients.
- Privileged writes go through `SECURITY DEFINER` functions, which must set `search_path = ''` and check roles themselves. New functions need an explicit `revoke`/`grant`: `engagement.sql` re-grants them all, so a later migration must repeat this for its own.
- Visitors have no login. They only reach functions that require the project to be published. Webhook addresses, the address a tour is built on and the variable list are stripped from public snapshots, in `public_snapshot` and in the local backend.
- Plan limits start as the seeds in `plan_settings` and the defaults in `src/types/auth.ts`, which the local backend uses. Keep them in step. After that a super admin changes them in the app, so read them through `plans.list()`, never `PLAN_LIMITS`, in any UI. `plan_module_quotas` adds a limit per module, and no row means only the overall limit applies.

`src/test/db/` runs the migrations on PGlite (in-process Postgres, no Docker), with Supabase's `auth`, `storage` and default grants stubbed. Every migration change needs tests there. PGlite's `query` takes one statement at a time; use `t.db.exec` for several.

## How rendering works

A document is `{ rootId, nodes }`: a flat map of `DocNode`s, where `children` lists ids (`src/core/schema.ts`). Node ids become CSS class names, so their characters are restricted.

`expandContent` (`src/core/variables.ts`) turns a document plus variable values into a `RenderNode` tree: it resolves `{{tokens}}`, repeats nodes over list variables, and applies `showIf`. A repeated node gets a unique `key` per instance, while `sourceId` still points at the stored node.

There is **one renderer** for the editor, previews, public sites and the embed: `src/renderer/`. Consequences:

- `blocks.tsx` must not use Tailwind or lucide, because it also runs in a Shadow DOM on customers' sites under Preact. Styling is `BASE_CSS` plus generated per-node rules in `css.ts`. Blocks must spread `attrs` on their outer element, which carries the style class and the `data-fp-node` attribute the editor relies on.
- Device styles become real media queries. The editor and previews draw inside an iframe (`Frame.tsx`) so those queries respond to the simulated width.
- User data reaches CSS and links, so `safeCssValue`, `safeUrl` and `safeImageUrl` must stay in the path. `safeImageUrl` also allows SVG data, which is only safe in an `img` tag, so never use it for links.
- Links go through `handleLinkClick` in `blocks.tsx`. Previews run in a `srcdoc` iframe, where every link, even `#`, resolves against the app's address, so following one would load the app inside the preview. Public sites share an origin with the builder, so there is deliberately no custom HTML or script block, and text is never rendered as HTML.

`src/experience/` is what plays published content: `ExperiencePlayer` for tours, demos, overlays and so on, and `SiteView` for multi-page sites (header + page + footer). Each module's `delivery` in `src/core/modules.ts` (`site`, `overlay`, `inline`) decides how it reaches visitors.

To add a block, add it to both `blockMeta.ts` and `BLOCK_RENDERERS`; a test checks they match. The properties panel is generated from `fields`. A field with `plain` is a technical value and offers no variables, and `slug` also cleans what's typed. It only appears in a module's Add panel if listed in `BLOCK_GROUPS` in `src/studio/LeftPanel.tsx`.

`PaymentButton` is only a link to a provider's hosted page, https only, so card details never touch this app. `ProjectEmbed` shows another project through `ctx.renderEmbed`, which only the app passes (`experience/EmbeddedProject.tsx`): the editor and previews load drafts, and public sites load published snapshots. The embed script doesn't support it. An embedded project gets prefixed node ids and a `scopeId`, because node ids become class names and `.fp-root` holds the theme, so without them it would take over the host page's styles. It gets no `renderEmbed` of its own, which prevents loops.

To add a module, update `PROJECT_TYPES`, `MODULES` and `PATHS` (`src/core/modules.ts`), the `projects.type` check in the migrations, `MODULE_COLUMNS` (`moduleColumns.tsx`), `BLOCK_GROUPS`, templates, and a docs guide. Each module has its own list page at `MODULES[type].path`. `ProjectsPage` and `ProjectPage` are shared by all modules, and what differs comes from `MODULE_COLUMNS`. Creating goes `/create?type=` (choose a template), `/new/:templateId` (fill in details), then straight to the editor.

## Templates

`src/templates/` defines templates with the `el()` helpers. Each declares `variables`, which also generate the wizard form (`VariableForm`). Values are stored per project, and nodes keep their tokens, so a change in **Variables** updates everywhere. Typing over a token in the editor detaches only that spot. A project's variables are its template's plus `settings.variableDefs` (`projectVariableDefs`), which holds ones added in the editor or carried from a team template.

Files: `websites.ts` and `industries.ts` (websites, using `industrySite` for most), `pages.ts`, `layouts.ts` and `experiences.ts` (landing pages and the other modules), `banners.ts`, `sections.ts` (the section library), `library.ts` (saving and reading team items), and `assets.ts` (stock photos that were checked to load, and generated product screens for demos). A template's `category` drives the filter on the create page.

Global variables live in `organizations.branding.globalVariables` with keys starting `global.`. `syncGlobals` copies their values into each project's variables when it's opened, so a published snapshot contains them. A template def with `askOnCreate: false` stays off the wizard's form.

Team templates and sections live in `workspace_library` (`LibraryRepository`). Team template ids start with `team:`, so `getTemplate` doesn't know them; `teamTemplate` validates a stored row into a `TemplateDefinition`, and its variables are copied to the project. A saved section stores the expanded tree with values filled in, so it needs no variables. A saved template keeps its tokens and never carries the webhook address.

`src/test/core/templates.test.tsx` is a contract test over every template: tokens must be declared and used, defaults must validate, block nesting must be allowed, and nothing may render a leftover `{{`. `library.test.tsx` checks sections the same way.

## Editor

`src/studio/store.ts` is a Zustand store.

- All edits go through `editDocument` or `updateDraft`, which use immer `produceWithPatches` to record undo history. Edits with the same `key` within 1 second merge into one undo step.
- There is one side panel, with the active tool in the store (`tool`). Clicking a block on the canvas opens `edit`, so the canvas gets the rest of the screen. Clicking the open tool closes the panel.
- Steps, demo screens, slides and form steps show one at a time. `steps.ts` finds them in the expanded tree, `activeStepKey` holds the choice, and `ctx.visibleStep` makes `RenderedNode` draw only that one, in edit mode only. Selecting a block in another step switches to it. Steps from a list variable are added and removed by editing that list.
- Style values are strings, and a plain number means pixels (`declarations` in `css.ts`), except for `UNITLESS` properties. Every control in `StylePanel.tsx` is checked against computed style in `e2e/editor.spec.ts`.
- Spacing boxes show real values: most spacing comes from `BASE_CSS`, not the node, so `useComputedBox` reads the computed style from the canvas iframe for the placeholders.
- `highlightedVariable` outlines every use of a variable on the canvas, and `focusVariable` opens Variables on one. Fields in that panel carry `data-var`.
- A website canvas shows header + page + footer together, so actions find the owning document with `documentOfNode`.
- Autosave is debounced. Each save sends the `revision` it loaded; a stale one matches no rows and returns `conflict`, which the UI resolves through `reloadFromServer` or `overwriteServer`.
- `Canvas.tsx` attaches native listeners to the iframe's document, and draws the selection overlay inside the iframe with inline styles, since app CSS doesn't reach it. Elements there fail `instanceof` checks because they belong to another document.
- Blocks are dragged directly: `onMove` sets `draggable` on only the block under the mouse, so the drag starts on the innermost one. Hotspots are moved with the mouse instead.
- The canvas shows exactly what visitors see: hidden blocks and unmet `showIf` conditions aren't drawn, and stay reachable from Layers.
- The frame is sized to fit the stage at every zoom, so the stage never scrolls and pages scroll only inside the frame. Desktop renders at least `DESKTOP_MIN_WIDTH` wide and scales down, so small screens don't trigger tablet styles.
- `sr-only` elements are absolutely positioned. Keep a `relative` ancestor inside any scrolling panel, or they extend the whole page's scroll height. `e2e/studio.spec.ts` checks this.

## Embed script

`src/embed/flowpilot.tsx`, built by `vite.embed.config.ts` into one file with Preact replacing React. `npm run build` fails if it exceeds the limit in `scripts/check-embed-size.mjs`. Avoid importing `zod` or `src/core/schema.ts` values into anything it reaches, which is why validation lives in `core/validation.ts`.

`public/flowpilot.js` is generated and ignored by git. The script reads Supabase settings at build time. Failures must never break the customer's page.

The editor can drive the script on a customer's site, to pick an element, build a tour or test a draft (`#fp-pick`, `#fp-build`, `#fp-test`). This needs `window.opener`, and the opener's origin must be the script's own origin or `data-builder-origin`, so no other site can read clicks or show content there.

Video iframes only ever point at YouTube or Vimeo: `parseVideoUrl` in `core/video.ts` rebuilds the address from a checked id.

The docs in `src/docs/content/` are checked by `src/test/core/docs.test.ts` against the JS API, recorded events and script attributes. Update them together.

## In-app help

`src/app/tours/AppTour.tsx` holds FlowPilot's own tours, played by the customer tour player. They target `data-tour` attributes in the app, and start once per browser (`fp_tour_seen_*`). The `signUp` helper in `e2e/helpers.ts` marks them as seen, or they would cover what tests click; pass `{ tours: true }` to test them. Empty pages use `FlowPilotBanner`, and the landing page's demo (`ProductDemo`) uses the demo player with generated screens.

## Browser tests

`e2e/` runs against the local backend. `host-server.mjs` plays a customer's site on a second origin, with the real embed built to point at `http://supabase.test`, which `embed.spec.ts` intercepts. This means the Supabase client code path isn't covered by automated tests, only the database rules and the local backend separately.
