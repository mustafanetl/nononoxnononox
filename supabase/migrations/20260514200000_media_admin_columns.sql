-- Add columns for admin media management: source tracking, media type, sort order.
-- These enable the admin panel to upload/manage media that is never overwritten by Google Places.

-- source: tracks origin of the media ('google_places' or 'admin')
-- The existing 'source' column uses values like 'google_places', 'admin_override', 'manual'.
-- We'll standardize: 'admin' means admin-uploaded (permanent), 'google_places' means auto-fetched.
-- Update existing admin_override/manual entries to 'admin'.
DO $$
BEGIN
  -- source column already exists from the original migration, just update values
  UPDATE public.destination_media SET source = 'admin' WHERE source IN ('admin_override', 'manual');
EXCEPTION WHEN undefined_column THEN
  ALTER TABLE public.destination_media ADD COLUMN source TEXT NOT NULL DEFAULT 'google_places';
END $$;

-- media_type: 'photo' or 'video'
ALTER TABLE public.destination_media ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'photo';

-- sort_order: for admin reordering
ALTER TABLE public.destination_media ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Index for sort order queries
CREATE INDEX IF NOT EXISTS destination_media_sort_idx ON public.destination_media (destination, name, sort_order);

-- Create storage bucket for admin media uploads (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('destination-media', 'destination-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can read, admins can upload
CREATE POLICY "Public read destination media files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'destination-media');

CREATE POLICY "Admins can upload destination media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'destination-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete destination media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'destination-media' AND public.has_role(auth.uid(), 'admin'));
