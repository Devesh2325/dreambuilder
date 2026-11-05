// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, TestDb, TestUser } from './harness';

describe('platform', () => {
  let t: TestDb;
  let admin: TestUser;
  let alice: TestUser;
  let bob: TestUser;

  const createProject = (user: TestUser, type: string, title = 'P') =>
    t.asUser(user.id, `select public.create_project_with_documents($1, $2, $3, project_documents => '[{"title":"Home","slug":"","content":{"rootId":"r","nodes":{}}}]'::jsonb) as id`, [user.orgId, type, title]);

  beforeAll(async () => {
    t = await createTestDb();
    admin = await t.signUp('admin@example.com');
    alice = await t.signUp('alice@example.com');
    bob = await t.signUp('bob@example.com');
    await t.asAdmin(`insert into public.platform_admins (user_id) values ($1)`, [admin.id]);
  }, 60_000);

  describe('profiles', () => {
    it('lets people set their own time zone and job title', async () => {
      await t.asUser(alice.id, `update public.user_profiles set timezone = 'Asia/Kolkata', job_title = 'Founder' where id = $1`, [alice.id]);
      const [row] = await t.asAdmin<{ timezone: string }>(`select timezone from public.user_profiles where id = $1`, [alice.id]);
      expect(row.timezone).toBe('Asia/Kolkata');
    });

    it('does not let them change someone else\'s', async () => {
      await t.asUser(bob.id, `update public.user_profiles set timezone = 'Europe/Paris' where id = $1`, [alice.id]);
      const [row] = await t.asAdmin<{ timezone: string }>(`select timezone from public.user_profiles where id = $1`, [alice.id]);
      expect(row.timezone).toBe('Asia/Kolkata');
    });

    it('records activity only through the function', async () => {
      await expect(t.asUser(alice.id, `update public.user_profiles set last_active_at = now() - interval '1 year' where id = $1`, [alice.id])).rejects.toThrow(/permission denied/);
      await t.asUser(alice.id, `select public.touch_last_active()`);
      const [row] = await t.asAdmin<{ last_active_at: string }>(`select last_active_at from public.user_profiles where id = $1`, [alice.id]);
      expect(row.last_active_at).toBeTruthy();
    });
  });

  describe('super admins', () => {
    const adminOnly = [
      `select public.admin_overview()`,
      `select * from public.admin_list_users()`,
      `select public.admin_set_workspace_plan(gen_random_uuid(), 'pro')`,
      `select public.admin_update_plan('free', 'Free', '', '', 999, 999)`,
      `select public.admin_set_module_quota('free', 'form', 99)`,
      `select public.admin_send_nudge(null, 'Hello', '', null)`,
      `select * from public.admin_list_plan_requests()`,
      `select public.admin_resolve_plan_request(gen_random_uuid(), true)`,
      `select * from public.admin_list_tickets()`,
      `select * from public.admin_ticket_messages(gen_random_uuid())`,
      `select public.admin_reply_ticket(gen_random_uuid(), 'x')`,
      `select public.admin_set_ticket_status(gen_random_uuid(), 'closed')`,
    ];

    it.each(adminOnly)('refuses ordinary users: %s', async (sql) => {
      await expect(t.asUser(alice.id, sql)).rejects.toThrow(/Only a super admin/);
    });

    it.each(adminOnly)('refuses logged-out visitors: %s', async (sql) => {
      await expect(t.asAnon(sql)).rejects.toThrow(/permission denied/);
    });

    it('cannot be granted from the app', async () => {
      await expect(t.asUser(alice.id, `insert into public.platform_admins (user_id) values ($1)`, [alice.id])).rejects.toThrow(/permission denied/);
      await expect(t.asUser(alice.id, `select * from public.platform_admins`)).rejects.toThrow(/permission denied/);
      const [row] = await t.asUser<{ yes: boolean }>(alice.id, `select public.is_platform_admin() as yes`);
      expect(row.yes).toBe(false);
    });

    it('recognizes a real one', async () => {
      const [row] = await t.asUser<{ yes: boolean }>(admin.id, `select public.is_platform_admin() as yes`);
      expect(row.yes).toBe(true);
    });

    it('sees every user, their plan and their projects', async () => {
      const users = await t.asUser<{ email: string; plan: string; project_count: number }>(admin.id, `select * from public.admin_list_users()`);
      expect(users.map((user) => user.email)).toEqual(expect.arrayContaining(['alice@example.com', 'bob@example.com']));
      expect(users.find((user) => user.email === 'alice@example.com')?.plan).toBe('free');
    });

    it('sees totals', async () => {
      const [row] = await t.asUser<{ o: { users: number; byPlan: Record<string, number> } }>(admin.id, `select public.admin_overview() as o`);
      expect(row.o.users).toBeGreaterThanOrEqual(3);
      expect(row.o.byPlan.free).toBeGreaterThanOrEqual(3);
    });
  });

  describe('quotas', () => {
    it('are readable by users, and not writable', async () => {
      const rows = await t.asUser(alice.id, `select * from public.plan_settings`);
      expect(rows).toHaveLength(5);
      await expect(t.asUser(alice.id, `update public.plan_settings set max_projects = 9999`)).rejects.toThrow(/permission denied/);
      await expect(t.asUser(alice.id, `insert into public.plan_module_quotas values ('free', 'form', 999)`)).rejects.toThrow(/permission denied/);
      await expect(t.asAnon(`select * from public.plan_settings`)).rejects.toThrow(/permission denied/);
    });

    it('stop a module at its own limit, leaving the others open', async () => {
      const carol = await t.signUp('carol@example.com');
      await t.asUser(admin.id, `select public.admin_set_module_quota('free', 'form', 1)`);
      await createProject(carol, 'form');
      await expect(createProject(carol, 'form', 'Second')).rejects.toThrow(/Your plan allows 1 of this kind/);
      await createProject(carol, 'tour');
      await t.asUser(admin.id, `select public.admin_set_module_quota('free', 'form', null)`);
      await createProject(carol, 'form', 'Allowed again');
    });

    it('follow what the super admin sets for the plan overall', async () => {
      const dan = await t.signUp('dan@example.com');
      await t.asUser(admin.id, `select public.admin_update_plan('free', 'Free', 'Free', '', 1, 1)`);
      await createProject(dan, 'form');
      await expect(createProject(dan, 'tour')).rejects.toThrow(/project limit/);
      await t.asUser(admin.id, `select public.admin_update_plan('free', 'Free', 'Free', '', 3, 1)`);
      await createProject(dan, 'tour');
    });

    it('rises with a better plan', async () => {
      const erin = await t.signUp('erin@example.com');
      await t.asUser(admin.id, `select public.admin_set_module_quota('free', 'banner', 0)`);
      await expect(createProject(erin, 'banner')).rejects.toThrow(/Your plan allows 0/);
      await t.asUser(admin.id, `select public.admin_set_workspace_plan($1, 'pro')`, [erin.orgId]);
      await createProject(erin, 'banner');
      await t.asUser(admin.id, `select public.admin_set_module_quota('free', 'banner', null)`);
    });

    it('rejects an unknown plan', async () => {
      await expect(t.asUser(admin.id, `select public.admin_set_workspace_plan($1, 'platinum')`, [alice.orgId])).rejects.toThrow(/Unknown plan/);
    });
  });

  describe('plan requests', () => {
    it('come from the workspace owner, one at a time, and a super admin decides', async () => {
      await expect(t.asUser(alice.id, `update public.organizations set plan = 'pro' where id = $1`, [alice.orgId])).rejects.toThrow(/permission denied/);
      await t.asUser(alice.id, `insert into public.plan_requests (organization_id, plan, note) values ($1, 'pro', 'Please')`, [alice.orgId]);
      await expect(t.asUser(alice.id, `insert into public.plan_requests (organization_id, plan) values ($1, 'agency')`, [alice.orgId])).rejects.toThrow(/plan_requests_one_pending/);
      await expect(t.asUser(bob.id, `insert into public.plan_requests (organization_id, plan) values ($1, 'pro')`, [alice.orgId])).rejects.toThrow(/row-level security/);
      await expect(t.asUser(alice.id, `insert into public.plan_requests (organization_id, plan, status) values ($1, 'pro', 'approved')`, [alice.orgId])).rejects.toThrow(/permission denied/);
      expect(await t.asUser(bob.id, `select * from public.plan_requests where organization_id = $1`, [alice.orgId])).toEqual([]);

      const [request] = await t.asUser<{ id: string; workspace_name: string }>(admin.id, `select * from public.admin_list_plan_requests() where organization_id = $1`, [alice.orgId]);
      await t.asUser(admin.id, `select public.admin_resolve_plan_request($1, true)`, [request.id]);
      const [org] = await t.asAdmin<{ plan: string }>(`select plan from public.organizations where id = $1`, [alice.orgId]);
      expect(org.plan).toBe('pro');
      await expect(t.asUser(admin.id, `select public.admin_resolve_plan_request($1, true)`, [request.id])).rejects.toThrow(/already been handled/);
    });

    it('can be declined, leaving the plan alone', async () => {
      await t.asUser(bob.id, `insert into public.plan_requests (organization_id, plan) values ($1, 'agency')`, [bob.orgId]);
      const [request] = await t.asUser<{ id: string }>(admin.id, `select * from public.admin_list_plan_requests() where organization_id = $1`, [bob.orgId]);
      await t.asUser(admin.id, `select public.admin_resolve_plan_request($1, false)`, [request.id]);
      const [org] = await t.asAdmin<{ plan: string }>(`select plan from public.organizations where id = $1`, [bob.orgId]);
      expect(org.plan).toBe('free');
    });
  });

  describe('nudges', () => {
    it('reach one person, who alone can read and dismiss them', async () => {
      const [sent] = await t.asUser<{ n: number }>(admin.id, `select public.admin_send_nudge($1, 'Try forms', 'They are new', '/forms') as n`, [alice.id]);
      expect(sent.n).toBe(1);
      const mine = await t.asUser<{ id: string; title: string }>(alice.id, `select id, title from public.user_nudges`);
      expect(mine.map((row) => row.title)).toEqual(['Try forms']);
      expect(await t.asUser(bob.id, `select * from public.user_nudges`)).toEqual([]);

      await t.asUser(bob.id, `update public.user_nudges set read_at = now() where id = $1`, [mine[0].id]);
      const [untouched] = await t.asAdmin<{ read_at: string | null }>(`select read_at from public.user_nudges where id = $1`, [mine[0].id]);
      expect(untouched.read_at).toBeNull();

      await t.asUser(alice.id, `update public.user_nudges set read_at = now() where id = $1`, [mine[0].id]);
      await expect(t.asUser(alice.id, `update public.user_nudges set title = 'Changed' where id = $1`, [mine[0].id])).rejects.toThrow(/permission denied/);
    });

    it('can go to everyone', async () => {
      const [sent] = await t.asUser<{ n: number }>(admin.id, `select public.admin_send_nudge(null, 'News', '', null) as n`);
      expect(sent.n).toBeGreaterThanOrEqual(3);
    });

    it('cannot be sent by users, and cannot carry an unsafe link', async () => {
      await expect(t.asUser(alice.id, `insert into public.user_nudges (user_id, title) values ($1, 'Fake')`, [bob.id])).rejects.toThrow(/permission denied/);
      await expect(t.asUser(admin.id, `select public.admin_send_nudge($1, 'Bad', '', 'javascript:alert(1)')`, [alice.id])).rejects.toThrow(/link_url/);
      await expect(t.asUser(admin.id, `select public.admin_send_nudge($1, 'Bad', '', '//evil.example')`, [alice.id])).rejects.toThrow(/link_url/);
    });
  });

  describe('support', () => {
    let ticketId: string;

    it('lets a user open a ticket that only they can see', async () => {
      const [ticket] = await t.asUser<{ id: string }>(alice.id, `insert into public.support_tickets (organization_id, subject) values ($1, 'Help') returning id`, [alice.orgId]);
      ticketId = ticket.id;
      await t.asUser(alice.id, `insert into public.support_messages (ticket_id, body) values ($1, 'It broke')`, [ticketId]);
      expect(await t.asUser(bob.id, `select * from public.support_tickets where id = $1`, [ticketId])).toEqual([]);
      expect(await t.asUser(bob.id, `select * from public.support_messages where ticket_id = $1`, [ticketId])).toEqual([]);
      await expect(t.asUser(bob.id, `insert into public.support_messages (ticket_id, body) values ($1, 'Hi')`, [ticketId])).rejects.toThrow(/row-level security/);
    });

    it('does not let anyone pose as staff, or open a ticket for someone else', async () => {
      await expect(t.asUser(alice.id, `insert into public.support_messages (ticket_id, body, is_staff) values ($1, 'Refund granted', true)`, [ticketId])).rejects.toThrow(/permission denied/);
      await expect(t.asUser(alice.id, `insert into public.support_tickets (subject, user_id) values ('x', $1)`, [bob.id])).rejects.toThrow(/permission denied/);
      await expect(t.asUser(alice.id, `update public.support_tickets set status = 'closed' where id = $1`, [ticketId])).rejects.toThrow(/permission denied/);
      await expect(t.asUser(bob.id, `insert into public.support_tickets (organization_id, subject) values ($1, 'x')`, [alice.orgId])).rejects.toThrow(/row-level security/);
    });

    it('lets a super admin reply, which marks it answered', async () => {
      await t.asUser(admin.id, `select public.admin_reply_ticket($1, 'Fixed it')`, [ticketId]);
      const messages = await t.asUser<{ is_staff: boolean; body: string }>(alice.id, `select is_staff, body from public.support_messages where ticket_id = $1 order by created_at`, [ticketId]);
      expect(messages.at(-1)).toEqual({ is_staff: true, body: 'Fixed it' });
      const [ticket] = await t.asUser<{ status: string }>(alice.id, `select status from public.support_tickets where id = $1`, [ticketId]);
      expect(ticket.status).toBe('answered');
    });

    it('reopens when the user replies, and stops taking replies once closed', async () => {
      await t.asUser(alice.id, `insert into public.support_messages (ticket_id, body) values ($1, 'Still broken')`, [ticketId]);
      const [open] = await t.asUser<{ status: string }>(alice.id, `select status from public.support_tickets where id = $1`, [ticketId]);
      expect(open.status).toBe('open');
      await t.asUser(admin.id, `select public.admin_set_ticket_status($1, 'closed')`, [ticketId]);
      await expect(t.asUser(alice.id, `insert into public.support_messages (ticket_id, body) values ($1, 'Hello?')`, [ticketId])).rejects.toThrow(/row-level security/);
    });
  });

  it('keeps every internal helper away from clients', async () => {
    for (const sql of [`select public.require_platform_admin()`, `select public.plan_max_projects('free')`, `select public.plan_max_members('free')`]) {
      await expect(t.asUser(alice.id, sql)).rejects.toThrow(/permission denied/);
      await expect(t.asAnon(sql)).rejects.toThrow(/permission denied/);
    }
  });
});
