-- Apply to an existing UNHIMAS schema after taking a database backup.
-- This migration does not drop tables, data, or existing business objects.

-- Stop instead of silently disabling access if more than one admin already exists.
do $$
begin
  if (select count(*) from public.profiles where role = 'admin') > 1 then
    raise exception 'More than one administrator profile exists. Resolve this manually before applying the single-admin migration.';
  end if;
end;
$$;

-- Enforce the requested single-admin rule.
create unique index if not exists profiles_single_admin_idx
  on public.profiles ((role))
  where role = 'admin';

-- A user cannot insert their own profile with a client-supplied role.
-- Auth profile creation remains handled by the existing SECURITY DEFINER auth trigger.
drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles
for insert to authenticated with check (public.is_admin());

-- Protect account roles/status, prevent admin self-lockout, and prevent a second admin.
create or replace function public.guard_profile_security_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if auth.uid() is not null
      and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
      if not public.is_admin() then
        raise exception 'Only an administrator can change account role or status';
      end if;

      if auth.uid() = old.id then
        raise exception 'You cannot change your own account role or status';
      end if;

      if new.role = 'admin' and old.role is distinct from 'admin' then
        raise exception 'An additional administrator cannot be created through the application';
      end if;
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' and old.role = 'admin'
    and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'The only administrator account cannot be deleted';
  end if;

  return old;
end;
$$;

drop trigger if exists trg_guard_profile_security_fields on public.profiles;
create trigger trg_guard_profile_security_fields
before update of role, is_active or delete on public.profiles
for each row execute function public.guard_profile_security_fields();

-- Atomically link an invited Auth identity to an existing active school record.
-- The RPC is available only to the Supabase Edge Function using service_role.
create or replace function public.link_provisioned_school_account(
  p_user_id uuid,
  p_record_type text,
  p_record_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'This operation is only available to the account provisioning service';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'The invited account profile has not been created';
  end if;

  if p_record_type = 'student' then
    update public.students
    set profile_id = p_user_id
    where id = p_record_id and profile_id is null and is_active = true;
    if not found then
      raise exception 'Student record is missing, inactive, or already linked';
    end if;
    update public.profiles set role = 'student' where id = p_user_id;
  elsif p_record_type = 'lecturer' then
    update public.lecturers
    set profile_id = p_user_id
    where id = p_record_id and profile_id is null and is_active = true;
    if not found then
      raise exception 'Lecturer record is missing, inactive, or already linked';
    end if;
    update public.profiles set role = 'lecturer' where id = p_user_id;
  else
    raise exception 'Unsupported account type';
  end if;
end;
$$;

revoke all on function public.link_provisioned_school_account(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.link_provisioned_school_account(uuid, text, uuid) to service_role;
