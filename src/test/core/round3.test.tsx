import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DEFAULT_THEME } from '../../core/schema';
import { RenderNode } from '../../core/variables';
import { parseVideoUrl } from '../../core/video';
import { createLocalServices } from '../../data/localServices';
import { AppServices } from '../../data/services';
import { positionStep } from '../../experience/tourPosition';
import { generateNodeCss } from '../../renderer/css';
import { ExperienceView } from '../../renderer/ExperienceView';
import { fromFriendly, toFriendly } from '../../studio/SettingsPanel';
import { useStudio } from '../../studio/store';
import { usageCounts } from '../../studio/VariablesPanel';
import { blankProject, buildContent, el, heading, text } from '../../templates';

describe('video links', () => {
  it.each([
    ['https://www.youtube.com/watch?v=jNQXAC9IVRw', 'https://www.youtube-nocookie.com/embed/jNQXAC9IVRw?rel=0'],
    ['https://youtube.com/watch?t=4&v=jNQXAC9IVRw', 'https://www.youtube-nocookie.com/embed/jNQXAC9IVRw?rel=0'],
    ['https://youtu.be/jNQXAC9IVRw?si=abc', 'https://www.youtube-nocookie.com/embed/jNQXAC9IVRw?rel=0'],
    ['https://m.youtube.com/shorts/jNQXAC9IVRw', 'https://www.youtube-nocookie.com/embed/jNQXAC9IVRw?rel=0'],
    ['https://www.youtube.com/embed/jNQXAC9IVRw', 'https://www.youtube-nocookie.com/embed/jNQXAC9IVRw?rel=0'],
    ['https://vimeo.com/123456789', 'https://player.vimeo.com/video/123456789'],
    ['https://player.vimeo.com/video/123456789', 'https://player.vimeo.com/video/123456789'],
  ])('plays %s through the known player', (url, src) => {
    expect(parseVideoUrl(url)).toEqual({ kind: 'iframe', src });
  });

  it('plays direct video files over https', () => {
    expect(parseVideoUrl('https://cdn.example.com/a.mp4?x=1')).toEqual({ kind: 'file', src: 'https://cdn.example.com/a.mp4?x=1' });
    expect(parseVideoUrl('http://cdn.example.com/a.mp4')).toBeNull();
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'https://evil.example/watch?v=jNQXAC9IVRw',
    'https://youtube.com.evil.example/watch?v=jNQXAC9IVRw',
    'https://www.youtube.com/watch?v="><script>',
    'https://www.youtube.com/embed/../../evil',
    'https://vimeo.com/abc',
    'not a link',
    '',
    42,
    null,
  ])('never frames %s', (url) => {
    expect(parseVideoUrl(url)).toBeNull();
  });

  it('draws nothing for visitors when the link is unusable, and asks for one in the editor', () => {
    const content = buildContent('p', [el('Video', { props: { url: 'https://evil.example/x' } })]);
    const live = render(<ExperienceView documents={[content]} theme={DEFAULT_THEME} variables={{}} ctx={{ mode: 'live' }} />);
    expect(live.container.querySelector('.fp-video')).toBeNull();
    live.unmount();
    render(<ExperienceView documents={[content]} theme={DEFAULT_THEME} variables={{}} ctx={{ mode: 'edit' }} />);
    expect(screen.getByText(/Paste a YouTube/)).toBeTruthy();
    cleanup();
  });
});

describe('tooltip position', () => {
  const target = { top: 300, left: 400, width: 100, height: 40 };
  const step = { width: 200, height: 100 };
  const viewport = { width: 1000, height: 800 };

  it('lines up with the start, middle or end of the element', () => {
    expect(positionStep(target, step, viewport, 'bottom', 'start').left).toBe(400);
    expect(positionStep(target, step, viewport, 'bottom', 'center').left).toBe(350);
    expect(positionStep(target, step, viewport, 'bottom', 'end').left).toBe(300);
    expect(positionStep(target, step, viewport, 'right', 'start').top).toBe(300);
    expect(positionStep(target, step, viewport, 'right', 'end').top).toBe(240);
  });

  it('points its arrow at the middle of the element', () => {
    // Middle of the target (450), less the step's left (350), less half the arrow.
    expect(positionStep(target, step, viewport, 'bottom', 'center').caret).toBe(94);
    expect(positionStep(target, step, viewport, 'bottom', 'start').caret).toBe(44);
  });

  it('keeps the arrow on the step, even when pushed against an edge', () => {
    const atEdge = positionStep({ top: 300, left: 990, width: 10, height: 10 }, step, viewport, 'bottom');
    expect(atEdge.left).toBe(792);
    expect(atEdge.caret).toBeLessThanOrEqual(step.width - 24);
    expect(positionStep({ top: 300, left: 0, width: 4, height: 10 }, step, viewport, 'bottom').caret).toBeGreaterThanOrEqual(12);
  });
});

describe('showing a block on some devices', () => {
  const node = (hideOn?: RenderNode['hideOn']): RenderNode => ({ key: 'k', sourceId: 'k', type: 'Box', props: {}, styles: {}, hideOn, children: [] });

  it('hides on each device exactly, so hiding on tablet leaves phones alone', () => {
    expect(generateNodeCss(node(['mobile']))).toBe('@media (max-width:640px){.fp-n-k{display:none!important}}');
    expect(generateNodeCss(node(['tablet']))).toBe('@media (min-width:641px) and (max-width:991px){.fp-n-k{display:none!important}}');
    expect(generateNodeCss(node(['desktop']))).toBe('@media (min-width:992px){.fp-n-k{display:none!important}}');
    expect(generateNodeCss(node())).toBe('');
  });
});

describe('names instead of code', () => {
  const names = [{ key: 'brand.name', label: 'Business name' }, { key: 'item.question', label: 'Question' }];

  it('shows names, and turns them back', () => {
    const stored = 'Welcome to {{brand.name}}: {{item.question}}';
    const shown = 'Welcome to [Business name]: [Question]';
    expect(toFriendly(stored, names)).toBe(shown);
    expect(fromFriendly(shown, names)).toBe(stored);
  });

  it('leaves everything else alone', () => {
    expect(toFriendly('Hi {{unknown.key}}', names)).toBe('Hi {{unknown.key}}');
    expect(fromFriendly('A [note] for [Business name', names)).toBe('A [note] for [Business name');
    expect(fromFriendly('[Business name] [other]', names)).toBe('{{brand.name}} [other]');
  });

  it('counts where each variable is used', () => {
    const content = buildContent('p', [
      el('Section', {}, [heading('{{title}}'), text('{{title}} and {{other}}', undefined, 'shown'), el('Card', { repeat: { list: 'items', as: 'row' } }, [])]),
    ]);
    expect(usageCounts([content])).toMatchObject({ title: 2, other: 1, shown: 1, items: 1 });
  });
});

describe('editor: items, columns and live steps', () => {
  const state = () => useStudio.getState();
  let services: AppServices;
  const grid = el('Grid', {}, [el('Box', {}, [text('First')]), el('Box', {}, [text('Second')])]);
  const content = buildContent('p', [el('Section', {}, [grid])]);
  const gridId = Object.values(content.nodes).find((node) => node.type === 'Grid')!.id;

  const open = async (type: 'page' | 'tour' = 'page') => {
    const id = await services.projects.create({
      ...blankProject(type, 'org', 'Mine'),
      documents: [{ kind: type === 'page' ? 'page' : 'experience', title: 'Home', slug: '', content }],
    });
    state().load(services, (await services.projects.get(id))!, await services.projects.listDocuments(id), false);
  };
  const page = () => state().documents[0].content;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    services = createLocalServices();
  });
  afterEach(() => {
    state().reset();
    vi.useRealTimers();
  });

  it('adds items by copying the last one, and removes from the end, as one undo step', async () => {
    await open();
    state().setChildCount(gridId, 4);
    expect(page().nodes[gridId].children).toHaveLength(4);
    const copy = page().nodes[page().nodes[gridId].children[3]];
    expect(copy.type).toBe('Box');
    expect(copy.children).toHaveLength(1);
    state().setChildCount(gridId, 1);
    expect(page().nodes[gridId].children).toHaveLength(1);
    state().undo();
    expect(page().nodes[gridId].children).toHaveLength(4);
  });

  it('starts an empty container with a box', async () => {
    await open();
    state().setChildCount(gridId, 0);
    state().setChildCount(gridId, 2);
    expect(page().nodes[gridId].children.map((id) => page().nodes[id].type)).toEqual(['Box', 'Box']);
  });

  it('makes smaller screens stack when choosing columns on desktop', async () => {
    await open();
    state().setGridColumns(gridId, 4);
    const node = page().nodes[gridId];
    expect(node.styles.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
    expect(node.responsive?.tablet?.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    expect(node.responsive?.mobile?.gridTemplateColumns).toBe('minmax(0, 1fr)');
  });

  it('keeps a choice made for a smaller screen', async () => {
    await open();
    state().setDevice('mobile');
    state().setGridColumns(gridId, 2);
    state().setDevice('desktop');
    state().setGridColumns(gridId, 5);
    expect(page().nodes[gridId].responsive?.mobile?.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    state().setGridColumns(gridId, 0);
    expect(page().nodes[gridId].styles.gridTemplateColumns).toBeUndefined();
  });

  it('resets only the chosen device', async () => {
    await open();
    state().setDevice('mobile');
    state().updateStyle(gridId, 'gap', '4');
    state().setDevice('tablet');
    state().updateStyle(gridId, 'gap', '8');
    state().clearDeviceStyles(gridId, 'mobile');
    expect(page().nodes[gridId].responsive?.mobile).toBeUndefined();
    expect(page().nodes[gridId].responsive?.tablet?.gap).toBe('8');
  });

  it('turns a click on the live site into a complete step', async () => {
    await open('tour');
    state().addTourStep({ selector: '#reports', text: 'Reports', path: '/app' });
    const step = page().nodes[state().selectedId!];
    expect(step.type).toBe('TourStep');
    expect(step.props).toMatchObject({ selector: '#reports', path: '/app', layout: 'tooltip' });
    expect(page().nodes[step.children[0]].props.text).toBe('Reports');
    expect(page().nodes[page().rootId].children).toContain(step.id);
    state().undo();
    expect(page().nodes[step.id]).toBeUndefined();
  });

  it('names a step sensibly when the clicked element has no words', async () => {
    await open('tour');
    state().addTourStep({ selector: 'img', text: '', path: '/' });
    const step = page().nodes[state().selectedId!];
    expect(page().nodes[step.children[0]].props.text).toBe('New step');
  });
});

describe('demo mode data', () => {
  beforeEach(() => localStorage.clear());

  it('only opens projects in the signed-in person\'s workspaces', async () => {
    const services = createLocalServices();
    await services.auth.signUp({ email: 'a@example.com', password: 'password-a', fullName: 'A', workspaceName: 'A' });
    const firstUser = (await services.auth.getUser())!;
    const org = (await services.workspaces.listMemberships(firstUser.id))[0].organizationId;
    const id = await services.projects.create(blankProject('form', org, 'Private'));
    expect(await services.projects.get(id)).not.toBeNull();

    await services.auth.signOut();
    await services.auth.signUp({ email: 'b@example.com', password: 'password-b', fullName: 'B', workspaceName: 'B' });
    expect(await services.projects.get(id)).toBeNull();
    expect(await services.projects.listDocuments(id)).toEqual([]);
  });

  it('keeps the build address and variable list out of what visitors can read', async () => {
    const services = createLocalServices();
    await services.auth.signUp({ email: 'c@example.com', password: 'password-c', fullName: 'C', workspaceName: 'C' });
    const user = (await services.auth.getUser())!;
    const org = (await services.workspaces.listMemberships(user.id))[0].organizationId;
    const id = await services.projects.create({
      ...blankProject('tour', org, 'Tour'),
      settings: { builderUrl: 'https://staging.internal.example', variableDefs: [{ key: 'my.x', label: 'X', type: 'text' }], webhookUrl: 'https://hooks.example.com/s' },
    });
    await services.publishing.publish(id, undefined, `tour-${Date.now()}`);
    const snapshot = await services.publicApi.getPublishedExperience(id);
    const json = JSON.stringify(snapshot);
    expect(json).not.toContain('staging.internal');
    expect(json).not.toContain('variableDefs');
    expect(json).not.toContain('hooks.example.com');
    expect((await services.projects.get(id))?.settings.builderUrl).toBe('https://staging.internal.example');
  });

  it('reports a full browser in plain words', async () => {
    const services = createLocalServices();
    await services.auth.signUp({ email: 'd@example.com', password: 'password-d', fullName: 'D', workspaceName: 'D' });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Setting the value exceeded the quota.', 'QuotaExceededError');
    });
    await expect(services.auth.signOut()).rejects.toThrow(/run out of storage/);
    setItem.mockRestore();
  });
});
