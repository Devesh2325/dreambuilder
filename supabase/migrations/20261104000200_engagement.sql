-- Visitor data (form answers, checklist progress, analytics), invitations and plan limits.
--
-- Visitors have no login, so they only write through functions that require the
-- project to be published and limit what can be stored.

create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  organization_id uuid not null,
  data jsonb not null,
  visitor_id text,
  -- Salted per project so it can't identify a visitor across projects. Used for rate limiting.
  source_hash text,
  created_at timestamptz not null default now(),
  foreign key (project_id, organization_id)
    references public.projects (id, organization_id) on delete cascade
);
create index form_submissions_project_idx on public.form_submissions (project_id, created_at desc);
create index form_submissions_org_idx on public.form_submissions (organization_id);
create index form_submissions_rate_idx on public.form_submissions (project_id, source_hash, created_at desc);

create table public.checklist_progress (
  project_id uuid not null references public.projects (id) on delete cascade,
  visitor_id text not null,
  completed jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (project_id, visitor_id)
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  organization_id uuid not null,
  event_type text not null,
  visitor_id text,
  session_id text,
  device text,
  url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (project_id, organization_id)
    references public.projects (id, organization_id) on delete cascade
);
create index analytics_events_org_idx on public.analytics_events (organization_id, created_at desc);
create index analytics_events_project_idx on public.analytics_events (project_id, created_at desc);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  -- Only a hash is stored: a database leak must not reveal working invite links.
  token_hash text not null unique,
  invited_by uuid references public.user_profiles (id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index invitations_org_idx on public.invitations (organization_id);

revoke all on public.form_submissions, public.checklist_progress, public.analytics_events, public.invitations
  from anon, authenticated;

alter table public.form_submissions enable row level security;
alter table public.checklist_progress enable row level security;
alter table public.analytics_events enable row level security;
alter table public.invitations enable row level security;

grant select, delete on public.form_submissions to authenticated;
grant select on public.analytics_events to authenticated;
grant select (id, organization_id, email, role, expires_at, accepted_at, created_at) on public.invitations to authenticated;
grant delete on public.invitations to authenticated;
-- checklist_progress has no client access: only the functions below touch it.

create policy form_submissions_select on public.form_submissions for select to authenticated
  using (public.is_org_member(organization_id));
create policy form_submissions_delete on public.form_submissions for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin', 'editor']));
create policy analytics_events_select on public.analytics_events for select to authenticated
  using (public.is_org_member(organization_id));
create policy invitations_select on public.invitations for select to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']));
create policy invitations_delete on public.invitations for delete to authenticated
  using (public.has_org_role(organization_id, array['owner', 'admin']));

-- ---------------------------------------------------------------------------
-- Visitor functions
-- ---------------------------------------------------------------------------

create function public.published_project_org(p_project uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select organization_id from public.projects where id = p_project and status = 'published';
$$;

create function public.request_source(p_project uuid, p_visitor text)
returns text
language plpgsql stable security definer set search_path = ''
as $$
declare
  headers json;
  source text;
begin
  begin
    headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    headers := null;
  end;
  -- cf-connecting-ip is set by Supabase's proxy. The first x-forwarded-for entry
  -- can be faked by the client, so it is only a fallback.
  source := coalesce(
    headers ->> 'cf-connecting-ip',
    nullif(split_part(headers ->> 'x-forwarded-for', ',', 1), ''),
    p_visitor,
    'unknown'
  );
  return encode(sha256(convert_to(p_project::text || ':' || source, 'UTF8')), 'hex');
end;
$$;

create function public.submit_form(p_project uuid, p_data jsonb, p_visitor text default null)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  org uuid := public.published_project_org(p_project);
  source text;
begin
  if org is null then
    raise exception 'This form is not available' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_data) <> 'object' or pg_column_size(p_data) > 65536 then
    raise exception 'Invalid form data' using errcode = 'P0001';
  end if;
  -- Report success to bots that filled the hidden field, so they don't adapt.
  if coalesce(p_data ->> '_hp', '') <> '' then
    return true;
  end if;

  source := public.request_source(p_project, p_visitor);
  if (
    select count(*) from public.form_submissions s
    where s.project_id = p_project
      and s.source_hash = source
      and s.created_at > now() - interval '1 minute'
  ) >= 10 then
    raise exception 'Too many submissions. Please wait a minute and try again.' using errcode = 'P0001';
  end if;

  insert into public.form_submissions (project_id, organization_id, data, visitor_id, source_hash)
  values (p_project, org, p_data - '_hp', left(p_visitor, 64), source);
  return true;
end;
$$;

create function public.get_checklist_progress(p_project uuid, p_visitor text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (
      select c.completed from public.checklist_progress c
      join public.projects p on p.id = c.project_id and p.status = 'published'
      where c.project_id = p_project and c.visitor_id = p_visitor
    ),
    '[]'::jsonb
  );
$$;

create function public.save_checklist_progress(p_project uuid, p_visitor text, p_completed jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if public.published_project_org(p_project) is null then
    raise exception 'This checklist is not available' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_completed) <> 'array' or pg_column_size(p_completed) > 16384
    or coalesce(char_length(p_visitor), 0) not between 8 and 64 then
    raise exception 'Invalid checklist data' using errcode = 'P0001';
  end if;
  insert into public.checklist_progress (project_id, visitor_id, completed)
  values (p_project, p_visitor, p_completed)
  on conflict (project_id, visitor_id)
  do update set completed = excluded.completed, updated_at = now();
end;
$$;

create function public.track_events(p_project uuid, p_events jsonb)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  org uuid := public.published_project_org(p_project);
  inserted integer;
begin
  if org is null then
    return 0;
  end if;
  if jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 50 or pg_column_size(p_events) > 65536 then
    raise exception 'Invalid analytics batch' using errcode = 'P0001';
  end if;

  insert into public.analytics_events (
    project_id, organization_id, event_type, visitor_id, session_id, device, url, metadata
  )
  select
    p_project,
    org,
    e ->> 'type',
    left(e ->> 'visitorId', 64),
    left(e ->> 'sessionId', 64),
    left(e ->> 'device', 16),
    left(e ->> 'url', 2000),
    case when jsonb_typeof(e -> 'metadata') = 'object' then e -> 'metadata' else '{}'::jsonb end
  from jsonb_array_elements(p_events) as e
  where e ->> 'type' ~ '^[a-z][a-z0-9_]{0,63}$';

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

-- Runs as the caller, so RLS limits it to workspaces they belong to.
create function public.analytics_summary(p_org uuid, p_days integer default 30)
returns table (project_id uuid, event_type text, day date, events bigint, visitors bigint)
language sql stable security invoker set search_path = ''
as $$
  select
    e.project_id,
    e.event_type,
    (e.created_at at time zone 'utc')::date,
    count(*),
    count(distinct e.visitor_id)
  from public.analytics_events e
  where e.organization_id = p_org
    and e.created_at > now() - make_interval(days => least(greatest(p_days, 1), 365))
  group by 1, 2, 3;
$$;

-- ---------------------------------------------------------------------------
-- Form webhooks. Sent by the pg_net extension when it is enabled. A delivery
-- problem must never lose the submission, so errors are swallowed.
-- ---------------------------------------------------------------------------

create function public.deliver_form_webhook()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  url text;
begin
  select p.settings ->> 'webhookUrl' into url from public.projects p where p.id = new.project_id;
  if url is null or url !~ '^https://' or to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') is null then
    return new;
  end if;
  begin
    execute 'select net.http_post($1, $2, ''{}''::jsonb, $3, 5000)'
    using
      url,
      jsonb_build_object(
        'event', 'form.submitted',
        'projectId', new.project_id,
        'submissionId', new.id,
        'createdAt', new.created_at,
        'data', new.data
      ),
      '{"Content-Type": "application/json"}'::jsonb;
  exception when others then
    raise warning 'Form webhook failed: %', sqlerrm;
  end;
  return new;
end;
$$;

create trigger form_submissions_webhook
  after insert on public.form_submissions
  for each row execute function public.deliver_form_webhook();

-- ---------------------------------------------------------------------------
-- Plan limits. Keep in step with PLAN_LIMITS in src/types/auth.ts.
-- ---------------------------------------------------------------------------

create function public.plan_max_projects(plan text)
returns integer
language sql immutable set search_path = ''
as $$
  select case plan
    when 'free' then 3 when 'starter' then 15 when 'pro' then 100
    when 'agency' then 500 else 99999
  end;
$$;

create function public.plan_max_members(plan text)
returns integer
language sql immutable set search_path = ''
as $$
  select case plan
    when 'free' then 1 when 'starter' then 3 when 'pro' then 10
    when 'agency' then 30 else 999
  end;
$$;

create function public.enforce_project_limit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  org_plan text;
begin
  -- Locks the workspace, so parallel inserts can't all pass the count below.
  select plan into org_plan from public.organizations where id = new.organization_id for update;
  if (select count(*) from public.projects p where p.organization_id = new.organization_id)
    >= public.plan_max_projects(org_plan) then
    raise exception 'Your plan''s project limit has been reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger projects_enforce_limit
  before insert on public.projects
  for each row execute function public.enforce_project_limit();

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------

create function public.invitation_token_hash(token text)
returns text
language sql immutable set search_path = ''
as $$
  select encode(sha256(convert_to(token, 'UTF8')), 'hex');
$$;

-- Returns the secret token once. The app builds the invite link from it.
create function public.create_invitation(p_org uuid, p_email text, p_role text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  org_plan text;
  taken integer;
  token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  clean_email text := lower(btrim(p_email));
begin
  if not public.has_org_role(p_org, array['owner', 'admin']) then
    raise exception 'Not allowed to invite to this workspace' using errcode = '42501';
  end if;
  if p_role = 'owner' and not public.has_org_role(p_org, array['owner']) then
    raise exception 'Only owners can invite an owner' using errcode = '42501';
  end if;
  if clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address' using errcode = 'P0001';
  end if;

  select plan into org_plan from public.organizations where id = p_org for update;
  select
    (select count(*) from public.organization_members m where m.organization_id = p_org)
    + (select count(*) from public.invitations i
       where i.organization_id = p_org and i.accepted_at is null and i.expires_at > now())
  into taken;
  if taken >= public.plan_max_members(org_plan) then
    raise exception 'Your plan''s team member limit has been reached' using errcode = 'P0001';
  end if;

  insert into public.invitations (organization_id, email, role, token_hash, invited_by)
  values (p_org, clean_email, p_role, public.invitation_token_hash(token), auth.uid());
  return token;
end;
$$;

-- Requires the logged-in email to match, so a forwarded link is useless to others.
create function public.accept_invitation(p_token text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  invite public.invitations;
  my_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select * into invite from public.invitations
  where token_hash = public.invitation_token_hash(p_token)
  for update;

  select lower(email) into my_email from public.user_profiles where id = auth.uid();
  if not found or invite.id is null or invite.accepted_at is not null or invite.expires_at <= now()
    or invite.email <> my_email then
    raise exception 'This invitation is invalid or has expired' using errcode = 'P0001';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (invite.organization_id, auth.uid(), invite.role)
  on conflict (organization_id, user_id) do nothing;

  update public.invitations set accepted_at = now() where id = invite.id;
  return invite.organization_id;
end;
$$;

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.has_org_role(uuid, text[]) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.shares_org_with(uuid) to authenticated;
grant execute on function public.storage_path_org(text) to authenticated;
grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.create_project_with_documents(
  uuid, text, text, text, jsonb, jsonb, jsonb, text, integer, jsonb
) to authenticated;
grant execute on function public.publish_project(uuid, text, text) to authenticated;
grant execute on function public.unpublish_project(uuid) to authenticated;
grant execute on function public.restore_project_version(uuid) to authenticated;
grant execute on function public.analytics_summary(uuid, integer) to authenticated;
grant execute on function public.create_invitation(uuid, text, text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;

grant execute on function public.get_published_site(text) to anon, authenticated;
grant execute on function public.get_published_experience(uuid) to anon, authenticated;
grant execute on function public.submit_form(uuid, jsonb, text) to anon, authenticated;
grant execute on function public.get_checklist_progress(uuid, text) to anon, authenticated;
grant execute on function public.save_checklist_progress(uuid, text, jsonb) to anon, authenticated;
grant execute on function public.track_events(uuid, jsonb) to anon, authenticated;
