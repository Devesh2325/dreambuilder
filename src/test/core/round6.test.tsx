import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dataSourceDefs, fetchRows, fieldKey, guessFields, isAllowedDataUrl, listsIn, pickList, sourceKey, toRows } from '../../core/dataSources';
import { dnsRecords, isApex, isAppHost, normalizeDomain, rootOf } from '../../core/domains';
import { policyLine, policySources } from '../../core/siteCheck';
import { expandContent } from '../../core/variables';
import { BLOCK_META } from '../../renderer/blockMeta';
import { ExperienceView } from '../../renderer/ExperienceView';
import { ICON_DATA } from '../../renderer/iconData';
import { buildContent, el } from '../../templates/dsl';
import { THEME_INDIGO } from '../../templates/themes';

const theme = THEME_INDIGO.theme;

describe('data from an API', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('only loads secure public addresses', () => {
    expect(isAllowedDataUrl('https://api.example.com/items')).toBe(true);
    expect(isAllowedDataUrl('http://localhost:3000/items')).toBe(true);
    expect(isAllowedDataUrl('http://api.example.com/items')).toBe(false);
    expect(isAllowedDataUrl('https://user:secret@api.example.com')).toBe(false);
    expect(isAllowedDataUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedDataUrl('file:///etc/passwd')).toBe(false);
  });

  it('finds the lists in a response, and picks one', () => {
    const body = { meta: { total: 2 }, data: { items: [{ id: 1 }, { id: 2 }] }, tags: ['a', 'b'] };
    expect(listsIn(body)).toEqual(['data.items']);
    expect(listsIn([{ id: 1 }])).toEqual(['']);
    expect(pickList(body, 'data.items')).toHaveLength(2);
    expect(pickList(body, 'meta')).toBeNull();
  });

  it('flattens items into plain, token-safe fields', () => {
    const rows = toRows([{ 'product-name': 'Mug', price: { amount: 12, currency: 'USD' }, tags: ['new', 'sale'], deep: { a: { b: { c: 1 } } }, 1: 'x', nested: [{ no: 1 }] }, 'not an item']);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ product_name: 'Mug', price_amount: 12, price_currency: 'USD', tags: 'new, sale', f_1: 'x' });
    expect(Object.keys(rows[0])).not.toContain('nested');
    expect(fieldKey('2nd name!')).toBe('f_2nd_name');
    expect(sourceKey('Job openings', ['job_openings'])).toBe('job_openings_2');
  });

  it('caps how many items it keeps', () => {
    expect(toRows(Array.from({ length: 500 }, (_, n) => ({ n })))).toHaveLength(200);
  });

  it('becomes a list that blocks can repeat over, showing values only as text', () => {
    const content = buildContent('d', [el('Box', { repeat: { list: 'data.products', as: 'item' } }, [el('Text', { props: { text: '{{item.name}}' } })])]);
    const tree = expandContent(content, { 'data.products': [{ name: 'Mug' }, { name: '<img src=x onerror=alert(1)>' }] })!;
    render(<ExperienceView documents={[content]} theme={theme} variables={{ 'data.products': [{ name: 'Mug' }, { name: '<img src=x onerror=alert(1)>' }] }} ctx={{ mode: 'live' }} />);
    expect(tree.children).toHaveLength(2);
    expect(screen.getByText('Mug')).toBeTruthy();
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy();
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });

  it('offers each source as a list variable with its fields', () => {
    const [def] = dataSourceDefs([{ key: 'products', label: 'Products', url: 'https://x.com', fields: ['name', 'price'] }]);
    expect(def).toMatchObject({ key: 'data.products', type: 'list' });
    expect(def.itemFields?.map((field) => field.key)).toEqual(['name', 'price']);
  });

  it('guesses which fields are the picture, title, words and link', () => {
    const fields = ['id', 'title', 'summary', 'image_url', 'url'];
    expect(guessFields(fields, { id: 1, title: 'A', summary: 'B', image_url: 'https://x/a.jpg', url: 'https://x/a' })).toEqual({ image: 'image_url', title: 'title', text: 'summary', link: 'url' });
    // A field named like a picture that doesn't hold an address isn't used as one.
    expect(guessFields(['photo'], { photo: 'none' }).image).toBeUndefined();
  });

  it('explains what went wrong in plain words', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchRows({ url: 'https://api.example.com' })).rejects.toThrow(/CORS/);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })));
    await expect(fetchRows({ url: 'https://api.example.com' })).rejects.toThrow(/error \(500\)/);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>', { status: 200 })));
    await expect(fetchRows({ url: 'https://api.example.com' })).rejects.toThrow(/JSON/);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"a":1}', { status: 200 })));
    await expect(fetchRows({ url: 'https://api.example.com' })).rejects.toThrow(/no list/);
    await expect(fetchRows({ url: 'http://api.example.com' })).rejects.toThrow(/https/);
  });

  it('never sends the visitor\'s cookies to the API', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('[{"a":1}]', { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    expect(await fetchRows({ url: 'https://api.example.com' })).toEqual([{ a: 1 }]);
    expect(fetcher.mock.calls[0][1]).toMatchObject({ credentials: 'omit' });
  });
});

describe('custom domains', () => {
  it('cleans up what people paste, and rejects what is not a domain', () => {
    expect(normalizeDomain(' https://www.Example.com/about?x=1 ')).toBe('www.example.com');
    expect(normalizeDomain('example.co.uk.')).toBe('example.co.uk');
    for (const bad of ['', 'localhost', 'exa mple.com', '-x.com', 'x.c', 'a'.repeat(64) + '.com']) expect(normalizeDomain(bad), bad).toBeNull();
  });

  it('knows a domain from a subdomain, including two-part endings', () => {
    expect(rootOf('www.shop.example.co.uk')).toBe('example.co.uk');
    expect(rootOf('www.example.com')).toBe('example.com');
    expect(isApex('example.in')).toBe(true);
    expect(isApex('shop.example.co.in')).toBe(false);
  });

  it('asks for an A record on the domain itself, and a CNAME on a subdomain, each with a proof record', () => {
    expect(dnsRecords('example.com', 'abc')).toEqual([
      expect.objectContaining({ type: 'A', host: '@', value: '76.76.21.21' }),
      expect.objectContaining({ type: 'TXT', host: '_flowpilot', fqdn: '_flowpilot.example.com', value: 'flowpilot-verify=abc' }),
    ]);
    expect(dnsRecords('www.example.co.uk', 'abc')).toEqual([
      expect.objectContaining({ type: 'CNAME', host: 'www', value: 'cname.vercel-dns.com' }),
      expect.objectContaining({ type: 'TXT', host: '_flowpilot.www', fqdn: '_flowpilot.www.example.co.uk' }),
    ]);
  });

  it('treats every host as the builder until its own hosts are listed', () => {
    expect(isAppHost('www.customer.com', '')).toBe(true);
    expect(isAppHost('www.customer.com', undefined)).toBe(true);
    expect(isAppHost('www.customer.com', 'app.flowpilot.io, flowpilot.vercel.app')).toBe(false);
    expect(isAppHost('APP.flowpilot.io', 'app.flowpilot.io')).toBe(true);
    expect(isAppHost('localhost', 'app.flowpilot.io')).toBe(true);
  });
});

describe('what a site has to allow', () => {
  it('lists every address the embed loads from', () => {
    const line = policyLine(policySources('https://app.flowpilot.io', 'https://abc.supabase.co/rest'));
    expect(line).toContain('script-src https://app.flowpilot.io');
    expect(line).toContain('connect-src https://abc.supabase.co');
    expect(line).toContain("style-src 'unsafe-inline' https://fonts.googleapis.com");
    expect(line).toContain('frame-src https://www.youtube-nocookie.com https://player.vimeo.com');
  });

  it('leaves out the database when there is none, as in demo mode', () => {
    expect(policyLine(policySources('http://localhost:5173', null))).not.toContain('connect-src');
  });
});

describe('blocks for articles and docs', () => {
  const draw = (type: string, props: Record<string, unknown>, mode: 'live' | 'edit' = 'live') => {
    const content = buildContent('a', [el(type, { props })]);
    return render(<ExperienceView documents={[content]} theme={theme} variables={{}} ctx={{ mode }} />);
  };

  it('has a definition for each, with an icon the editor knows', () => {
    for (const type of ['Avatar', 'Icon', 'List', 'Quote', 'CodeBlock', 'Callout', 'Table', 'Badge']) expect(BLOCK_META[type], type).toBeDefined();
    expect(Object.keys(ICON_DATA).length).toBeGreaterThan(40);
  });

  it('shows an avatar with a photo, or initials without one', () => {
    draw('Avatar', { name: 'Priya Shah', subtitle: 'Founder', src: '' });
    expect(screen.getByText('PS')).toBeTruthy();
    expect(screen.getByText('Founder')).toBeTruthy();
  });

  it('never loads an unsafe photo address', () => {
    const { container } = draw('Avatar', { name: 'X', src: 'javascript:alert(1)' });
    expect(container.querySelector('img')).toBeNull();
  });

  it('draws an icon, labelled only when it means something', () => {
    const { container } = draw('Icon', { icon: 'rocket', size: 40, label: 'Fast launch' });
    expect(screen.getByRole('img', { name: 'Fast launch' })).toBeTruthy();
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('40');
  });

  it('falls back to a star for an unknown icon', () => {
    const { container } = draw('Icon', { icon: 'nope', size: 24, label: '' });
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('makes a list from lines, as bullets, numbers or ticks', () => {
    draw('List', { items: 'One\n\nTwo\n Three ', style: 'number' });
    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['One', 'Two', 'Three']);
  });

  it('shows code as text, never as markup', () => {
    const { container } = draw('CodeBlock', { code: '<script>alert(1)</script>', language: 'HTML' });
    expect(container.querySelector('pre')?.textContent).toBe('<script>alert(1)</script>');
    expect(container.querySelector('script')).toBeNull();
  });

  it('builds a table from rows, with a heading row', () => {
    draw('Table', { rows: 'Plan | Price\nPro | $49', header: true });
    expect(screen.getByRole('columnheader', { name: 'Price' })).toBeTruthy();
    expect(screen.getByRole('cell', { name: '$49' })).toBeTruthy();
  });

  it('shows a callout, quote and badge', () => {
    draw('Callout', { tone: 'warning', title: 'Careful', text: 'Back up first.' });
    expect(screen.getByRole('complementary')).toBeTruthy();
    expect(screen.getByText('Careful')).toBeTruthy();
  });
});
