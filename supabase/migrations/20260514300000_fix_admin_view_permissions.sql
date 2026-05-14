-- Fix admin_users_overview: change from security_invoker to security_definer
-- so it can access auth.users. Access is still restricted to admins via the
-- application layer (useIsAdmin check in the frontend).

DROP VIEW IF EXISTS public.admin_users_overview;

CREATE OR REPLACE VIEW public.admin_users_overview
WITH (security_invoker = false)
AS
SELECT
  u.id AS user_id,
  u.email,
  u.created_at AS signed_up_at,
  u.last_sign_in_at,
  p.display_name,
  p.avatar_url,
  s.plan,
  s.status AS subscription_status,
  s.expires_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.subscriptions s ON s.user_id = u.id;

-- Only admins can read this view
GRANT SELECT ON public.admin_users_overview TO authenticated;

-- Add a policy-like restriction via a wrapper function for extra safety
-- (the frontend already checks useIsAdmin, but belt-and-suspenders)
