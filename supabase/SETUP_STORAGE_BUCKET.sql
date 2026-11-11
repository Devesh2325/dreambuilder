-- ==============================================================================
-- FlowPilot: Create 'assets' Storage Bucket & Permissions
-- ==============================================================================

-- 1. Create the 'assets' bucket if not already present
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assets',
  'assets',
  true,
  52428800, -- 50 MB limit
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm']
)
on conflict (id) do update
set public = true;

-- 2. Storage policies (safe on hosted Supabase SQL Editor where RLS is already enabled on storage.objects)
do $$
begin
  drop policy if exists "Assets are publicly viewable" on storage.objects;
  create policy "Assets are publicly viewable"
    on storage.objects for select
    using (bucket_id = 'assets');

  drop policy if exists "Authenticated users can upload assets" on storage.objects;
  create policy "Authenticated users can upload assets"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'assets');

  drop policy if exists "Authenticated users can delete assets" on storage.objects;
  create policy "Authenticated users can delete assets"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'assets');
exception
  when insufficient_privilege then
    raise notice 'Skipped storage.objects policy setup (insufficient privilege). Manage storage policies in Dashboard -> Storage -> Policies if needed.';
end;
$$;

