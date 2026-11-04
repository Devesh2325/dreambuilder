# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

FlowPilot is a visual builder for in-app experiences (tours, demos, landing pages, banners, menus, FAQs, popups, checklists, surveys, pricing, testimonials, forms). It is a React 19 + TypeScript + Vite + Tailwind 3 single-page app.

## Revamp in progress

A full rebuild is underway on the `revamp` branch, with a Supabase backend. The new app is mounted at `/v2` and grows next to the old one, which is deleted at the end. Everything below "Docs vs. code" and "Architecture" describes the **old** app, which has no backend and keeps all data in `localStorage`.

New code so far:

- `supabase/migrations/`: schema, row-level security and signup triggers. Clients only get the columns granted there, so a new client-writable column needs a `grant`, and privileged writes (publishing, plan changes) go through functions.
- `src/test/db/`: runs the migrations on PGlite (in-process Postgres, no Docker) with Supabase's `auth`, `storage` and default grants stubbed. Every migration change needs security tests here.
- `src/data/`: `services.ts` defines the interfaces the app uses; `supabaseServices.ts` implements them. App code must not import the Supabase client directly, and tests inject fakes (`src/test/app/fakeServices.ts`).
- `src/app/`: the new app. Paths come from `routes.ts`.

Setup is in `docs/SUPABASE_SETUP.md`. The planned new folders are `src/core/` (pure schemas, tree operations, variable engine), `src/renderer/`, `src/templates/`, `src/studio/` (editor), `src/embed/` and `src/docs/`.

## Commands

```bash
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npm test          # vitest run (jsdom, globals enabled)
npx tsc -b        # typecheck only

npx vitest run src/test/editor.test.ts         # one test file
npx vitest run src/test/editor.test.ts -t "undo"   # tests matching a name
```

`npm run lint` currently exits 1 on existing issues: 3 `rules-of-hooks` errors (`TourSimulationOverlay.tsx`, `Header.tsx`) and about 205 warnings. Compare against this baseline rather than expecting a clean run.

## Docs vs. code

`README.md`, `BUILD_PLAN.md` and `IMPLEMENTATION_STATUS.md` describe more than is built. Trust the code. These are not implemented, even though the docs or `.env.example` imply they are:

- **Supabase / cloud sync:** the old app has no client and reads no `VITE_*` variables.
- **Real AI:** `services/aiService.ts` is a rule-based mock that matches keywords in the prompt. `VITE_AI_*` is ignored.
- **Authentication:** login and signup just navigate to `/dashboard`, and no route is guarded. The user comes from `localStorage`.
- **Permission enforcement:** `useAuth().can()` and `ROLE_PERMISSIONS` exist, but nothing calls `can()`. `PLAN_LIMITS` is only read by `BillingPage` and tests, so plan limits are not enforced either.
- **Autosave:** saving is manual (`Ctrl+S` or the TopBar). `isDirty` only drives UI state.
- **Other unused pieces:** `@tanstack/react-query` has no provider or queries. IndexedDB is not used.
- **Analytics ingestion:** the dashboard shows events seeded by `storage.ts`. The only `recordAnalyticsEvent` caller in `src/` is the unused TS runtime.

## Architecture

### Document model

Every experience is a `DocumentModel` (`src/types/document.ts`) whose `rootNode` is a recursive `ComponentNode` tree. A node holds `type`, `props`, `styles`, per-device `responsive` overrides, `children`, and optional `target` (tour anchoring) and `interaction`. Each `Project` points to one document through `documentId`. A node's `type` is a key into `COMPONENT_REGISTRY`.

### Three registries work together

- **`COMPONENT_REGISTRY`** (`editor/registry/componentRegistry.tsx`) defines each block: its `render` component, `defaultProps`, `defaultStyles`, `isContainer`, `supportedModules`, and `propertyFields`. `propertyFields` drives the inspector form in `RightPanel`.
- **`MODULE_REGISTRY`** (`editor/modules/moduleRegistry.ts`) has one entry per `ExperienceType`: UI metadata, the root type, and the `primaryBlockTypes` / `secondaryBlockTypes` that `LeftPanel` recommends.
- **Seed factories** (`services/seedData.ts`, `create<Type>Document`, `createBlankDocument`) build starter documents. `CreateExperienceModal` selects one with a `switch` on type.

To add a block, add a `COMPONENT_REGISTRY` entry and list it in the relevant modules' block types.

To add an experience type, update all of these:
- `ExperienceType`
- `MODULE_REGISTRY`
- a seed factory and the `CreateExperienceModal` switch
- the container mapping if it has its own root container (duplicated in `loadDocument` and `insertNode`)
- a `ModuleListingView` wrapper in `pages/modules/`, plus its route in `App.tsx` and a `Sidebar` link

### Editor state

`editor/store/useEditorStore.ts` is one Zustand store holding the document, selection, UI state and history.

- Tree changes must go through store actions. They rebuild the tree immutably and end in `setDocument`, which snapshots a deep copy into `history` (capped at 50) and sets `isDirty`. Undo and redo replay those snapshots.
- Each `updateNode*` call records one history entry, so per-keystroke updates add one undo step per keystroke.
- `insertNode` redirects drops on non-container nodes to become the next sibling, and auto-wraps a leaf root in a container. `loadDocument` also wraps legacy leaf roots and creates a banner document when the ID is unknown (self-healing), so loading a bad ID writes a new document to storage.
- `componentRegistry.tsx` and `useEditorStore.ts` import each other. Container renderers call `useEditorStore.getState()` directly. Avoid reading either export at module-evaluation time.

### Canvas and shared rendering

The canvas is plain DOM with no iframe. `CanvasNodeRenderer` recursively renders nodes through `definition.render` and sets `id={node.id}` on each wrapper, which is what the target picker's `#<node.id>` selectors rely on. Drag and drop uses the HTML5 API with the MIME types in `editor/utils/dragDropUtils.ts`.

`LivePreviewPage` reuses `CanvasNodeRenderer`, so it reads the editor store too. Any change to that renderer affects both the editor and the preview.

Device modes merge `node.responsive[deviceMode]` over `node.styles` at render time; they are not CSS media queries.

### Persistence

`services/storage.ts` exports a `storage` singleton that is synchronous and seeds `flowpilot_*` keys on import. All persistence should go through it, and components call it directly.

- Stored data takes priority over seeds, so changes to `seedData.ts` do not reach a browser that is already seeded. Clear `flowpilot_*` keys in `localStorage` to see them.
- `getProjects` always merges `SEED_PROJECTS` back in, so deleted seed projects reappear. Templates merge the same way.
- Publishing (`publishDocument`) stores a full snapshot in `flowpilot_doc_versions`; rollback restores one.
- `CreateExperienceModal` generates a project ID for the document, then `storage.createProject` generates its own, so `doc.projectId` can differ from the real project's `id`. `saveDocument` and `publishDocument` update the project through `doc.projectId`, so those updates can silently miss it, and the embed snippet uses the same ID.

### Embed runtime

There are two separate implementations, so a behavior change must be made in the right one:

- **`public/flowpilot.js`** is the hand-written ES5 script that is actually served and referenced by the snippet in `PublishModal`. It reads `flowpilot_projects` and `flowpilot_documents` from `localStorage`, so it only works on the same origin as the builder, and it requires `project.status === 'published'`.
- **`src/runtime/flowpilot-runtime.ts`** is a TypeScript class that nothing imports and no build step bundles.

Both render experiences with their own hard-coded HTML rather than `COMPONENT_REGISTRY`, so runtime output does not match the canvas.

### AI assistant

`AiAssistantPanel` calls `aiService.processRequest`, which returns an `AIChangeProposal`. Apply passes `proposal.modifiedDocumentSnapshot` to `setDocument`; the `commands` list is only displayed. Replacing the mock means producing that same proposal shape.

### Routing and shell

Routes are in `src/App.tsx`. `/editor/:documentId` and `/preview/:documentId` are full-screen, outside `AppLayout`; everything else renders in the sidebar and header shell. `pages/modules/*Page.tsx` are thin wrappers around `ModuleListingView`, and their metric values are hard-coded.

## Conventions

- Dark mode uses Tailwind's `class` strategy, with `dark` set on `<html>` by `ThemeProvider`. Pair light styles with `dark:` variants.
- Node `styles` are inline CSS objects, so user-editable appearance belongs in `styles`/`defaultStyles`, while renderer Tailwind classes provide the base look.
- The `@/` alias maps to `src/`, but existing code uses relative imports.
- Tests live in `src/test/` and exercise the store and pure data directly. There are no component render tests yet.
