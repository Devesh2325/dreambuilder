// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, TestDb, TestUser } from './harness';

describe('custom domains', () => {
  let t: TestDb;
  let alice: TestUser;
  let bob: TestUser;
  let site: string;
  let form: string;

  const createProject = async (user: TestUser, type: string) => {
    const [row] = await t.asUser<{ id: string }>(user.id, `select public.create_project_with_documents($1, $2, 'P', project_documents => '[{"title":"Home","slug":"","content":{"rootId":"r","nodes":{"r":{"id":"r","type":"Root","props":{},"styles":{},"children":[]}}}}]'::jsonb) as id`, [user.orgId, type]);
    return row.id;
  };
  const addDomain = (user: TestUser, project: string, domain: string, org = user.orgId) =>
    t.asUser<{ id: string; verification_token: string; status: string }>(user.id, `insert into public.project_domains (project_id, organization_id, domain) values ($1, $2, $3) returning id, verification_token, status`, [project, org, domain]);

  beforeAll(async () => {
    t = await createTestDb();
    alice = await t.signUp('alice@example.com');
    bob = await t.signUp('bob@example.com');
    await t.asAdmin(`update public.organizations set plan = 'pro'`);
    site = await createProject(alice, 'website');
    form = await createProject(alice, 'form');
  }, 60_000);

  it('lets an editor add a domain, starting unconnected with its own proof token', async () => {
    const [row] = await addDomain(alice, site, 'www.alice-shop.com');
    expect(row.status).toBe('pending');
    expect(row.verification_token).toMatch(/^[0-9a-f]{32}$/);
  });

  it('keeps each workspace to its own domains', async () => {
    const rows = await t.asUser(bob.id, `select * from public.project_domains`);
    expect(rows).toEqual([]);
    await expect(addDomain(bob, site, 'bob-takes-it.com', alice.orgId)).rejects.toThrow(/row-level security/);
    // Naming your own workspace doesn't help with someone else's project.
    await expect(addDomain(bob, site, 'bob-takes-it.com', bob.orgId)).rejects.toThrow(/row-level security/);
  });

  it("won't let anyone mark a domain connected, or change its proof token", async () => {
    const [row] = await t.asUser<{ id: string }>(alice.id, `select id from public.project_domains where domain = 'www.alice-shop.com'`);
    await expect(t.asUser(alice.id, `update public.project_domains set status = 'active' where id = $1`, [row.id])).rejects.toThrow(/permission denied/);
    await expect(t.asUser(alice.id, `update public.project_domains set verification_token = 'mine' where id = $1`, [row.id])).rejects.toThrow(/permission denied/);
    await expect(t.asUser(alice.id, `insert into public.project_domains (project_id, organization_id, domain, status) values ($1, $2, 'sneaky.com', 'active')`, [site, alice.orgId])).rejects.toThrow(/permission denied/);
  });

  it('only allows sites, one owner per domain, three per site, and well-formed names', async () => {
    await expect(addDomain(alice, form, 'form.example.com')).rejects.toThrow(/row-level security/);
    await expect(addDomain(alice, site, 'www.alice-shop.com')).rejects.toThrow(/duplicate key/);
    for (const bad of ['Upper.com', 'no_underscores.com', 'https://x.com', 'nodot', '-bad.com']) {
      await expect(addDomain(alice, site, bad), bad).rejects.toThrow(/check constraint/);
    }
    await addDomain(alice, site, 'alice-shop.com');
    await addDomain(alice, site, 'shop.alice.dev');
    await expect(addDomain(alice, site, 'fourth.alice.dev')).rejects.toThrow(/row-level security/);
  });

  it('shows visitors a site at its domain only once it is connected and published', async () => {
    const lookup = async (domain: string) => {
      const [row] = await t.asAnon<{ snapshot: unknown }>(`select public.get_published_site_by_domain($1) as snapshot`, [domain]);
      return row.snapshot;
    };
    expect(await lookup('www.alice-shop.com')).toBeNull();
    await t.asUser(alice.id, `select public.publish_project($1, 'first', 'alice-shop')`, [site]);
    expect(await lookup('www.alice-shop.com')).toBeNull();

    // What the Edge Function does once the DNS proof checks out.
    await t.asAdmin(`update public.project_domains set status = 'active' where domain = 'www.alice-shop.com'`);
    const snapshot = await lookup('WWW.Alice-Shop.com') as { project: { id: string } };
    expect(snapshot.project.id).toBe(site);
    expect(await lookup('alice-shop.com')).toBeNull();

    await t.asUser(alice.id, `select public.unpublish_project($1)`, [site]);
    expect(await lookup('www.alice-shop.com')).toBeNull();
  });

  it('lets editors remove a domain, and viewers do nothing', async () => {
    const [row] = await t.asUser<{ id: string }>(alice.id, `select id from public.project_domains where domain = 'shop.alice.dev'`);
    await t.asAdmin(`insert into public.organization_members (organization_id, user_id, role) values ($1, $2, 'viewer')`, [alice.orgId, bob.id]);
    expect(await t.asUser(bob.id, `select domain from public.project_domains where project_id = $1`, [site])).not.toEqual([]);
    await t.asUser(bob.id, `delete from public.project_domains where id = $1`, [row.id]);
    expect(await t.asAdmin(`select 1 from public.project_domains where id = $1`, [row.id])).toHaveLength(1);
    await t.asUser(alice.id, `delete from public.project_domains where id = $1`, [row.id]);
    expect(await t.asAdmin(`select 1 from public.project_domains where id = $1`, [row.id])).toHaveLength(0);
  });
});
