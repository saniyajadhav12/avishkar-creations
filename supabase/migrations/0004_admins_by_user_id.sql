-- Link admins to auth user IDs instead of emails, so changing a login email keeps admin access.
--
-- Fresh project: create the admin accounts first (Authentication → Users → Add user,
-- with "Auto Confirm User"), then add each one with:
--   insert into public.admins (user_id)
--   select id from auth.users where email = '<admin email>';

alter table public.admins
  add column user_id uuid references auth.users (id) on delete cascade;

-- Match existing allowlist emails to their accounts
update public.admins a
set user_id = u.id
from auth.users u
where lower(u.email) = a.email;

-- Entries without an account could never log in anyway
delete from public.admins where user_id is null;

alter table public.admins drop constraint admins_pkey;
alter table public.admins alter column user_id set not null;
alter table public.admins add primary key (user_id);
alter table public.admins drop column email;

-- Same function name and signature, so every existing RLS policy keeps working unchanged
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = (select auth.uid())
  );
$$;
