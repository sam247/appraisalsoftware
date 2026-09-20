-- Profile avatar: avatar_url column + user-scoped storage (250 KB).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars',
  'profile-avatars',
  true,
  256000,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS profile_avatars_select ON storage.objects;
DROP POLICY IF EXISTS profile_avatars_insert ON storage.objects;
DROP POLICY IF EXISTS profile_avatars_update ON storage.objects;
DROP POLICY IF EXISTS profile_avatars_delete ON storage.objects;

-- Public read so avatars render in the app shell without signed URLs.
CREATE POLICY profile_avatars_select ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'profile-avatars');

-- Path must be {auth.uid()}/…
CREATE POLICY profile_avatars_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY profile_avatars_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY profile_avatars_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
