-- Publishing: immutable versions, rollback, and the public read functions.

alter table public.projects
  add constraint projects_published_version_fk
  foreign key (published_version_id) references public.project_versions (id) on delete set null;

create function public.slugify(input text)
returns text
language sql immutable set search_path = ''
as $$
  select btrim(left(btrim(regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'), '-'), 50), '-');
$$;

-- Stores a full copy of the project and marks it live. Later edits to the drafts
-- don't affect the live version until the next publish.
create function public.publish_project(
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
  -- Locks the row, so two simultaneous publishes can't take the same version number.
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

create function public.unpublish_project(p_project uuid)
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

-- Replaces the drafts with a saved version. What is live doesn't change until the
-- user publishes again, which lets them check the result first.
create function public.restore_project_version(p_version uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  version public.project_versions;
begin
  select * into version from public.project_versions where id = p_version;
  if not found or not public.has_org_role(version.organization_id, array['owner', 'admin', 'editor']) then
    raise exception 'Version not found or not allowed' using errcode = '42501';
  end if;

  update public.projects
  set
    title = version.snapshot -> 'project' ->> 'title',
    variables = version.snapshot -> 'project' -> 'variables',
    theme = version.snapshot -> 'project' -> 'theme',
    settings = version.snapshot -> 'project' -> 'settings'
  where id = version.project_id;

  delete from public.documents where project_id = version.project_id;

  insert into public.documents (
    id, project_id, organization_id, kind, title, slug, position, seo, content, schema_version
  )
  select
    (d ->> 'id')::uuid,
    version.project_id,
    version.organization_id,
    d ->> 'kind',
    d ->> 'title',
    d ->> 'slug',
    (d ->> 'position')::integer,
    d -> 'seo',
    d -> 'content',
    (d ->> 'schemaVersion')::integer
  from jsonb_array_elements(version.snapshot -> 'documents') as d;
end;
$$;

-- Snapshot as visitors may see it. Webhook addresses are private.
create function public.public_snapshot(version_id uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select v.snapshot #- '{project,settings,webhookUrl}'
  from public.project_versions v
  where v.id = version_id;
$$;

-- Only ever returns published versions, never drafts.
create function public.get_published_site(p_slug text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select public.public_snapshot(p.published_version_id)
  from public.projects p
  where p.slug = p_slug and p.status = 'published';
$$;

create function public.get_published_experience(p_project uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select public.public_snapshot(p.published_version_id)
  from public.projects p
  where p.id = p_project and p.status = 'published';
$$;

revoke execute on function public.slugify(text) from public, anon, authenticated;
revoke execute on function public.publish_project(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.unpublish_project(uuid) from public, anon, authenticated;
revoke execute on function public.restore_project_version(uuid) from public, anon, authenticated;
revoke execute on function public.public_snapshot(uuid) from public, anon, authenticated;
revoke execute on function public.get_published_site(text) from public, anon, authenticated;
revoke execute on function public.get_published_experience(uuid) from public, anon, authenticated;

grant execute on function public.publish_project(uuid, text, text) to authenticated;
grant execute on function public.unpublish_project(uuid) to authenticated;
grant execute on function public.restore_project_version(uuid) to authenticated;
grant execute on function public.get_published_site(text) to anon, authenticated;
grant execute on function public.get_published_experience(uuid) to anon, authenticated;
