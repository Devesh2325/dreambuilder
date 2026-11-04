// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, TestDb, TestUser } from './harness';

const CONTENT = JSON.stringify({ rootId: 'root', nodes: {} });

describe('foundation migration security', () => {
  let t: TestDb;
  let alice: TestUser;
  let bob: TestUser;
  let aliceProjectId: string;
  let aliceDocId: string;

  const createProject = async (user: TestUser, title: string, org = user.orgId) => {
    const [row] = await t.asUser<{ id: string }>(
      user.id,
      `select public.create_project_with_documents(
         $1, 'website', $2, project_documents => $3::jsonb
       ) as id`,
      [org, title, JSON.stringify([{ title: 'Home', slug: '', content: { rootId: 'root', nodes: {} } }])],
    );
    return row.id;
  };

  /** Adds an existing user to a workspace, as the invitation flow will. */
  const addMember = (user: TestUser, orgId: string, role: string) =>
    t.asAdmin(
      `insert into public.organization_members (organization_id, user_id, role) values ($1, $2, $3)`,
      [orgId, user.id, role],
    );

  beforeAll(async () => {
    t = await createTestDb();
    alice = await t.signUp('alice@example.com', 'Alice Co');
    bob = await t.signUp('bob@example.com', 'Bob Co');
    aliceProjectId = await createProject(alice, 'Alice Site');
    const [doc] = await t.asUser<{ id: string }>(
      alice.id,
      `select id from public.documents where project_id = $1`,
      [aliceProjectId],
    );
    aliceDocId = doc.id;
  }, 60_000);

  describe('signup', () => {
    it('creates a profile and a workspace owned by the new user', async () => {
      const [org] = await t.asUser<{ name: string; slug: string; plan: string }>(
        alice.id,
        `select name, slug, plan from public.organizations where id = $1`,
        [alice.orgId],
      );
      expect(org.name).toBe('Alice Co');
      expect(org.slug).toMatch(/^alice-co-[0-9a-f]{8}$/);
      expect(org.plan).toBe('free');

      const [member] = await t.asUser<{ role: string }>(
        alice.id,
        `select role from public.organization_members where user_id = $1`,
        [alice.id],
      );
      expect(member.role).toBe('owner');
    });

    it('still succeeds for a name that produces no usable slug', async () => {
      const user = await t.signUp('symbols@example.com', '!!! ###');
      const [org] = await t.asAdmin<{ slug: string }>(
        `select slug from public.organizations where id = $1`,
        [user.orgId],
      );
      expect(org.slug).toMatch(/^workspace-[0-9a-f]{8}$/);
    });

    it('falls back to the email name when no workspace name is given', async () => {
      const user = await t.signUp('carol@example.com');
      const [org] = await t.asAdmin<{ name: string }>(
        `select name from public.organizations where id = $1`,
        [user.orgId],
      );
      expect(org.name).toBe('carol');
    });
  });

  describe('workspace isolation', () => {
    it.each([
      ['organizations', 'id'],
      ['organization_members', 'organization_id'],
      ['projects', 'organization_id'],
      ['documents', 'organization_id'],
    ])('hides %s of other workspaces', async (table, column) => {
      const rows = await t.asUser(bob.id, `select * from public.${table} where ${column} = $1`, [alice.orgId]);
      expect(rows).toEqual([]);
    });

    it('hides profiles of users who share no workspace', async () => {
      expect(await t.asUser(bob.id, `select * from public.user_profiles where id = $1`, [alice.id])).toEqual([]);
    });

    it('blocks creating a project in another workspace', async () => {
      await expect(createProject(bob, 'Intruder', alice.orgId)).rejects.toThrow(/row-level security/);
    });

    it('makes updates and deletes on other workspaces affect nothing', async () => {
      await t.asUser(bob.id, `update public.projects set title = 'Hacked' where id = $1`, [aliceProjectId]);
      await t.asUser(bob.id, `update public.documents set title = 'Hacked' where id = $1`, [aliceDocId]);
      await t.asUser(bob.id, `delete from public.documents where id = $1`, [aliceDocId]);
      await t.asUser(bob.id, `delete from public.projects where id = $1`, [aliceProjectId]);

      const [project] = await t.asAdmin<{ title: string }>(`select title from public.projects where id = $1`, [aliceProjectId]);
      const [doc] = await t.asAdmin<{ title: string }>(`select title from public.documents where id = $1`, [aliceDocId]);
      expect(project.title).toBe('Alice Site');
      expect(doc.title).toBe('Home');
    });

    it('blocks attaching a document to a project in another workspace', async () => {
      await expect(
        t.asUser(
          bob.id,
          `insert into public.documents (project_id, organization_id, title, slug, content)
           values ($1, $2, 'Sneaky', 'sneaky', $3::jsonb)`,
          [aliceProjectId, bob.orgId, CONTENT],
        ),
      ).rejects.toThrow(/foreign key/);
    });
  });

  describe('logged-out visitors', () => {
    it.each(['organizations', 'user_profiles', 'organization_members', 'projects', 'documents', 'project_versions', 'assets'])(
      'cannot read %s',
      async (table) => {
        await expect(t.asAnon(`select * from public.${table}`)).rejects.toThrow(/permission denied/);
      },
    );

    it('cannot call client functions', async () => {
      await expect(t.asAnon(`select public.create_organization('Nope')`)).rejects.toThrow(/permission denied/);
    });
  });

  describe('roles', () => {
    let viewer: TestUser;
    let editor: TestUser;
    let admin: TestUser;

    beforeAll(async () => {
      viewer = await t.signUp('viewer@example.com');
      editor = await t.signUp('editor@example.com');
      admin = await t.signUp('admin@example.com');
      await addMember(viewer, alice.orgId, 'viewer');
      await addMember(editor, alice.orgId, 'editor');
      await addMember(admin, alice.orgId, 'admin');
    });

    it('lets viewers read but not change anything', async () => {
      const rows = await t.asUser(viewer.id, `select id from public.documents where id = $1`, [aliceDocId]);
      expect(rows).toHaveLength(1);

      await t.asUser(viewer.id, `update public.documents set title = 'Viewer edit' where id = $1`, [aliceDocId]);
      const [doc] = await t.asAdmin<{ title: string }>(`select title from public.documents where id = $1`, [aliceDocId]);
      expect(doc.title).toBe('Home');

      await expect(createProject(viewer, 'Viewer project', alice.orgId)).rejects.toThrow(/row-level security/);
    });

    it('lets editors edit documents but not delete projects', async () => {
      await t.asUser(editor.id, `update public.documents set title = 'Edited' where id = $1`, [aliceDocId]);
      const [doc] = await t.asAdmin<{ title: string }>(`select title from public.documents where id = $1`, [aliceDocId]);
      expect(doc.title).toBe('Edited');
      await t.asUser(editor.id, `update public.documents set title = 'Home' where id = $1`, [aliceDocId]);

      await t.asUser(editor.id, `delete from public.projects where id = $1`, [aliceProjectId]);
      expect(await t.asAdmin(`select id from public.projects where id = $1`, [aliceProjectId])).toHaveLength(1);
    });

    it('stops editors changing roles', async () => {
      await t.asUser(editor.id, `update public.organization_members set role = 'owner' where user_id = $1`, [editor.id]);
      const [member] = await t.asAdmin<{ role: string }>(
        `select role from public.organization_members where user_id = $1 and organization_id = $2`,
        [editor.id, alice.orgId],
      );
      expect(member.role).toBe('editor');
    });

    it('stops admins granting the owner role', async () => {
      await expect(
        t.asUser(admin.id, `update public.organization_members set role = 'owner' where user_id = $1 and organization_id = $2`, [
          admin.id,
          alice.orgId,
        ]),
      ).rejects.toThrow(/row-level security/);
    });

    it('stops admins removing owners', async () => {
      await t.asUser(admin.id, `delete from public.organization_members where user_id = $1 and organization_id = $2`, [
        alice.id,
        alice.orgId,
      ]);
      expect(
        await t.asAdmin(`select id from public.organization_members where user_id = $1 and organization_id = $2`, [
          alice.id,
          alice.orgId,
        ]),
      ).toHaveLength(1);
    });

    it('lets members leave a workspace on their own', async () => {
      const leaver = await t.signUp('leaver@example.com');
      await addMember(leaver, alice.orgId, 'viewer');
      await t.asUser(leaver.id, `delete from public.organization_members where user_id = $1 and organization_id = $2`, [
        leaver.id,
        alice.orgId,
      ]);
      expect(
        await t.asAdmin(`select id from public.organization_members where user_id = $1 and organization_id = $2`, [
          leaver.id,
          alice.orgId,
        ]),
      ).toEqual([]);
    });
  });

  describe('protected columns', () => {
    it('blocks users upgrading their own plan', async () => {
      await expect(
        t.asUser(alice.id, `update public.organizations set plan = 'enterprise' where id = $1`, [alice.orgId]),
      ).rejects.toThrow(/permission denied/);
    });

    it('blocks setting publish state directly', async () => {
      await expect(
        t.asUser(alice.id, `update public.projects set status = 'published' where id = $1`, [aliceProjectId]),
      ).rejects.toThrow(/permission denied/);
      await expect(
        t.asUser(alice.id, `update public.projects set published_version_id = gen_random_uuid() where id = $1`, [aliceProjectId]),
      ).rejects.toThrow(/permission denied/);
    });

    it('blocks moving a project to another workspace', async () => {
      await expect(
        t.asUser(alice.id, `update public.projects set organization_id = $1 where id = $2`, [bob.orgId, aliceProjectId]),
      ).rejects.toThrow(/permission denied/);
    });

    it('blocks writing published versions directly', async () => {
      await expect(
        t.asUser(
          alice.id,
          `insert into public.project_versions (project_id, organization_id, version_number, snapshot)
           values ($1, $2, 1, '{}'::jsonb)`,
          [aliceProjectId, alice.orgId],
        ),
      ).rejects.toThrow(/permission denied/);
    });

    it('blocks forging who created a project', async () => {
      await expect(
        t.asUser(
          alice.id,
          `insert into public.projects (organization_id, type, title, created_by) values ($1, 'page', 'Forged', $2)`,
          [alice.orgId, bob.id],
        ),
      ).rejects.toThrow(/permission denied/);
    });

    it('blocks users changing the email on their profile row', async () => {
      await expect(
        t.asUser(alice.id, `update public.user_profiles set email = 'x@example.com' where id = $1`, [alice.id]),
      ).rejects.toThrow(/permission denied/);
    });
  });

  describe('workspace owner safeguard', () => {
    it('blocks the last owner leaving or being demoted', async () => {
      await expect(
        t.asUser(bob.id, `delete from public.organization_members where user_id = $1 and organization_id = $2`, [bob.id, bob.orgId]),
      ).rejects.toThrow(/at least one owner/);
      await expect(
        t.asUser(bob.id, `update public.organization_members set role = 'admin' where user_id = $1 and organization_id = $2`, [
          bob.id,
          bob.orgId,
        ]),
      ).rejects.toThrow(/at least one owner/);
    });

    it('still allows an owner to delete the whole workspace', async () => {
      const dave = await t.signUp('dave@example.com');
      await createProject(dave, 'Doomed');
      await t.asUser(dave.id, `delete from public.organizations where id = $1`, [dave.orgId]);
      expect(await t.asAdmin(`select id from public.organizations where id = $1`, [dave.orgId])).toEqual([]);
      expect(await t.asAdmin(`select id from public.projects where organization_id = $1`, [dave.orgId])).toEqual([]);
    });
  });

  describe('create_project_with_documents', () => {
    it('gives every document the same project and records the creator', async () => {
      const [row] = await t.asUser<{ id: string }>(
        alice.id,
        `select public.create_project_with_documents(
           $1, 'website', 'Multi Page', project_documents => $2::jsonb
         ) as id`,
        [
          alice.orgId,
          JSON.stringify([
            { title: 'Home', slug: '', content: { rootId: 'r', nodes: {} } },
            { title: 'About', slug: 'about', content: { rootId: 'r', nodes: {} } },
          ]),
        ],
      );
      const docs = await t.asUser<{ project_id: string; slug: string; position: number }>(
        alice.id,
        `select project_id, slug, position from public.documents where project_id = $1 order by position`,
        [row.id],
      );
      expect(docs.map((d) => [d.slug, d.position])).toEqual([['', 0], ['about', 1]]);

      const [project] = await t.asAdmin<{ created_by: string }>(`select created_by from public.projects where id = $1`, [row.id]);
      expect(project.created_by).toBe(alice.id);
    });

    it('creates nothing if any document is invalid', async () => {
      await expect(
        t.asUser(
          alice.id,
          `select public.create_project_with_documents(
             $1, 'website', 'Half Made', project_documents => $2::jsonb
           )`,
          [
            alice.orgId,
            JSON.stringify([
              { title: 'Good', slug: '', content: { rootId: 'r', nodes: {} } },
              { title: 'No content', slug: 'bad' },
            ]),
          ],
        ),
      ).rejects.toThrow();
      expect(await t.asAdmin(`select id from public.projects where title = 'Half Made'`)).toEqual([]);
    });
  });

  describe('save conflicts', () => {
    it('bumps the revision so a stale save changes nothing', async () => {
      const [before] = await t.asUser<{ revision: number }>(alice.id, `select revision from public.documents where id = $1`, [aliceDocId]);

      const fresh = await t.asUser(
        alice.id,
        `update public.documents set title = 'Fresh' where id = $1 and revision = $2 returning id`,
        [aliceDocId, before.revision],
      );
      expect(fresh).toHaveLength(1);

      const stale = await t.asUser(
        alice.id,
        `update public.documents set title = 'Stale' where id = $1 and revision = $2 returning id`,
        [aliceDocId, before.revision],
      );
      expect(stale).toEqual([]);

      const [doc] = await t.asAdmin<{ title: string }>(`select title from public.documents where id = $1`, [aliceDocId]);
      expect(doc.title).toBe('Fresh');
    });
  });

  describe('asset files', () => {
    const upload = (user: TestUser, path: string) =>
      t.asUser(user.id, `insert into storage.objects (bucket_id, name) values ('assets', $1)`, [path]);

    it('lets users upload into their own workspace folder', async () => {
      await expect(upload(alice, `${alice.orgId}/logo.png`)).resolves.toBeDefined();
    });

    it('blocks uploads into another workspace folder', async () => {
      await expect(upload(bob, `${alice.orgId}/evil.png`)).rejects.toThrow(/row-level security/);
    });

    it('blocks uploads to a path that is not a workspace folder', async () => {
      await expect(upload(alice, 'not-a-uuid/logo.png')).rejects.toThrow(/row-level security/);
    });
  });
});
