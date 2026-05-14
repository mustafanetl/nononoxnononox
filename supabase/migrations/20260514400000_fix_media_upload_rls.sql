-- Fix media upload RLS: add missing storage policies and explicit table policies.

-- Storage: add UPDATE policy (Supabase storage internally does upserts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Admins can update destination media files'
  ) THEN
    CREATE POLICY "Admins can update destination media files"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'destination-media' AND public.has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (bucket_id = 'destination-media' AND public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Storage: add INSERT policy (was missing — caused "new row violates RLS" on upload)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Admins can upload destination media'
  ) THEN
    CREATE POLICY "Admins can upload destination media"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'destination-media' AND public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Storage: add DELETE policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Admins can delete destination media'
  ) THEN
    CREATE POLICY "Admins can delete destination media"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'destination-media' AND public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Storage: public read for destination-media bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Public read destination media files'
  ) THEN
    CREATE POLICY "Public read destination media files"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'destination-media');
  END IF;
END $$;

-- Table: explicit INSERT policy for destination_media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'destination_media'
    AND policyname = 'Admins can insert destination media'
  ) THEN
    CREATE POLICY "Admins can insert destination media"
      ON public.destination_media FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Table: explicit UPDATE policy for destination_media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'destination_media'
    AND policyname = 'Admins can update destination media'
  ) THEN
    CREATE POLICY "Admins can update destination media"
      ON public.destination_media FOR UPDATE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Table: explicit DELETE policy for destination_media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'destination_media'
    AND policyname = 'Admins can delete destination media'
  ) THEN
    CREATE POLICY "Admins can delete destination media"
      ON public.destination_media FOR DELETE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Ensure admin role is set
INSERT INTO public.user_roles (user_id, role)
SELECT 'd74f4838-c2f5-4c71-8794-d08e634d14ca', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = 'd74f4838-c2f5-4c71-8794-d08e634d14ca' AND role = 'admin'
);
