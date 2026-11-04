// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, TestDb, TestUser } from './harness';

describe('publishing and visitor functions', () => {
  let t: TestDb;
  let alice: TestUser;
  let bob: TestUser;
  let projectId: string;

  const createProject = async (user: TestUser, title: string) => {
    const [row] = await t.asUser<{ id: string }>(
      user.id,
      `select public.create_project_with_documents($1, 'form', $2, project_documents => $3::jsonb, project_settings => $4::jsonb) as id`,
      [
        user.orgId,
        title,
        JSON.stringify([{ title: 'Home', slug: '', content: { rootId: 'draft', nodes: {} } }]),
        JSON.stringify({ webhookUrl: 'https://hooks.example.com/secret' }),
      ],
    );
    return row.id;
  };
  const publish = (user: TestUser, id: string, slug?: string) =>
    t.asUser<{ id: string }>(user.id, `select public.publish_project($1, 'first', $2) as id`, [id, slug ?? null]);
  const setPlan = (orgId: string, plan: string) =>
    t.asAdmin(`update public.organizations set plan = $1 where id = $2`, [plan, orgId]);

  beforeAll(async () => {
    t = await createTestDb();
    alice = await t.signUp('alice@example.com', 'Alice Co');
    bob = await t.signUp('bob@example.com', 'Bob Co');
    await setPlan(alice.orgId, 'pro');
    projectId = await createProject(alice, 'Contact Form');
  }, 60_000);

  describe('before publishing', () => {
    it('shows visitors nothing and rejects their data', async () => {
      const [row] = await t.asAnon<{ s: unknown }>(`select public.get_published_experience($1) as s`, [projectId]);
      expect(row.s).toBeNull();
      await expect(t.asAnon(`select public.submit_form($1, '{"a":1}'::jsonb)`, [projectId])).rejects.toThrow(/not available/);
      const [tracked] = await t.asAnon<{ n: number }>(`select public.track_events($1, '[{"type":"impression"}]'::jsonb) as n`, [projectId]);
      expect(tracked.n).toBe(0);
    });
  });

  describe('publish', () => {
    it('is refused for other workspaces and for viewers', async () => {
      await expect(publish(bob, projectId)).rejects.toThrow(/not allowed/);
      const viewer = await t.signUp('viewer@example.com');
      await t.asAdmin(`insert into public.organization_members (organization_id, user_id, role) values ($1, $2, 'viewer')`, [alice.orgId, viewer.id]);
      await expect(publish(viewer, projectId)).rejects.toThrow(/not allowed/);
    });

    it('is unavailable to logged-out visitors', async () => {
      await expect(t.asAnon(`select public.publish_project($1)`, [projectId])).rejects.toThrow(/permission denied/);
    });

    it('creates a version and makes it public by slug and id', async () => {
      await publish(alice, projectId, 'contact');
      const [bySlug] = await t.asAnon<{ s: { project: { slug: string }; documents: unknown[] } }>(`select public.get_published_site('contact') as s`);
      expect(bySlug.s.project.slug).toBe('contact');
      expect(bySlug.s.documents).toHaveLength(1);
      const [byId] = await t.asAnon<{ s: unknown }>(`select public.get_published_experience($1) as s`, [projectId]);
      expect(byId.s).not.toBeNull();
    });

    it('never exposes the webhook address to visitors', async () => {
      const [row] = await t.asAnon<{ s: unknown }>(`select public.get_published_site('contact') as s`);
      expect(JSON.stringify(row.s)).not.toContain('hooks.example.com');
    });

    it('keeps visitors on the published version while drafts change', async () => {
      await t.asUser(alice.id, `update public.documents set content = '{"rootId":"edited","nodes":{}}' where project_id = $1`, [projectId]);
      const [row] = await t.asAnon<{ s: { documents: { content: { rootId: string } }[] } }>(`select public.get_published_site('contact') as s`);
      expect(row.s.documents[0].content.rootId).toBe('draft');
    });

    it('rejects a slug already taken by someone else', async () => {
      const bobProject = await createProject(bob, 'Bob Form');
      await expect(publish(bob, bobProject, 'contact')).rejects.toThrow(/duplicate key|unique/);
    });

    it('generates a slug when none is given', async () => {
      const id = await createProject(bob, 'Hello, World!');
      await publish(bob, id);
      const [row] = await t.asAdmin<{ slug: string }>(`select slug from public.projects where id = $1`, [id]);
      expect(row.slug).toMatch(/^hello-world-[0-9a-f]{6}$/);
    });

    it('numbers versions, and restoring brings drafts back without changing what is live', async () => {
      const [v2] = await publish(alice, projectId);
      await t.asUser(alice.id, `update public.documents set content = '{"rootId":"third","nodes":{}}' where project_id = $1`, [projectId]);

      const versions = await t.asUser<{ id: string; version_number: number }>(
        alice.id,
        `select id, version_number from public.project_versions where project_id = $1 order by version_number`,
        [projectId],
      );
      expect(versions.map((v) => v.version_number)).toEqual([1, 2]);

      await t.asUser(alice.id, `select public.restore_project_version($1)`, [versions[0].id]);
      const [doc] = await t.asUser<{ content: { rootId: string } }>(alice.id, `select content from public.documents where project_id = $1`, [projectId]);
      expect(doc.content.rootId).toBe('draft');

      const [project] = await t.asAdmin<{ published_version_id: string }>(`select published_version_id from public.projects where id = $1`, [projectId]);
      expect(project.published_version_id).toBe(v2.id);
    });

    it('refuses restoring a version from another workspace', async () => {
      const [version] = await t.asAdmin<{ id: string }>(`select id from public.project_versions where project_id = $1 limit 1`, [projectId]);
      await expect(t.asUser(bob.id, `select public.restore_project_version($1)`, [version.id])).rejects.toThrow(/not allowed/);
    });

    it('stops being public after unpublishing', async () => {
      const id = await createProject(alice, 'Temporary');
      await publish(alice, id, 'temporary');
      await t.asUser(alice.id, `select public.unpublish_project($1)`, [id]);
      const [row] = await t.asAnon<{ s: unknown }>(`select public.get_published_site('temporary') as s`);
      expect(row.s).toBeNull();
    });
  });

  describe('form submissions', () => {
    const submit = (data: object, visitor = 'visitor-one') =>
      t.asAnon(`select public.submit_form($1, $2::jsonb, $3)`, [projectId, JSON.stringify(data), visitor]);

    it('stores answers visible only to the workspace', async () => {
      await submit({ email: 'v@example.com' });
      const rows = await t.asUser<{ data: { email: string } }>(alice.id, `select data from public.form_submissions where project_id = $1`, [projectId]);
      expect(rows[0].data.email).toBe('v@example.com');
      expect(await t.asUser(bob.id, `select * from public.form_submissions where project_id = $1`, [projectId])).toEqual([]);
      await expect(t.asAnon(`select * from public.form_submissions`)).rejects.toThrow(/permission denied/);
    });

    it('blocks direct inserts', async () => {
      await expect(
        t.asAnon(`insert into public.form_submissions (project_id, organization_id, data) values ($1, $2, '{}')`, [projectId, alice.orgId]),
      ).rejects.toThrow(/permission denied/);
    });

    it('silently drops bot submissions caught by the hidden field', async () => {
      await submit({ _hp: 'spam', email: 'bot@example.com' }, 'bot-visitor');
      const rows = await t.asAdmin(`select id from public.form_submissions where visitor_id = 'bot-visitor'`);
      expect(rows).toEqual([]);
    });

    it('rejects oversized or malformed data', async () => {
      await expect(t.asAnon(`select public.submit_form($1, '[1]'::jsonb)`, [projectId])).rejects.toThrow(/Invalid/);
      await expect(submit({ blob: 'x'.repeat(70000) + Math.random() }, 'big')).rejects.toThrow(/Invalid/);
    });

    it('rate limits one source', async () => {
      for (let i = 0; i < 10; i += 1) await submit({ i }, 'flooder');
      await expect(submit({ i: 11 }, 'flooder')).rejects.toThrow(/Too many/);
      await expect(submit({ i: 12 }, 'someone-else')).resolves.toBeDefined();
    });

    it('sends the webhook through pg_net when enabled, and survives it failing', async () => {
      await t.db.exec(`
        create schema net;
        create table net.calls (url text, body jsonb);
        create function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout integer)
        returns bigint language plpgsql as $$
        begin
          if body -> 'data' ->> 'boom' = 'yes' then raise exception 'network down'; end if;
          insert into net.calls values (url, body);
          return 1;
        end $$;
      `);
      await submit({ hello: 'world' }, 'webhook-visitor');
      const [call] = await t.asAdmin<{ url: string; body: { data: { hello: string } } }>(`select * from net.calls`);
      expect(call.url).toBe('https://hooks.example.com/secret');
      expect(call.body.data.hello).toBe('world');

      await submit({ boom: 'yes' }, 'webhook-visitor');
      const rows = await t.asAdmin(`select id from public.form_submissions where data ->> 'boom' = 'yes'`);
      expect(rows).toHaveLength(1);
      await t.db.exec(`drop schema net cascade`);
    });
  });

  describe('checklist progress', () => {
    it('saves per visitor', async () => {
      await t.asAnon(`select public.save_checklist_progress($1, 'visitor-aaa', '["a","b"]'::jsonb)`, [projectId]);
      await t.asAnon(`select public.save_checklist_progress($1, 'visitor-aaa', '["a"]'::jsonb)`, [projectId]);
      const [mine] = await t.asAnon<{ c: string[] }>(`select public.get_checklist_progress($1, 'visitor-aaa') as c`, [projectId]);
      expect(mine.c).toEqual(['a']);
      const [other] = await t.asAnon<{ c: string[] }>(`select public.get_checklist_progress($1, 'visitor-bbb') as c`, [projectId]);
      expect(other.c).toEqual([]);
    });

    it('cannot be read directly', async () => {
      await expect(t.asUser(alice.id, `select * from public.checklist_progress`)).rejects.toThrow(/permission denied/);
    });
  });

  describe('analytics', () => {
    it('records valid events, skips malformed ones, and summarizes for the workspace only', async () => {
      const events = [
        { type: 'impression', visitorId: 'a', sessionId: 's', device: 'mobile' },
        { type: 'impression', visitorId: 'b' },
        { type: 'BAD TYPE!' },
      ];
      const [tracked] = await t.asAnon<{ n: number }>(`select public.track_events($1, $2::jsonb) as n`, [projectId, JSON.stringify(events)]);
      expect(tracked.n).toBe(2);

      const rows = await t.asUser<{ event_type: string; events: string; visitors: string }>(
        alice.id,
        `select * from public.analytics_summary($1, 7) where event_type = 'impression'`,
        [alice.orgId],
      );
      expect(Number(rows[0].events)).toBe(2);
      expect(Number(rows[0].visitors)).toBe(2);
      expect(await t.asUser(bob.id, `select * from public.analytics_summary($1, 7)`, [alice.orgId])).toEqual([]);
    });

    it('limits batch size', async () => {
      const batch = JSON.stringify(Array.from({ length: 51 }, () => ({ type: 'x' })));
      await expect(t.asAnon(`select public.track_events($1, $2::jsonb)`, [projectId, batch])).rejects.toThrow(/Invalid/);
    });
  });

  describe('plan limits', () => {
    it('stops new projects at the plan limit', async () => {
      const carol = await t.signUp('carol@example.com');
      for (let i = 0; i < 3; i += 1) await createProject(carol, `P${i}`);
      await expect(createProject(carol, 'Too many')).rejects.toThrow(/project limit/);
    });
  });

  describe('invitations', () => {
    const invite = async (by: TestUser, org: string, email: string, role = 'editor') => {
      const [row] = await t.asUser<{ token: string }>(by.id, `select public.create_invitation($1, $2, $3) as token`, [org, email, role]);
      return row.token;
    };

    it('adds the invited user with the chosen role', async () => {
      const dana = await t.signUp('dana@example.com');
      const token = await invite(alice, alice.orgId, 'Dana@Example.com');
      await t.asUser(dana.id, `select public.accept_invitation($1)`, [token]);
      const [member] = await t.asAdmin<{ role: string }>(
        `select role from public.organization_members where user_id = $1 and organization_id = $2`,
        [dana.id, alice.orgId],
      );
      expect(member.role).toBe('editor');
    });

    it('only works for the invited email, and only once', async () => {
      const erin = await t.signUp('erin@example.com');
      const stranger = await t.signUp('stranger@example.com');
      const token = await invite(alice, alice.orgId, 'erin@example.com');

      await expect(t.asUser(stranger.id, `select public.accept_invitation($1)`, [token])).rejects.toThrow(/invalid or has expired/);
      await t.asUser(erin.id, `select public.accept_invitation($1)`, [token]);
      await t.asAdmin(`delete from public.organization_members where user_id = $1 and organization_id = $2`, [erin.id, alice.orgId]);
      await expect(t.asUser(erin.id, `select public.accept_invitation($1)`, [token])).rejects.toThrow(/invalid or has expired/);
    });

    it('rejects expired and unknown tokens', async () => {
      const fred = await t.signUp('fred@example.com');
      const token = await invite(alice, alice.orgId, 'fred@example.com');
      await t.asAdmin(`update public.invitations set expires_at = now() - interval '1 day' where email = 'fred@example.com'`);
      await expect(t.asUser(fred.id, `select public.accept_invitation($1)`, [token])).rejects.toThrow(/invalid or has expired/);
      await expect(t.asUser(fred.id, `select public.accept_invitation('nonsense')`)).rejects.toThrow(/invalid or has expired/);
    });

    it('never exposes the token hash', async () => {
      await expect(t.asUser(alice.id, `select token_hash from public.invitations`)).rejects.toThrow(/permission denied/);
    });

    it('is limited to owners and admins, and admins cannot invite an owner', async () => {
      const editor = await t.signUp('ed@example.com');
      const admin = await t.signUp('ad@example.com');
      await t.asAdmin(`insert into public.organization_members (organization_id, user_id, role) values ($1, $2, 'editor'), ($1, $3, 'admin')`, [alice.orgId, editor.id, admin.id]);
      await expect(invite(editor, alice.orgId, 'x@example.com')).rejects.toThrow(/Not allowed/);
      await expect(invite(admin, alice.orgId, 'x@example.com', 'owner')).rejects.toThrow(/Only owners/);
      await expect(invite(bob, alice.orgId, 'x@example.com')).rejects.toThrow(/Not allowed/);
    });

    it('respects the plan team limit', async () => {
      const gina = await t.signUp('gina@example.com');
      await expect(invite(gina, gina.orgId, 'x@example.com')).rejects.toThrow(/team member limit/);
    });
  });

  describe('function exposure', () => {
    it.each([
      `select public.create_workspace_for_user(gen_random_uuid(), 'x')`,
      `select public.slugify('x')`,
      `select public.plan_max_projects('free')`,
    ])('hides the internal call %s from logged-out and logged-in users', async (sql) => {
      await expect(t.asAnon(sql)).rejects.toThrow(/permission denied/);
      await expect(t.asUser(alice.id, sql)).rejects.toThrow(/permission denied/);
    });
  });
});
