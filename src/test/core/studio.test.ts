import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GLOBAL_HEADER_SLUG, DEFAULT_THEME, findTreeProblem } from '../../core/schema';
import { createLocalServices } from '../../data/localServices';
import { AppServices } from '../../data/services';
import { useStudio } from '../../studio/store';
import { buildContent, el } from '../../templates';

const headerContent = buildContent('h', [el('Navbar')]);
const pageContent = buildContent('p', [el('Section', {}, [el('Container', {}, [el('Heading', { props: { text: 'Hello' } })])])]);
const ROOT = pageContent.rootId;
const heading = Object.values(pageContent.nodes).find((node) => node.type === 'Heading')!.id;
const container = Object.values(pageContent.nodes).find((node) => node.type === 'Container')!.id;

const state = () => useStudio.getState();
const page = () => state().documents.find((doc) => doc.kind === 'page' && doc.slug === '')!;

describe('editor store', () => {
  let services: AppServices;
  let projectId: string;

  const open = async (readOnly = false) => {
    const project = (await services.projects.get(projectId))!;
    state().load(services, project, await services.projects.listDocuments(projectId), readOnly);
  };

  beforeEach(async () => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    services = createLocalServices();
    projectId = await services.projects.create({
      organizationId: 'org',
      type: 'website',
      title: 'Site',
      variables: { name: 'Acme' },
      theme: DEFAULT_THEME,
      settings: {},
      documents: [
        { kind: 'page', title: 'Home', slug: '', content: pageContent },
        { kind: 'global', title: 'Header', slug: GLOBAL_HEADER_SLUG, content: headerContent },
      ],
    });
    await open();
  });

  afterEach(() => {
    state().reset();
    vi.useRealTimers();
  });

  describe('blocks', () => {
    it('adds into the selected container and selects the new block', () => {
      state().select(container);
      const id = state().addBlock('Text')!;
      expect(page().content.nodes[container].children).toContain(id);
      expect(state().selectedId).toBe(id);
    });

    it('adds after a selected block that cannot contain it', () => {
      state().select(heading);
      const id = state().addBlock('Text')!;
      expect(page().content.nodes[container].children).toEqual([heading, id]);
    });

    it('falls back to the page root when nothing is selected', () => {
      const id = state().addBlock('Section')!;
      expect(page().content.nodes[ROOT].children).toContain(id);
    });

    it('refuses a block with no valid parent here', () => {
      state().select(heading);
      expect(state().addBlock('DemoHotspot')).toBeNull();
      expect(findTreeProblem(page().content)).toBeNull();
    });

    it('edits the document that owns the block, including shared sections', () => {
      const nav = Object.values(headerContent.nodes).find((node) => node.type === 'Navbar')!.id;
      state().updateProps(nav, { brand: 'New brand' });
      const header = state().documents.find((doc) => doc.slug === GLOBAL_HEADER_SLUG)!;
      expect(header.content.nodes[nav].props.brand).toBe('New brand');
      expect(state().dirtyDocuments).toEqual([header.id]);
    });

    it('moves a block, refusing invalid parents', () => {
      const section = state().addBlock('Section', ROOT)!;
      expect(state().moveBlock(heading, section, 0)).toBe(true);
      expect(page().content.nodes[section].children).toEqual([heading]);
      expect(state().moveBlock(heading, heading, 0)).toBe(false);
      expect(findTreeProblem(page().content)).toBeNull();
    });

    it('does not move or delete locked blocks', () => {
      state().updateNode(heading, { locked: true });
      state().removeBlock(heading);
      expect(page().content.nodes[heading]).toBeDefined();
      expect(state().moveBlock(heading, ROOT, 0)).toBe(false);
    });

    it('never deletes the root', () => {
      state().removeBlock(ROOT);
      expect(page().content.nodes[ROOT]).toBeDefined();
    });

    it('stores styles per device without touching desktop', () => {
      state().updateStyle(heading, 'fontSize', '40px');
      state().setDevice('mobile');
      state().updateStyle(heading, 'fontSize', '20px');
      const node = page().content.nodes[heading];
      expect(node.styles.fontSize).toBe('40px');
      expect(node.responsive?.mobile?.fontSize).toBe('20px');
      state().updateStyle(heading, 'fontSize', '');
      expect(page().content.nodes[heading].responsive?.mobile?.fontSize).toBeUndefined();
    });

    it('changes nothing in read-only mode', async () => {
      await open(true);
      state().updateProps(heading, { text: 'Nope' });
      state().updateDraft((draft) => { draft.title = 'Nope'; });
      expect(state().addBlock('Text')).toBeNull();
      expect(page().content.nodes[heading].props.text).toBe('Hello');
      expect(state().draft!.title).toBe('Site');
      expect(state().past).toEqual([]);
    });
  });

  describe('undo and redo', () => {
    it('reverses and restores an edit', () => {
      state().updateProps(heading, { text: 'Changed' });
      state().undo();
      expect(page().content.nodes[heading].props.text).toBe('Hello');
      state().redo();
      expect(page().content.nodes[heading].props.text).toBe('Changed');
    });

    it('groups fast typing into one step', () => {
      for (const text of ['H', 'Hi', 'Hi!']) {
        state().updateProps(heading, { text });
        vi.advanceTimersByTime(100);
      }
      expect(state().past).toHaveLength(1);
      state().undo();
      expect(page().content.nodes[heading].props.text).toBe('Hello');
    });

    it('separates edits after a pause, and edits to different fields', () => {
      state().updateProps(heading, { text: 'A' });
      vi.advanceTimersByTime(1100);
      state().updateProps(heading, { text: 'B' });
      expect(state().past).toHaveLength(2);
      state().updateProps(heading, { level: 'h1' });
      expect(state().past).toHaveLength(3);
    });

    it('clears redo after a new edit', () => {
      state().updateProps(heading, { text: 'A' });
      state().undo();
      state().updateProps(heading, { text: 'B' });
      state().redo();
      expect(page().content.nodes[heading].props.text).toBe('B');
    });

    it('undoes adding a block and clears the selection', () => {
      state().select(container);
      state().addBlock('Text');
      state().undo();
      expect(page().content.nodes[container].children).toEqual([heading]);
      expect(state().selectedId).toBeNull();
    });

    it('undoes project-level changes in the same history', () => {
      state().updateDraft((draft) => { draft.variables = { name: 'New' }; }, 'variables');
      state().updateProps(heading, { text: 'Changed' });
      state().undo();
      state().undo();
      expect(state().draft!.variables.name).toBe('Acme');
      expect(page().content.nodes[heading].props.text).toBe('Hello');
    });
  });

  describe('saving', () => {
    const saved = async () => (await services.projects.listDocuments(projectId)).find((doc) => doc.slug === '')!;

    it('autosaves after a pause, and only then', async () => {
      state().updateProps(heading, { text: 'Auto' });
      expect(state().status).toBe('dirty');
      expect((await saved()).content.nodes[heading].props.text).toBe('Hello');

      await vi.advanceTimersByTimeAsync(1300);
      expect((await saved()).content.nodes[heading].props.text).toBe('Auto');
      expect(state().status).toBe('saved');
      expect(state().dirtyDocuments).toEqual([]);
    });

    it('saves project details', async () => {
      state().updateDraft((draft) => { draft.title = 'Renamed'; });
      await state().saveNow();
      expect((await services.projects.get(projectId))!.title).toBe('Renamed');
    });

    it('keeps saving correctly across several saves', async () => {
      state().updateProps(heading, { text: 'One' });
      await state().saveNow();
      state().updateProps(heading, { text: 'Two' });
      await state().saveNow();
      expect((await saved()).content.nodes[heading].props.text).toBe('Two');
      expect(state().status).toBe('saved');
    });

    it('stays dirty when an edit lands during a save', async () => {
      const original = services.projects.saveDocument;
      services.projects.saveDocument = async (...args) => {
        const result = await original(...args);
        state().updateProps(heading, { text: 'During save' });
        return result;
      };
      state().updateProps(heading, { text: 'Before' });
      await state().saveNow();
      expect(state().dirtyDocuments).toHaveLength(1);
      expect(state().status).toBe('dirty');

      services.projects.saveDocument = original;
      await state().saveNow();
      expect((await saved()).content.nodes[heading].props.text).toBe('During save');
    });

    it('detects when someone else saved first, keeping both versions available', async () => {
      const doc = await saved();
      await services.projects.saveDocument(doc.id, { title: 'Theirs' }, doc.revision);

      state().updateProps(heading, { text: 'Mine' });
      await state().saveNow();
      expect(state().status).toBe('conflict');
      expect((await saved()).title).toBe('Theirs');
      expect(page().content.nodes[heading].props.text).toBe('Mine');
    });

    it('can load the other version after a conflict', async () => {
      const doc = await saved();
      await services.projects.saveDocument(doc.id, { title: 'Theirs' }, doc.revision);
      state().updateProps(heading, { text: 'Mine' });
      await state().saveNow();

      await state().reloadFromServer();
      expect(state().status).toBe('saved');
      expect(page().title).toBe('Theirs');
      expect(page().content.nodes[heading].props.text).toBe('Hello');
    });

    it('can keep local work after a conflict', async () => {
      const doc = await saved();
      await services.projects.saveDocument(doc.id, { title: 'Theirs' }, doc.revision);
      state().updateProps(heading, { text: 'Mine' });
      await state().saveNow();

      await state().overwriteServer();
      expect(state().status).toBe('saved');
      expect((await saved()).content.nodes[heading].props.text).toBe('Mine');
    });

    it('reports a failed save, keeps the work, and can retry', async () => {
      const original = services.projects.saveDocument;
      services.projects.saveDocument = async () => {
        throw new Error('Network down');
      };
      state().updateProps(heading, { text: 'Precious' });
      await state().saveNow();
      expect(state().status).toBe('error');
      expect(state().saveError).toBe('Network down');
      expect(state().dirtyDocuments).toHaveLength(1);

      services.projects.saveDocument = original;
      await state().saveNow();
      expect(state().status).toBe('saved');
      expect((await saved()).content.nodes[heading].props.text).toBe('Precious');
    });
  });

  describe('pages', () => {
    it('adds and switches to a new page', async () => {
      await state().addPage('About', 'about');
      expect(state().documents.find((doc) => doc.id === state().activeDocumentId)!.slug).toBe('about');
    });

    it('reports a duplicate address', async () => {
      await state().addPage('About', 'about');
      await expect(state().addPage('About again', 'about')).rejects.toThrow(/already exists/);
    });

    it('will not delete the last page', async () => {
      await expect(state().deletePage(page().id)).rejects.toThrow(/at least one page/);
    });

    it('removes history for a deleted page, so undo cannot fail', async () => {
      await state().addPage('About', 'about');
      const about = state().activeDocumentId!;
      state().addBlock('Section');
      await state().deletePage(about);
      expect(state().past).toEqual([]);
      state().undo();
      expect(state().documents.some((doc) => doc.id === about)).toBe(false);
    });
  });
});
