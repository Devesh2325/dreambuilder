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

-- 2. Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- 3. Public access policy to view uploaded assets
drop policy if exists "Assets are publicly viewable" on storage.objects;
create policy "Assets are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'assets');

-- 4. Authenticated users can upload assets to the bucket
drop policy if exists "Authenticated users can upload assets" on storage.objects;
create policy "Authenticated users can upload assets"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'assets');

-- 5. Authenticated users can delete assets
drop policy if exists "Authenticated users can delete assets" on storage.objects;
create policy "Authenticated users can delete assets"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'assets');

