-- Allow anonymous users to create share links (no login required)
-- The owner_user_id stays NULL for anonymous shares; the share is still publicly readable.

ALTER TABLE public.shared_trips ALTER COLUMN owner_user_id DROP NOT NULL;

DROP POLICY IF EXISTS "Users can create their own shared trips" ON public.shared_trips;
DROP POLICY IF EXISTS "Anonymous can create shared trips" ON public.shared_trips;

CREATE POLICY "Anonymous can create shared trips"
  ON public.shared_trips FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Authenticated users must own their shares (existing rule preserved)
    (auth.uid() IS NOT NULL AND auth.uid() = owner_user_id)
    OR
    -- Anonymous users can create shares with no owner
    (auth.uid() IS NULL AND owner_user_id IS NULL)
  );
