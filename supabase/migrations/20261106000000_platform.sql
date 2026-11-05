-- Everything that runs the platform itself: profiles, plans and quotas, super admins,
-- nudges and customer support.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

alter table public.user_profiles
  add column timezone text check (timezone is null or char_length(timezone) <= 64),
  add column job_title text check (job_title is null or char_length(job_title) <= 120),
  add column last_active_at timestamptz;

grant update (timezone, job_title) on public.user_profiles to authenticated;

-- Written here rather than by clients, so nobody can claim to have been active.
create function public.touch_last_active()
returns void
language sql security definer set search_path = ''
as $$
  update public.user_profiles set last_active_at = now()
  where id = auth.uid() and (last_active_at is null or last_active_at < now() - interval '5 minutes');
$$;

-- ---------------------------------------------------------------------------
-- Super admins. There's no way to become one from the app: add a row with SQL.
-- ---------------------------------------------------------------------------

create table public.platform_admins (
  user_id uuid primary key references public.user_profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
revoke all on public.platform_admins from anon, authenticated;
alter table public.platform_admins enable row level security;

create function public.is_platform_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.platform_admins a where a.user_id = auth.uid());
$$;

create function public.require_platform_admin()
returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.platform_admins a where a.user_id = auth.uid()) then
    raise exception 'Only a super admin can do this' using errcode = '42501';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Plans and quotas. Defaults match PLAN_LIMITS in src/types/auth.ts.
-- ---------------------------------------------------------------------------

create table public.plan_settings (
  plan text primary key check (plan in ('free', 'starter', 'pro', 'agency', 'enterprise')),
  label text not null check (char_length(label) between 1 and 60),
  price_text text not null default '' check (char_length(price_text) <= 60),
  description text not null default '' check (char_length(description) <= 300),
  max_projects integer not null check (max_projects >= 0),
  max_members integer not null check (max_members >= 1),
  position integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.plan_settings (plan, label, price_text, description, max_projects, max_members, position) values
  ('free', 'Free', 'Free', 'For trying things out.', 3, 1, 0),
  ('starter', 'Starter', 'Ask us', 'For one business, getting started.', 15, 3, 1),
  ('pro', 'Pro', 'Ask us', 'For growing teams.', 100, 10, 2),
  ('agency', 'Agency', 'Ask us', 'For agencies with many clients.', 500, 30, 3),
  ('enterprise', 'Enterprise', 'Ask us', 'For large organizations.', 99999, 999, 4);

-- No row means this module only counts toward the plan's overall limit.
create table public.plan_module_quotas (
  plan text not null references public.plan_settings (plan) on delete cascade,
  module text not null check (module in ('website', 'page', 'tour', 'form', 'demo', 'banner', 'menu', 'faq')),
  max_projects integer not null check (max_projects >= 0),
  primary key (plan, module)
);

revoke all on public.plan_settings, public.plan_module_quotas from anon, authenticated;
grant select on public.plan_settings, public.plan_module_quotas to authenticated;
alter table public.plan_settings enable row level security;
alter table public.plan_module_quotas enable row level security;
create policy plan_settings_select on public.plan_settings for select to authenticated using (true);
create policy plan_module_quotas_select on public.plan_module_quotas for select to authenticated using (true);

create or replace function public.plan_max_projects(plan text)
returns integer
language sql stable security definer set search_path = ''
as $$
  select coalesce((select s.max_projects from public.plan_settings s where s.plan = plan_max_projects.plan), 99999);
$$;

create or replace function public.plan_max_members(plan text)
returns integer
language sql stable security definer set search_path = ''
as $$
  select coalesce((select s.max_members from public.plan_settings s where s.plan = plan_max_members.plan), 999);
$$;

create or replace function public.enforce_project_limit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  org_plan text;
  quota integer;
begin
  -- Locks the workspace, so parallel inserts can't all pass the counts below.
  select plan into org_plan from public.organizations where id = new.organization_id for update;
  if (select count(*) from public.projects p where p.organization_id = new.organization_id)
    >= public.plan_max_projects(org_plan) then
    raise exception 'Your plan''s project limit has been reached' using errcode = 'P0001';
  end if;
  select q.max_projects into quota from public.plan_module_quotas q where q.plan = org_plan and q.module = new.type;
  if quota is not null
    and (select count(*) from public.projects p where p.organization_id = new.organization_id and p.type = new.type) >= quota then
    raise exception 'Your plan allows % of this kind of project. Upgrade your plan to add more.', quota using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Asking for a different plan. There's no online payment, so a super admin decides.
-- ---------------------------------------------------------------------------

create table public.plan_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plan text not null references public.plan_settings (plan),
  note text not null default '' check (char_length(note) <= 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  requested_by uuid default auth.uid() references public.user_profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index plan_requests_one_pending on public.plan_requests (organization_id) where status = 'pending';

revoke all on public.plan_requests from anon, authenticated;
grant select on public.plan_requests to authenticated;
grant insert (organization_id, plan, note) on public.plan_requests to authenticated;
alter table public.plan_requests enable row level security;
create policy plan_requests_select on public.plan_requests for select to authenticated
  using (public.is_org_member(organization_id));
create policy plan_requests_insert on public.plan_requests for insert to authenticated
  with check (public.has_org_role(organization_id, array['owner']));

-- ---------------------------------------------------------------------------
-- Nudges: messages from a super admin to a user.
-- ---------------------------------------------------------------------------

create table public.user_nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 1000),
  -- Shown as a link, so only addresses in this app or on https.
  link_url text check (link_url is null or link_url ~ '^(/[^/]|https://)'),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index user_nudges_user_idx on public.user_nudges (user_id, created_at desc);

revoke all on public.user_nudges from anon, authenticated;
grant select on public.user_nudges to authenticated;
grant update (read_at) on public.user_nudges to authenticated;
alter table public.user_nudges enable row level security;
create policy user_nudges_select on public.user_nudges for select to authenticated using (user_id = auth.uid());
create policy user_nudges_update on public.user_nudges for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Customer support
-- ---------------------------------------------------------------------------

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.user_profiles (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  subject text not null check (char_length(subject) between 1 and 200),
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index support_tickets_user_idx on public.support_tickets (user_id, updated_at desc);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_id uuid default auth.uid() references public.user_profiles (id) on delete set null,
  -- Set only by admin_reply_ticket, so nobody can pose as staff.
  is_staff boolean not null default false,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index support_messages_ticket_idx on public.support_messages (ticket_id, created_at);

revoke all on public.support_tickets, public.support_messages from anon, authenticated;
grant select on public.support_tickets, public.support_messages to authenticated;
grant insert (organization_id, subject) on public.support_tickets to authenticated;
grant insert (ticket_id, body) on public.support_messages to authenticated;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

create policy support_tickets_select on public.support_tickets for select to authenticated using (user_id = auth.uid());
create policy support_tickets_insert on public.support_tickets for insert to authenticated
  with check (user_id = auth.uid() and (organization_id is null or public.is_org_member(organization_id)));

create policy support_messages_select on public.support_messages for select to authenticated
  using (exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid()));
create policy support_messages_insert on public.support_messages for insert to authenticated
  with check (exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid() and t.status <> 'closed'));

create function public.support_message_touch_ticket()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.support_tickets
    set updated_at = now(), status = case when new.is_staff then 'answered' else 'open' end
    where id = new.ticket_id;
  return new;
end;
$$;

create trigger support_messages_touch_ticket
  after insert on public.support_messages
  for each row execute function public.support_message_touch_ticket();

-- ---------------------------------------------------------------------------
-- What a super admin can do. Every function checks for itself.
-- ---------------------------------------------------------------------------

create function public.admin_overview()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return jsonb_build_object(
    'users', (select count(*) from public.user_profiles),
    'workspaces', (select count(*) from public.organizations),
    'projects', (select count(*) from public.projects),
    'published', (select count(*) from public.projects where status = 'published'),
    'openTickets', (select count(*) from public.support_tickets where status = 'open'),
    'pendingRequests', (select count(*) from public.plan_requests where status = 'pending'),
    'byModule', coalesce((select jsonb_object_agg(type, total) from (select type, count(*) as total from public.projects group by type) m), '{}'::jsonb),
    'byPlan', coalesce((select jsonb_object_agg(plan, total) from (select plan, count(*) as total from public.organizations group by plan) m), '{}'::jsonb)
  );
end;
$$;

create function public.admin_list_users()
returns table (
  user_id uuid, email text, full_name text, created_at timestamptz, last_active_at timestamptz,
  workspace_id uuid, workspace_name text, plan text, project_count bigint
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return query
    select u.id, u.email::text, u.full_name::text, u.created_at, u.last_active_at, o.id, o.name::text, o.plan::text,
      (select count(*) from public.projects p where p.organization_id = o.id)
    from public.user_profiles u
    left join lateral (
      select org.id, org.name, org.plan from public.organization_members m
      join public.organizations org on org.id = m.organization_id
      where m.user_id = u.id
      order by (m.role = 'owner') desc, m.created_at
      limit 1
    ) o on true
    order by u.created_at desc;
end;
$$;

create function public.admin_set_workspace_plan(p_org uuid, p_plan text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  if not exists (select 1 from public.plan_settings s where s.plan = p_plan) then
    raise exception 'Unknown plan';
  end if;
  update public.organizations set plan = p_plan where id = p_org;
end;
$$;

create function public.admin_update_plan(p_plan text, p_label text, p_price text, p_description text, p_max_projects integer, p_max_members integer)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  update public.plan_settings
    set label = p_label, price_text = p_price, description = p_description, max_projects = p_max_projects, max_members = p_max_members, updated_at = now()
    where plan = p_plan;
end;
$$;

-- A null quota removes the limit for that module.
create function public.admin_set_module_quota(p_plan text, p_module text, p_max integer)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  if p_max is null then
    delete from public.plan_module_quotas where plan = p_plan and module = p_module;
  else
    insert into public.plan_module_quotas (plan, module, max_projects) values (p_plan, p_module, p_max)
      on conflict (plan, module) do update set max_projects = excluded.max_projects;
  end if;
end;
$$;

-- A null user means everyone. Returns how many people it reached.
create function public.admin_send_nudge(p_user uuid, p_title text, p_body text, p_link text)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  sent integer;
begin
  perform public.require_platform_admin();
  insert into public.user_nudges (user_id, title, body, link_url)
    select u.id, p_title, coalesce(p_body, ''), nullif(p_link, '')
    from public.user_profiles u
    where p_user is null or u.id = p_user;
  get diagnostics sent = row_count;
  return sent;
end;
$$;

create function public.admin_list_plan_requests()
returns table (id uuid, organization_id uuid, workspace_name text, plan text, current_plan text, note text, status text, created_at timestamptz, requested_by_email text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return query
    select r.id, r.organization_id, o.name::text, r.plan, o.plan::text, r.note, r.status, r.created_at, u.email::text
    from public.plan_requests r
    join public.organizations o on o.id = r.organization_id
    left join public.user_profiles u on u.id = r.requested_by
    order by (r.status = 'pending') desc, r.created_at desc;
end;
$$;

create function public.admin_resolve_plan_request(p_request uuid, p_approve boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  request public.plan_requests;
begin
  perform public.require_platform_admin();
  select * into request from public.plan_requests r where r.id = p_request and r.status = 'pending' for update;
  if not found then
    raise exception 'This request has already been handled';
  end if;
  update public.plan_requests set status = case when p_approve then 'approved' else 'declined' end where id = p_request;
  if p_approve then
    update public.organizations set plan = request.plan where id = request.organization_id;
  end if;
end;
$$;

create function public.admin_list_tickets()
returns table (id uuid, subject text, status text, created_at timestamptz, updated_at timestamptz, user_email text, user_name text, workspace_name text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return query
    select t.id, t.subject, t.status, t.created_at, t.updated_at, u.email::text, u.full_name::text, o.name::text
    from public.support_tickets t
    join public.user_profiles u on u.id = t.user_id
    left join public.organizations o on o.id = t.organization_id
    order by (t.status = 'open') desc, t.updated_at desc;
end;
$$;

create function public.admin_ticket_messages(p_ticket uuid)
returns table (id uuid, is_staff boolean, body text, created_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  return query
    select m.id, m.is_staff, m.body, m.created_at from public.support_messages m where m.ticket_id = p_ticket order by m.created_at;
end;
$$;

create function public.admin_reply_ticket(p_ticket uuid, p_body text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  insert into public.support_messages (ticket_id, author_id, is_staff, body) values (p_ticket, auth.uid(), true, p_body);
end;
$$;

create function public.admin_set_ticket_status(p_ticket uuid, p_status text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.require_platform_admin();
  update public.support_tickets set status = p_status, updated_at = now() where id = p_ticket;
end;
$$;

revoke execute on function public.touch_last_active() from public, anon, authenticated;
revoke execute on function public.is_platform_admin() from public, anon, authenticated;
revoke execute on function public.require_platform_admin() from public, anon, authenticated;
revoke execute on function public.plan_max_projects(text) from public, anon, authenticated;
revoke execute on function public.plan_max_members(text) from public, anon, authenticated;
revoke execute on function public.enforce_project_limit() from public, anon, authenticated;
revoke execute on function public.support_message_touch_ticket() from public, anon, authenticated;
revoke execute on function public.admin_overview() from public, anon, authenticated;
revoke execute on function public.admin_list_users() from public, anon, authenticated;
revoke execute on function public.admin_set_workspace_plan(uuid, text) from public, anon, authenticated;
revoke execute on function public.admin_update_plan(text, text, text, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.admin_set_module_quota(text, text, integer) from public, anon, authenticated;
revoke execute on function public.admin_send_nudge(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.admin_list_plan_requests() from public, anon, authenticated;
revoke execute on function public.admin_resolve_plan_request(uuid, boolean) from public, anon, authenticated;
revoke execute on function public.admin_list_tickets() from public, anon, authenticated;
revoke execute on function public.admin_ticket_messages(uuid) from public, anon, authenticated;
revoke execute on function public.admin_reply_ticket(uuid, text) from public, anon, authenticated;
revoke execute on function public.admin_set_ticket_status(uuid, text) from public, anon, authenticated;

grant execute on function public.touch_last_active() to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_workspace_plan(uuid, text) to authenticated;
grant execute on function public.admin_update_plan(text, text, text, text, integer, integer) to authenticated;
grant execute on function public.admin_set_module_quota(text, text, integer) to authenticated;
grant execute on function public.admin_send_nudge(uuid, text, text, text) to authenticated;
grant execute on function public.admin_list_plan_requests() to authenticated;
grant execute on function public.admin_resolve_plan_request(uuid, boolean) to authenticated;
grant execute on function public.admin_list_tickets() to authenticated;
grant execute on function public.admin_ticket_messages(uuid) to authenticated;
grant execute on function public.admin_reply_ticket(uuid, text) to authenticated;
grant execute on function public.admin_set_ticket_status(uuid, text) to authenticated;
