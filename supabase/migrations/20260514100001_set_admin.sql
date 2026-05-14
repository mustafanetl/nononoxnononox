-- Set mustafa aldelemey as admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('d74f4838-c2f5-4c71-8794-d08e634d14ca', 'admin')
ON CONFLICT DO NOTHING;
