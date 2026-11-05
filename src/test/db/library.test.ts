// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, TestDb, TestUser } from './harness';

describe('team library', () => {
  let t: TestDb;
  let alice: TestUser;
  let bob: TestUser;
  let viewer: TestUser;

  const add = (user: TestUser, org = user.orgId, name = 'Hero') =>
    t.asUser<{ id: string }>(
      user.id,
      `insert into public.workspace_library (organization_id, kind, name, definition) values ($1, 'section', $2, '{}') returning id`,
      [org, name],
    );

  beforeAll(async () => {
    t = await createTestDb();
    alice = await t.signUp('alice@example.com');
    bob = await t.signUp('bob@example.com');
    viewer = await t.signUp('viewer@example.com');
    await t.asAdmin(`insert into public.organization_members (organization_id, user_id, role) values ($1, $2, 'viewer')`, [alice.orgId, viewer.id]);
  }, 60_000);

  it('lets members save and read, recording who saved it', async () => {
    const [row] = await add(alice);
    const [saved] = await t.asUser<{ name: string; created_by: string }>(alice.id, `select name, created_by from public.workspace_library where id = $1`, [row.id]);
    expect(saved).toEqual({ name: 'Hero', created_by: alice.id });
  });

  it('keeps libraries private to each workspace', async () => {
    const [row] = await add(alice, alice.orgId, 'Private');
    expect(await t.asUser(bob.id, `select id from public.workspace_library where id = $1`, [row.id])).toEqual([]);
    await expect(add(bob, alice.orgId)).rejects.toThrow(/row-level security/);
    await t.asUser(bob.id, `delete from public.workspace_library where id = $1`, [row.id]);
    expect(await t.asAdmin(`select id from public.workspace_library where id = $1`, [row.id])).toHaveLength(1);
  });

  it('lets viewers read but not change', async () => {
    const [row] = await add(alice, alice.orgId, 'Shared');
    expect(await t.asUser(viewer.id, `select id from public.workspace_library where id = $1`, [row.id])).toHaveLength(1);
    await expect(add(viewer, alice.orgId)).rejects.toThrow(/row-level security/);
    await t.asUser(viewer.id, `update public.workspace_library set name = 'Changed' where id = $1`, [row.id]);
    await t.asUser(viewer.id, `delete from public.workspace_library where id = $1`, [row.id]);
    const [stored] = await t.asAdmin<{ name: string }>(`select name from public.workspace_library where id = $1`, [row.id]);
    expect(stored.name).toBe('Shared');
  });

  it('is closed to logged-out visitors', async () => {
    await expect(t.asAnon(`select * from public.workspace_library`)).rejects.toThrow(/permission denied/);
  });

  it('blocks forging who saved something', async () => {
    await expect(
      t.asUser(alice.id, `insert into public.workspace_library (organization_id, kind, name, definition, created_by) values ($1, 'section', 'X', '{}', $2)`, [alice.orgId, bob.id]),
    ).rejects.toThrow(/permission denied/);
  });
});
