-- Merge "amsterdam netherlands" into "amsterdam"
UPDATE public.destination_media SET destination = 'amsterdam' WHERE destination = 'amsterdam netherlands';

-- Merge "copenhagen denmark" into "copenhagen"
UPDATE public.destination_media SET destination = 'copenhagen' WHERE destination = 'copenhagen denmark';

-- Merge Amsterdam neighborhoods into "amsterdam"
UPDATE public.destination_media SET destination = 'amsterdam' WHERE destination IN ('centrum', 'dam square', 'herengracht', 'herengracht grachtengordel', 'jordaan', 'jordan');

-- Delete garbage entries
DELETE FROM public.destination_media WHERE destination IN ('24', 'test this one');
