# Provision account Edge Function

This function sends a Supabase Auth invitation for an existing, active student or lecturer school record and links the new Auth UUID to that record. It intentionally does not create administrator accounts or accept arbitrary roles, emails, or passwords from the browser.

## Existing database prerequisite

1. Back up the database.
2. Confirm there is only one `profiles.role = 'admin'` row. The migration deliberately stops if more than one exists.
3. Run `supabase/migrations/20261005000000_secure_account_provisioning.sql` in the Supabase SQL Editor against the existing UNHIMAS database. It is additive/non-destructive: it adds a partial unique index, replaces one insert policy, and creates/replaces a trigger function, trigger, and service-role-only linking RPC. It does not drop tables or data.

## Deployment

Deploy `supabase/functions/provision-account/index.js` as an Edge Function named `provision-account`. It relies on Supabase's server-side `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` environment variables. If invitation links should return to a specific deployed app origin, set the Edge Function secret `APP_BASE_URL` to that exact origin and add it to Supabase Auth's allowed redirect URLs.

Never add the service-role key to `.env` variables prefixed with `VITE_`, React code, or Git.

## Admin workflow

Create the student/lecturer academic record first and ensure it has a valid email and is active. On the Students or Lecturers page, use the person-plus action for that row. The Edge Function verifies the caller's Supabase identity and active admin profile, verifies that the record is eligible/unlinked, sends the Auth invite, then invokes the linking RPC. If linking fails, it attempts to remove the newly invited Auth user and returns an error.

The recipient sets their own password from the Supabase invitation link and signs in. Login routing reads their database profile role; unresolved, inactive, or unreadable profiles are not sent to a role dashboard.

Before production, test invitation delivery, allowed redirect URLs, profile linkage, RLS, and failure cleanup in a non-production Supabase project.
