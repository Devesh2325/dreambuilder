-- ============================================================================
-- Fix for get_published_site and Publishing RPCs in Supabase
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/iusczcmtywvpzjbisgba/sql
-- ============================================================================

-- 1. Ensure project_versions table exists
create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  published_by uuid references auth.users (id) on delete set null,
  change_summary text,
  created_at timestamptz not null default now(),
  unique (project_id, version_number)
);

create index if not exists project_versions_project_idx
  on public.project_versions (project_id, version_number desc);

alter table public.project_versions enable row level security;

-- Only members can see project versions
drop policy if exists "Members can read project versions" on public.project_versions;
create policy "Members can read project versions"
  on public.project_versions for select
  using (public.has_org_role(organization_id, array['owner', 'admin', 'editor', 'viewer']));

-- 2. Function to extract public snapshot
create or replace function public.public_snapshot(version_id uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select v.snapshot #- '{project,settings,webhookUrl}'
  from public.project_versions v
  where v.id = version_id;
$$;

-- 3. Public site lookup by slug
create or replace function public.get_published_site(p_slug text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select public.public_snapshot(p.published_version_id)
  from public.projects p
  where p.slug = p_slug and p.status = 'published';
$$;

-- 4. Public experience lookup by project ID
create or replace function public.get_published_experience(p_project uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select public.public_snapshot(p.published_version_id)
  from public.projects p
  where p.id = p_project and p.status = 'published';
$$;

-- 5. Public site lookup by custom domain
create or replace function public.get_published_site_by_domain(p_domain text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select public.public_snapshot(p.published_version_id)
  from public.domains d
  join public.projects p on p.id = d.project_id
  where d.domain = lower(trim(p_domain))
    and d.verified_at is not null
    and p.status = 'published';
$$;

-- 6. Slugify utility
create or replace function public.slugify(text)
returns text
language sql immutable set search_path = ''
as $$
  select trim(both '-' from regexp_replace(lower($1), '[^a-z0-9]+', '-', 'g'));
$$;

-- 7. Publish project RPC
create or replace function public.publish_project(
  p_project uuid,
  p_summary text default null,
  p_slug text default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  project public.projects;
  next_version integer;
  version_id uuid;
  final_slug text;
  page_count integer;
begin
  select * into project from public.projects where id = p_project for update;
  if not found or not public.has_org_role(project.organization_id, array['owner', 'admin', 'editor']) then
    raise exception 'Project not found or not allowed' using errcode = '42501';
  end if;

  select count(*) into page_count from public.documents where project_id = p_project;
  if page_count = 0 then
    raise exception 'Project has nothing to publish' using errcode = 'P0001';
  end if;

  final_slug := coalesce(
    nullif(p_slug, ''),
    project.slug,
    coalesce(nullif(public.slugify(project.title), ''), 'site') || '-' || left(replace(project.id::text, '-', ''), 6)
  );

  select coalesce(max(version_number), 0) + 1 into next_version
  from public.project_versions where project_id = p_project;

  insert into public.project_versions (
    project_id, organization_id, version_number, snapshot, published_by, change_summary
  )
  values (
    p_project,
    project.organization_id,
    next_version,
    jsonb_build_object(
      'project', jsonb_build_object(
        'id', project.id,
        'type', project.type,
        'title', project.title,
        'slug', final_slug,
        'variables', project.variables,
        'theme', project.theme,
        'settings', project.settings
      ),
      'documents', (
        select jsonb_agg(
          jsonb_build_object(
            'id', d.id, 'kind', d.kind, 'title', d.title, 'slug', d.slug,
            'position', d.position, 'seo', d.seo, 'content', d.content,
            'schemaVersion', d.schema_version
          )
          order by d.position
        )
        from public.documents d where d.project_id = p_project
      )
    ),
    auth.uid(),
    left(p_summary, 500)
  )
  returning id into version_id;

  update public.projects
  set status = 'published', published_version_id = version_id, slug = final_slug
  where id = p_project;

  return version_id;
end;
$$;

-- 8. Unpublish project RPC
create or replace function public.unpublish_project(p_project uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  org uuid;
begin
  select organization_id into org from public.projects where id = p_project;
  if org is null or not public.has_org_role(org, array['owner', 'admin', 'editor']) then
    raise exception 'Project not found or not allowed' using errcode = '42501';
  end if;
  update public.projects set status = 'draft', published_version_id = null where id = p_project;
end;
$$;

-- 9. Permissions
grant execute on function public.public_snapshot(uuid) to anon, authenticated;
grant execute on function public.get_published_site(text) to anon, authenticated;
grant execute on function public.get_published_experience(uuid) to anon, authenticated;
grant execute on function public.get_published_site_by_domain(text) to anon, authenticated;
grant execute on function public.publish_project(uuid, text, text) to authenticated;
grant execute on function public.unpublish_project(uuid) to authenticated;

-- 10. Reload PostgREST schema cache immediately
notify pgrst, 'reload schema';
