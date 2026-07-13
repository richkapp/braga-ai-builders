# Deployment

Production deployments use Supabase for Auth/Postgres/Edge Functions and Vercel for the Astro frontend. Each community owns separate projects and data.

## Release gate

```bash
bun install --frozen-lockfile
bun run verify
```

Do not deploy when this command fails.

## Supabase

For a fresh installation whose migration history exactly matches this repository:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npx supabase secrets set \
  INVITE_REDIRECT_URL=https://YOUR_DOMAIN/auth/confirm \
  COMMUNITY_NAME="Your Community"
npx supabase functions deploy request-invite-magic-link --no-verify-jwt
npx supabase functions deploy anonymous-ideas --no-verify-jwt
npx supabase functions deploy bug-reports --no-verify-jwt
```

Do not use a broad `db push` against an installation whose recorded migration history differs from this repository. Reconcile history first or apply the exact reviewed forward SQL through the installation's approved production path.

### Rolling invitations release (`023`)

The reviewed database artifact is `supabase/migrations/023_rolling_member_invites.sql`.

- Expected SHA-256: `e014cad500491b9a1e738ba73ae0135259a638ff337688cf0354c2af20770808`
- The migration is transactional and forward-only.
- It keeps `complete_invite_redemption(uuid)` as a temporary schema-compatibility adapter for preserved campaign links. Intentionally retired system URLs remain revoked, so treat the database-to-Edge-Function interval as an invitation maintenance window.
- Removing that compatibility RPC requires a later cleanup migration after the new function is verified.

Preflight the target before applying anything:

```sql
select version();
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('invites', 'invite_redemptions')
order by table_name, ordinal_position;

select proname, pg_get_function_identity_arguments(oid)
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('reserve_invite_for_email', 'complete_invite_redemption');

select count(*) as active_pre023_invites
from public.invites
where revoked_at is null
  and (expires_at is null or expires_at > now());

select id, code, label, max_uses, uses_count, expires_at
from public.invites
where revoked_at is null
  and (expires_at is null or expires_at > now())
order by created_at;

select id, role
from public.profiles
where role in ('admin', 'super_admin')
  and suspended_at is null
order by case when role = 'super_admin' then 0 else 1 end, created_at;
```

Stop if the target shape is unexpected. Review every active pre-023 invite: bounded historical organizer campaigns will be assigned to the oldest active organizer, while reusable system-access rows must be in the migration's explicit revocation set. If the target contains another public/system code, update and re-review migration `023` before applying it. Confirm the final local artifact before the approved apply step:

```bash
sha256sum supabase/migrations/023_rolling_member_invites.sql
```

Release in this order:

1. Pause invitation account-creation traffic for the short database-to-function maintenance window.
2. Apply that exact SQL file with stop-on-error enabled.
3. Run the database verification below.
4. Immediately deploy `request-invite-magic-link` with `--no-verify-jwt`.
5. Verify existing-member sign-in and one controlled invitation using approved deliverable inboxes.
6. Resume invitation traffic and release the frontend only after the RPCs and Edge Function are healthy.

Database verification:

```sql
select conname, convalidated
from pg_constraint
where conname in (
  'invites_kind_check',
  'invites_kind_limits_check',
  'invite_redemptions_delivery_status_check'
)
order by conname;

select tgname
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and tgname in ('on_auth_user_confirmed_invite_insert', 'on_auth_user_confirmed_invite_update')
  and not tgisinternal
order by tgname;

select
  has_table_privilege('authenticated', 'public.invites', 'INSERT,UPDATE,DELETE') as authenticated_can_mutate_invites,
  has_table_privilege('authenticated', 'public.invite_redemptions', 'INSERT,UPDATE,DELETE') as authenticated_can_mutate_redemptions,
  has_function_privilege('anon', 'public.reserve_invite_for_email(text,text,text,text)', 'EXECUTE') as anon_can_reserve,
  has_function_privilege('authenticated', 'public.prepare_existing_invite_user(uuid)', 'EXECUTE') as member_can_rebind_auth_user,
  has_function_privilege('authenticated', 'public.complete_invite_for_user(uuid,text,text)', 'EXECUTE') as member_can_complete;

select invite_kind, count(*)
from public.invites
where revoked_at is null
  and (expires_at is null or expires_at > now())
group by invite_kind
order by invite_kind;

with pool_sizes as (
  select p.id, count(i.id)::integer as active_links
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.invites i
    on i.created_by = p.id
   and i.invite_kind = 'member_single'
   and i.uses_count = 0
   and i.revoked_at is null
   and (i.expires_at is null or i.expires_at > now())
  where p.suspended_at is null
    and u.email_confirmed_at is not null
    and not coalesce(u.is_anonymous, false)
  group by p.id
)
select min(active_links) as minimum_pool,
       max(active_links) as maximum_pool,
       count(*) filter (where active_links <> 5) as members_not_at_five
from pool_sizes;

select delivery_status, count(*)
from public.invite_redemptions
where delivery_status in ('reserved', 'delivered')
group by delivery_status
order by delivery_status;
```

Every listed constraint must be validated; both Auth triggers must exist; all five privilege checks must be `false`; active `system` invites must be zero; and every confirmed, non-anonymous, active member pool must contain five links.

If migration `023` fails before commit, fix the reviewed SQL and re-run from the unchanged schema. If it commits but a later step fails, do not attempt a down migration. Keep the database in place, retain the compatibility RPC, roll forward the Edge Function fix, and hold or revert the frontend until verification passes.

Bug-report email is optional. Without the Vault values below, reports still save and remain available at `/admin/bug-reports`; only outbound email is skipped.

For Resend's free no-domain mode, configure Supabase Vault after migrations are applied:

```sql
select vault.create_secret('YOUR_RESEND_API_KEY', 'RESEND_API_KEY', 'Bug-report notification provider key');
select vault.create_secret('YOUR_RESEND_ACCOUNT_EMAIL', 'BUG_REPORT_NOTIFICATION_EMAIL', 'Bug-report recipient');
select vault.create_secret('Local Community Platform <onboarding@resend.dev>', 'BUG_REPORT_FROM_EMAIL', 'Shared no-domain sender');
select vault.create_secret('https://YOUR_DOMAIN/admin/bug-reports', 'BUG_REPORT_ADMIN_URL', 'Bug-report review URL');
select vault.create_secret('Your Community', 'COMMUNITY_NAME', 'Notification subject label');
```

In no-domain mode, `YOUR_RESEND_ACCOUNT_EMAIL` must exactly match the email attached to the Resend account. Resend blocks other recipients when `onboarding@resend.dev` is used. For branded sending or additional recipients, verify the installation's own domain and replace `BUG_REPORT_FROM_EMAIL` with `Your Community <noreply@YOUR_VERIFIED_DOMAIN>`.

Vault secret names are unique. Use `vault.update_secret(...)` rather than creating a duplicate when rotating a value. Migration `022_bug_report_notifications.sql` queues an asynchronous, report-scoped idempotent Resend request from the database insert boundary, so direct trusted inserts and Edge Function submissions follow the same delivery path. See [Self-hosting: Optional bug-report email](self-hosting.md#optional-bug-report-email) for current free-plan limits and Resend's official restrictions.

Use exact trusted Auth redirect URLs. Keep service-role credentials inside Supabase; never send them to the browser or Vercel frontend environment. Every installation must use its own Resend account and credentials when notification email is enabled.

The first organizer must be bootstrapped as `super_admin` through a trusted SQL maintenance session. Super admins can assign ordinary admins, suspend or restore accounts, and permanently delete members. Ordinary admins retain organizer tools but cannot manage member access.

## Vercel

Set:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_SITE_URL`

Use `bun install --frozen-lockfile` and `bun run build`. Connect the public GitHub repository so merged `main` commits are the production source of truth.

## Production smoke checks

Check these after every release:

- `/` returns `200` and the WhatsApp/GitHub links are correct.
- `/ideas` loads posts and author profile links.
- `/events` loads published events and external RSVP links.
- `/members` exposes only opted-in public profiles.
- The footer bug-report dialog accepts a detailed report without requiring name or email, and configured notification delivery reaches the organizer inbox.
- `/admin/bug-reports` is admin-only and can move reports between new, in review, and done.
- `/admin/members` lets a super admin assign admins, suspend/restore members, and delete a controlled test account; ordinary admins cannot call those RPCs.
- `/signin` requires email consent, signs in existing members, and does not create uninvited accounts.
- `/settings` gives every active member five current single-use invite URLs; confirming a controlled new-member account replaces the consumed URL automatically.
- `/admin/invites` creates labeled campaign URLs only within the enforced 1–50-use range and supports expiry, usage reporting, copying, and revocation.
- `/admin` rejects non-admin users.
- `/admin/members` exposes the full member database only to admins.
- `/join` returns `404`; only generated or admin-created coded invite routes are valid.
- `/admin/registrations` returns `404`.

Never test production email delivery with disposable or non-deliverable addresses. Use a controlled deliverable inbox only with explicit approval.
