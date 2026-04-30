-- Confirm emails for two test users and grant them annual premium
UPDATE auth.users
   SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
       confirmed_at       = COALESCE(confirmed_at, now())
 WHERE email IN ('mustafa@gmail.com', 'arzu@gmail.com');

INSERT INTO public.subscriptions (user_id, plan, status, started_at, expires_at)
SELECT u.id, 'annual', 'active', now(), now() + interval '1 year'
  FROM auth.users u
 WHERE u.email IN ('mustafa@gmail.com', 'arzu@gmail.com')
ON CONFLICT DO NOTHING;
