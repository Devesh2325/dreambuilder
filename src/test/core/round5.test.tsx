import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DocContent } from '../../core/schema';
import { createLocalServices } from '../../data/localServices';
import { AppServices } from '../../data/services';
import { ExperienceView } from '../../renderer/ExperienceView';
import { BLOCK_META } from '../../renderer/blockMeta';
import { colorAt, formatColor, formatGradient, parseColor, parseGradient } from '../../studio/colorMath';
import { nodesUsingVariable, variableMatches } from '../../studio/variableUsage';
import { SECTION_LIBRARY } from '../../templates/sections';
import { buildContent, el } from '../../templates/dsl';
import { THEME_INDIGO } from '../../templates/themes';
import { formatDate, formatDateTime, formatDay, initials, setDisplayTimeZone } from '../../app/shared/format';

const theme = THEME_INDIGO.theme;

describe('color picker math', () => {
  it.each(['#4f46e5', '#ffffff', '#000000', '#ff0000', '#10b981'])('keeps %s the same through a round trip', (hex) => {
    expect(formatColor(parseColor(hex)!)).toBe(hex);
  });

  it('understands short hex, alpha and rgb', () => {
    expect(formatColor(parseColor('#f00')!)).toBe('#ff0000');
    expect(parseColor('#00000080')!.a).toBeCloseTo(0.5, 1);
    expect(formatColor(parseColor('rgb(255, 0, 0)')!)).toBe('#ff0000');
    expect(formatColor(parseColor('rgba(0, 0, 255, 0.5)')!)).toBe('rgba(0, 0, 255, 0.5)');
  });

  it("gives null for what isn't a plain color", () => {
    expect(parseColor('var(--fp-primary)')).toBeNull();
    expect(parseColor('linear-gradient(red, blue)')).toBeNull();
    expect(parseColor('')).toBeNull();
  });
});

describe('gradient editor math', () => {
  it('reads a linear gradient, sharing out stops without positions', () => {
    expect(parseGradient('linear-gradient(135deg, #6366f1, #a855f7)')).toEqual({
      kind: 'linear', angle: 135, stops: [{ color: '#6366f1', position: 0 }, { color: '#a855f7', position: 100 }],
    });
  });

  it('keeps commas inside a color together', () => {
    const parsed = parseGradient('linear-gradient(90deg, rgba(0, 0, 0, 0.5) 10%, #fff 90%)')!;
    expect(parsed.stops).toEqual([{ color: 'rgba(0, 0, 0, 0.5)', position: 10 }, { color: '#fff', position: 90 }]);
  });

  it('understands words for a direction, and radial gradients', () => {
    expect(parseGradient('linear-gradient(to right, #000, #fff)')!.angle).toBe(90);
    expect(parseGradient('radial-gradient(circle, #a5b4fc 0%, #312e81 100%)')!.kind).toBe('radial');
  });

  it('keeps theme colors as they are', () => {
    const parsed = parseGradient('linear-gradient(180deg, var(--fp-background), var(--fp-surface))')!;
    expect(parsed.stops[0].color).toBe('var(--fp-background)');
    expect(formatGradient(parsed)).toBe('linear-gradient(180deg, var(--fp-background) 0%, var(--fp-surface) 100%)');
  });

  it('writes what it reads, with stops in order', () => {
    const written = formatGradient({ kind: 'linear', angle: 45, stops: [{ color: '#fff', position: 80 }, { color: '#000', position: 20 }] });
    expect(written).toBe('linear-gradient(45deg, #000 20%, #fff 80%)');
    expect(parseGradient(written)!.stops[0]).toEqual({ color: '#000', position: 20 });
  });

  it('rejects anything else', () => {
    expect(parseGradient('#fff')).toBeNull();
    expect(parseGradient('linear-gradient(red)')).toBeNull();
    expect(parseGradient('url(javascript:alert(1))')).toBeNull();
  });

  it('adds a stop in the color already there, so nothing visibly changes', () => {
    expect(colorAt([{ color: '#000000', position: 0 }, { color: '#ffffff', position: 100 }], 50)).toBe('#808080');
    expect(colorAt([{ color: '#112233', position: 20 }, { color: '#ffffff', position: 100 }], 5)).toBe('#112233');
  });
});

describe('finding variables', () => {
  const content: DocContent = buildContent('v', [
    el('Heading', { props: { text: 'Hello {{brand.name}}' } }),
    el('Text', { props: { text: 'No variables here' } }),
    el('Box', { showIf: 'brand.phone' }, [el('Text', { props: { text: '{{brand.phone}}' } })]),
    el('Box', { repeat: { list: 'team', as: 'person' } }),
  ]);
  const idsFor = (key: string) => nodesUsingVariable(content, key).map((id) => content.nodes[id].type);

  it('finds every kind of use: in words, a show rule and a repeat', () => {
    expect(idsFor('brand.name')).toEqual(['Heading']);
    expect(idsFor('brand.phone').sort()).toEqual(['Box', 'Text']);
    expect(idsFor('team')).toEqual(['Box']);
    expect(idsFor('nothing')).toEqual([]);
  });

  it('searches names and values, including inside lists', () => {
    expect(variableMatches('Business name', 'Bella', 'business')).toBe(true);
    expect(variableMatches('Business name', 'Bella', 'BELLA')).toBe(true);
    expect(variableMatches('Team', [{ name: 'Priya' }], 'priya')).toBe(true);
    expect(variableMatches('Business name', 'Bella', 'phone')).toBe(false);
    expect(variableMatches('Business name', undefined, 'phone')).toBe(false);
    expect(variableMatches('Business name', 'Bella', '')).toBe(true);
  });
});

describe('dates', () => {
  it('follows the chosen time zone', () => {
    const moment = '2026-01-01T23:30:00Z';
    setDisplayTimeZone('Asia/Kolkata');
    expect(formatDate(moment)).toMatch(/Jan.*2.*2026|2.*Jan.*2026/);
    setDisplayTimeZone('America/New_York');
    expect(formatDate(moment)).toMatch(/Jan.*1.*2026|1.*Jan.*2026/);
    setDisplayTimeZone(null);
  });

  it('ignores a time zone that does not exist, rather than crashing every page', () => {
    setDisplayTimeZone('Not/AZone');
    expect(() => formatDateTime('2026-01-01T00:00:00Z')).not.toThrow();
    setDisplayTimeZone(null);
  });

  it('never shifts a calendar day', () => {
    setDisplayTimeZone('Pacific/Auckland');
    expect(formatDay('2026-03-05')).toMatch(/5/);
    setDisplayTimeZone(null);
  });

  it('makes initials', () => {
    expect(initials('Priya Shah', 'a@b.c')).toBe('PS');
    expect(initials('Priya', 'a@b.c')).toBe('P');
    expect(initials('', 'a@b.c')).toBe('A');
    expect(initials(null, null)).toBe('?');
  });
});

describe('pay button', () => {
  const draw = (url: string, mode: 'live' | 'edit' = 'live') => {
    const content = buildContent('p', [el('PaymentButton', { props: { text: 'Buy now', price: '$19', provider: 'stripe', url } })]);
    return render(<ExperienceView documents={[content]} theme={theme} variables={{}} ctx={{ mode }} />);
  };

  it('opens the provider safely, in a new tab', () => {
    draw('https://buy.stripe.com/abc');
    const link = screen.getByRole('link', { name: 'Buy now' });
    expect(link.getAttribute('href')).toBe('https://buy.stripe.com/abc');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(screen.getByText('$19')).toBeTruthy();
  });

  it.each(['', 'http://buy.stripe.com/abc', 'javascript:alert(1)', 'data:text/html,x', '//evil.example'])('shows visitors nothing for the link %j', (url) => {
    draw(url);
    expect(screen.queryByRole('link', { name: 'Buy now' })).toBeNull();
  });

  it('tells the editor why it has no link', () => {
    draw('', 'edit');
    expect(screen.getByText('Add your payment link to make this work')).toBeTruthy();
  });

  it('is offered as a section, with no link until the customer adds theirs', () => {
    const section = SECTION_LIBRARY.find((item) => item.id === 'pricing-pay');
    expect(section).toBeDefined();
    expect(JSON.stringify(section!.element)).toContain('PaymentButton');
    expect(JSON.stringify(section!.element)).not.toContain('https://');
  });
});

describe('project block', () => {
  const draw = (mode: 'live' | 'edit', renderEmbed?: (id: string) => React.ReactNode) => {
    const content = buildContent('e', [el('ProjectEmbed', { props: { projectId: 'abc' } })]);
    return render(<ExperienceView documents={[content]} theme={theme} variables={{}} ctx={{ mode, renderEmbed }} />);
  };

  it('shows nothing where embedding is not available, such as the embed script', () => {
    const { container } = draw('live');
    expect(container.querySelector('.fp-embed')).toBeNull();
  });

  it('draws what the app provides', () => {
    draw('live', (id) => <p>Project {id}</p>);
    expect(screen.getByText('Project abc')).toBeTruthy();
  });

  it('never offers variables for technical names', () => {
    const anchor = BLOCK_META.Section.fields.find((field) => field.key === 'anchor')!;
    expect(anchor.plain).toBe(true);
    expect(anchor.slug).toBe(true);
    expect(anchor.label).not.toMatch(/anchor/i);
    expect(BLOCK_META.TourStep.fields.find((field) => field.key === 'selector')!.plain).toBe(true);
  });
});

describe('local backend: plans, admin, nudges and support', () => {
  let services: AppServices;

  const signUp = async (email: string) => {
    await services.auth.signOut();
    const result = await services.auth.signUp({ email, password: 'a-long-password', fullName: email.split('@')[0], workspaceName: `${email} space` });
    expect(result.error).toBeFalsy();
    const user = await services.auth.getUser();
    const [workspace] = await services.workspaces.listMemberships(user!.id);
    return { user: user!, organizationId: workspace.organizationId };
  };

  const newProject = (organizationId: string, type: 'form' | 'page', title = 'One') => services.projects.create({
    organizationId, type, title, variables: {}, theme, settings: {},
    documents: [{ kind: 'experience', title: 'Main', slug: '', content: buildContent('n', []) }],
  });

  beforeEach(async () => {
    localStorage.clear();
    await new Promise<void>((resolve) => {
      const request = typeof indexedDB === 'undefined' ? null : indexedDB.deleteDatabase('flowpilot_local');
      if (!request) resolve();
      else request.onsuccess = request.onerror = () => resolve();
    });
    services = createLocalServices();
  });

  it('makes only the first account a super admin', async () => {
    await signUp('first@example.com');
    expect(await services.admin.isAdmin()).toBe(true);
    await signUp('second@example.com');
    expect(await services.admin.isAdmin()).toBe(false);
    await expect(services.admin.listUsers()).rejects.toThrow(/super admin/);
    await expect(services.admin.overview()).rejects.toThrow(/super admin/);
    await expect(services.admin.sendNudge(null, 'a', 'b', '')).rejects.toThrow(/super admin/);
    await expect(services.admin.setModuleQuota('free', 'form', 1)).rejects.toThrow(/super admin/);
  });

  it('enforces a quota for one module without touching others', async () => {
    await signUp('admin@example.com');
    await services.admin.setModuleQuota('free', 'form', 1);
    const { organizationId } = await signUp('user@example.com');
    await newProject(organizationId, 'form');
    await expect(newProject(organizationId, 'form', 'Two')).rejects.toThrow(/allows 1 of this kind/);
    await expect(newProject(organizationId, 'page', 'A page')).resolves.toBeTruthy();
  });

  it('removes a quota when it is cleared', async () => {
    const { organizationId } = await signUp('admin@example.com');
    await services.admin.setModuleQuota('free', 'form', 0);
    await expect(newProject(organizationId, 'form')).rejects.toThrow(/allows 0/);
    await services.admin.setModuleQuota('free', 'form', null);
    await expect(newProject(organizationId, 'form')).resolves.toBeTruthy();
    expect((await services.plans.list())[0].moduleQuotas.form).toBeUndefined();
  });

  it('enforces an overall limit once a super admin sets one', async () => {
    const { organizationId } = await signUp('admin@example.com');
    const free = (await services.plans.list())[0];
    await services.admin.updatePlan('free', { ...free, maxProjects: 1 });
    await newProject(organizationId, 'form');
    await expect(newProject(organizationId, 'page')).rejects.toThrow(/limit/);
  });

  it('asks for a plan once at a time, and approval changes the plan', async () => {
    await signUp('admin@example.com');
    const { organizationId, user } = await signUp('owner@example.com');
    await services.plans.requestChange(organizationId, 'pro', 'We are growing');
    await expect(services.plans.requestChange(organizationId, 'agency', '')).rejects.toThrow(/already/);
    await services.auth.signOut();
    await services.auth.signIn('admin@example.com', 'a-long-password');
    const [request] = await services.admin.listPlanRequests();
    expect(request).toMatchObject({ plan: 'pro', currentPlan: 'free', requestedBy: 'owner@example.com', note: 'We are growing' });
    await services.admin.resolvePlanRequest(request.id, true);
    await expect(services.admin.resolvePlanRequest(request.id, true)).rejects.toThrow(/already/);
    expect((await services.workspaces.listMemberships(user.id))[0].plan).toBe('pro');
  });

  it('delivers a nudge to one person, or to everyone, until they close it', async () => {
    const admin = await signUp('admin@example.com');
    const other = await signUp('other@example.com');
    await services.auth.signOut();
    await services.auth.signIn('admin@example.com', 'a-long-password');
    expect(await services.admin.sendNudge(other.user.id, 'Hi', 'Just you', '/plans')).toBe(1);
    expect(await services.admin.sendNudge(null, 'All', 'Everyone', '')).toBe(2);
    expect((await services.nudges.listUnread()).map((nudge) => nudge.title)).toEqual(['All']);
    await services.auth.signOut();
    await services.auth.signIn('other@example.com', 'a-long-password');
    const mine = await services.nudges.listUnread();
    expect(mine.map((nudge) => nudge.title).sort()).toEqual(['All', 'Hi']);
    await services.nudges.markRead(mine[0].id);
    expect(await services.nudges.listUnread()).toHaveLength(1);
    expect(admin.user.id).not.toBe(other.user.id);
  });

  it('refuses a nudge link that could run code or leave for an insecure page', async () => {
    await signUp('admin@example.com');
    for (const link of ['javascript:alert(1)', 'http://example.com', '//evil.example', 'data:text/html,x']) {
      await expect(services.admin.sendNudge(null, 'a', 'b', link), link).rejects.toThrow(/link/i);
    }
  });

  it('runs a support conversation, keeping customers to their own', async () => {
    await signUp('admin@example.com');
    const customer = await signUp('customer@example.com');
    const id = await services.support.createTicket(customer.organizationId, 'Help', 'I am stuck');
    expect((await services.support.listTickets())[0]).toMatchObject({ subject: 'Help', status: 'open' });

    await signUp('someone@example.com');
    expect(await services.support.listTickets()).toEqual([]);
    expect(await services.support.listMessages(id)).toEqual([]);
    await expect(services.support.reply(id, 'Let me in')).rejects.toThrow();

    await services.auth.signOut();
    await services.auth.signIn('admin@example.com', 'a-long-password');
    expect((await services.admin.listTickets())[0]).toMatchObject({ userEmail: 'customer@example.com', status: 'open' });
    await services.admin.replyToTicket(id, 'Here to help');

    await services.auth.signOut();
    await services.auth.signIn('customer@example.com', 'a-long-password');
    expect((await services.support.listTickets())[0].status).toBe('answered');
    expect((await services.support.listMessages(id)).map((message) => message.isStaff)).toEqual([false, true]);
    await services.support.reply(id, 'Thanks');
    expect((await services.support.listTickets())[0].status).toBe('open');

    await services.auth.signOut();
    await services.auth.signIn('admin@example.com', 'a-long-password');
    await services.admin.setTicketStatus(id, 'closed');
    await services.auth.signOut();
    await services.auth.signIn('customer@example.com', 'a-long-password');
    await expect(services.support.reply(id, 'One more thing')).rejects.toThrow(/closed/);
  });

  it('saves a profile, including the name the rest of the app reads', async () => {
    await signUp('person@example.com');
    await services.profile.update({ fullName: 'Priya Shah', jobTitle: 'Founder', timezone: 'Asia/Kolkata' });
    expect(await services.profile.get()).toMatchObject({ fullName: 'Priya Shah', jobTitle: 'Founder', timezone: 'Asia/Kolkata', email: 'person@example.com' });
    expect((await services.auth.getUser())?.fullName).toBe('Priya Shah');
  });

  it('records activity for the super admin to see', async () => {
    await signUp('admin@example.com');
    await services.profile.touchActivity();
    const [user] = await services.admin.listUsers();
    expect(user.lastActiveAt).toBeTruthy();
    expect(user.workspaceName).toBe('admin@example.com space');
  });

  it("copes with nobody being logged in, as a page can load before the session does", async () => {
    expect(await services.profile.get()).toBeNull();
    expect(await services.nudges.listUnread()).toEqual([]);
    expect(await services.support.listTickets()).toEqual([]);
    expect(await services.admin.isAdmin()).toBe(false);
    expect(await services.plans.list()).toHaveLength(5);
  });
});
