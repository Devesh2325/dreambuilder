-- The address someone builds their tour on, and the editor's list of variables, are for
-- the team only. Anyone can read a published snapshot, so they stay out of it.

create or replace function public.public_snapshot(version_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select v.snapshot
    #- '{project,settings,webhookUrl}'
    #- '{project,settings,builderUrl}'
    #- '{project,settings,variableDefs}'
  from public.project_versions v
  where v.id = version_id;
$$;

revoke execute on function public.public_snapshot(uuid) from public, anon, authenticated;
