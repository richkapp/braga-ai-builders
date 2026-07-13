import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path: string) => readFile(new URL(path, root), 'utf8');

describe('delivery security contracts', () => {
  test('active UI and seed never expose the retired shared invite', async () => {
    const paths = [
      'src/pages/index.astro',
      'src/pages/join/[code].astro',
      'src/components/Nav.astro',
      'supabase/seed.sql'
    ];
    for (const path of paths) expect(await read(path)).not.toContain('braga-whatsapp');
  });

  test('auth redirects trust exact hosts instead of a Vercel wildcard', async () => {
    const config = await read('supabase/config.toml');
    expect(config).not.toContain('https://*.vercel.app');
    expect(config).toContain('https://braga-ai-builders.vercel.app/auth/confirm');
  });

  test('member profiles are opt-in and anonymous sessions stay out of member-only features', async () => {
    const schema = await read('supabase/migrations/001_initial_schema.sql');
    const privacy = await read('supabase/migrations/009_private_profiles_by_default.sql');
    const anonymous = await read('supabase/migrations/010_anonymous_ideas.sql');
    const config = await read('supabase/config.toml');
    const edge = await read('supabase/functions/anonymous-ideas/index.ts');
    const migration = await read('supabase/migrations/011_anonymous_ideas_via_edge.sql');
    expect(schema).toContain('is_public boolean not null default false');
    expect(privacy).toContain('alter column is_public set default false');
    expect(anonymous).toContain("auth.jwt() ->> 'is_anonymous'");
    expect(migration).toContain('post_anonymous_idea');
    expect(migration).toContain('toggle_anonymous_idea_vote');
    expect(edge).toContain("action: 'create'");
    expect(config).toContain('[functions.anonymous-ideas]');
  });

  test('member profile and registration mutations are column/RPC scoped', async () => {
    const sql = await read('supabase/migrations/006_delivery_readiness.sql');
    expect(sql).toContain('revoke update on table public.profiles from authenticated');
    expect(sql).toContain('revoke insert, update on table public.event_registrations from authenticated');
    expect(sql).toContain('create function public.register_for_event');
    expect(sql).toContain('create or replace function public.cancel_event_registration');
    expect(sql).toContain("status = 'open'");
  });

  test('invite delivery is reserved, delivered, claimed, or failed explicitly', async () => {
    const baseline = await read('supabase/migrations/006_delivery_readiness.sql');
    const rolling = await read('supabase/migrations/023_rolling_member_invites.sql');
    const fn = await read('supabase/functions/request-invite-magic-link/index.ts');
    expect(baseline).toContain('reserve_invite_for_email');
    expect(rolling).toContain('mark_invite_delivery');
    expect(rolling).toContain('claim_my_pending_invite');
    expect(rolling).toContain('fail_invite_redemption');
    expect(fn).toContain('/rest/v1/rpc/reserve_invite_for_email');
    expect(fn).toContain('/rest/v1/rpc/mark_invite_delivery');
    expect(fn).toContain('/rest/v1/rpc/fail_invite_redemption');
    expect(fn).toContain("payload.context === 'signin'");
    expect(fn).toContain('create_user: false');
    expect(fn).not.toContain('IDEA_SIGNUP_INVITE_CODE');
    expect(fn).toContain('payload.emailConsent !== true');
    expect(fn).toContain('You must agree to receive the one-time magic-link email.');
    expect(fn).not.toContain("'Access-Control-Allow-Origin': '*'");
  });

  test('public post reads hide visitor identifiers and invite retries check capacity before delivery', async () => {
    const migration = await read('supabase/migrations/018_public_data_and_invite_capacity.sql');
    const ideas = await read('src/lib/ideas.ts');
    const feed = await read('src/components/ideas/IdeaFeed.tsx');
    const detail = await read('src/components/ideas/IdeaDetail.tsx');
    const publicGrant = migration.slice(migration.indexOf('grant select ('), migration.indexOf(') on table public.ideas'));
    expect(migration).toContain('revoke select on table public.ideas from anon, authenticated');
    expect(publicGrant).not.toContain('anonymous_visitor_id');
    expect(publicGrant).not.toContain('author_id');
    expect(migration).toContain('create or replace function public.list_visible_ideas()');
    expect(migration).toContain('viewer_can_edit boolean');
    expect(migration).toContain('revoke all on table public.event_registration_counts from anon, authenticated');
    expect(migration).toContain('id <> existing_redemption.id');
    expect(migration.indexOf("raise exception 'invite use limit reached'"))
      .toBeLessThan(migration.indexOf('update public.invite_redemptions'));
    expect(ideas).toContain('PUBLIC_IDEA_COLUMNS');
    expect(ideas).not.toContain("PUBLIC_IDEA_COLUMNS = 'id, slug, title, body, month_key, status, author_id");
    expect(feed).not.toContain("from('ideas').select('*')");
    expect(feed).toContain("rpc('list_visible_ideas')");
    expect(detail).not.toContain(".select('*')");
  });

  test('idea authors can edit content while only admins can change lifecycle state', async () => {
    const migration = await read('supabase/migrations/014_idea_edit_permissions.sql');
    expect(migration).toContain('grant update (title, body, status)');
    expect(migration).toContain("status = 'open'");
    expect(migration).toContain('author_id = auth.uid()');
  });

  test('the full member database is exposed only through an admin-guarded RPC', async () => {
    const migration = await read('supabase/migrations/015_admin_member_directory.sql');
    expect(migration).toContain('if not public.is_admin()');
    expect(migration).toContain('join auth.users');
    expect(migration).toContain('revoke all on function public.admin_list_members() from public, anon');
    expect(migration).toContain('grant execute on function public.admin_list_members() to authenticated');
  });

  test('super-admin member controls are isolated, self-protecting, and suspend mutations immediately', async () => {
    const enumMigration = await read('supabase/migrations/020_super_admin_role.sql');
    const controls = await read('supabase/migrations/021_super_admin_member_controls.sql');
    expect(enumMigration).toContain("add value if not exists 'super_admin'");
    expect(controls).toContain("profiles.role in ('admin', 'super_admin')");
    expect(controls).toContain("profiles.role = 'super_admin'");
    expect(controls).toContain('profiles.suspended_at is null');
    expect(controls).toContain('create or replace function public.is_active_member()');
    expect(controls).toContain('create or replace function public.is_super_admin()');
    expect(controls).toContain('create or replace function public.super_admin_set_member_role');
    expect(controls).toContain('create or replace function public.super_admin_set_member_suspension');
    expect(controls).toContain('create or replace function public.super_admin_delete_member');
    expect(controls).toContain('if not public.is_super_admin()');
    expect(controls).toContain('target_user_id = current_user_id');
    expect(controls).toContain("current_target_role = 'super_admin'");
    expect(controls).toContain("target_role::text not in ('member', 'admin')");
    expect(controls).toContain('set banned_until = case when should_suspend');
    expect(controls).toContain('delete from auth.users where id = target_user_id');
    expect(controls.match(/public\.is_active_member\(\)/g)?.length).toBeGreaterThanOrEqual(10);
    expect(controls).toContain("raise exception 'account suspended'");
    expect(controls).toContain('grant execute on function public.super_admin_delete_member(uuid) to authenticated');
    expect(controls).not.toContain('richard@richkapp.com');
  });

  test('RIP categories and tags are constrained across direct and anonymous writes', async () => {
    const migration = await read('supabase/migrations/016_rip_categories_tags.sql');
    const dynamicTags = await read('supabase/migrations/026_member_created_post_tags.sql');
    const edge = await read('supabase/functions/anonymous-ideas/index.ts');
    expect(migration).toContain("category in ('idea', 'resource', 'perspective')");
    expect(migration).toContain("'community-challenge'");
    expect(migration).toContain('grant update (title, body, category, tags, status)');
    expect(migration).toContain('p_category text');
    expect(migration).toContain('p_tags text[]');
    expect(edge).toContain('p_category: payload.category');
    expect(edge).toContain('p_tags: payload.tags');
    expect(dynamicTags).toContain('create table public.post_tags');
    expect(dynamicTags).toContain('create unique index post_tags_label_lower_idx');
    expect(dynamicTags).toContain('revoke all on table public.post_tags from public, anon, authenticated');
    expect(dynamicTags).toContain('create or replace function public.list_post_tags()');
    expect(dynamicTags).toContain('create or replace function public.create_post_tag(p_label text)');
    expect(dynamicTags).toContain('pg_advisory_xact_lock');
    expect(dynamicTags).toContain('custom tag lifetime limit reached');
    expect(dynamicTags).toContain('viewer_custom_tag_limit');
    expect(dynamicTags).toContain('order by usage_count desc');
    expect(dynamicTags).toContain('drop constraint if exists ideas_tags_allowed');
    expect(dynamicTags).toContain('create trigger validate_idea_tags_before_write');
    expect(dynamicTags).toContain('cardinality(new.tags) > 6');
    expect(dynamicTags).toContain('from public.post_tags');
    expect(dynamicTags).toContain('grant execute on function public.list_post_tags() to anon, authenticated');
    expect(dynamicTags).toContain('grant execute on function public.create_post_tag(text) to authenticated');
    expect(dynamicTags).not.toContain('grant select on table public.post_tags to authenticated');
  });

  test('post author hover cards expose only already-public profile fields', async () => {
    const migration = await read('supabase/migrations/017_post_author_hover_cards.sql');
    expect(migration).toContain('profiles.is_public = true');
    expect(migration).toContain('profiles.bio');
    expect(migration).toContain('profiles.website_url');
    expect(migration).toContain('profiles.linkedin_url');
    expect(migration).toContain('profiles.github_url');
    expect(migration).toContain('profiles.x_url');
    expect(migration).not.toContain('auth.users');
  });

  test('rolling member invitations replenish atomically after confirmed account creation', async () => {
    const migration = await read('supabase/migrations/023_rolling_member_invites.sql');
    const edge = await read('supabase/functions/request-invite-magic-link/index.ts');
    expect(migration).toContain("'member_single'");
    expect(migration).toContain("'admin_campaign'");
    expect(migration).toContain('max_uses = 1');
    expect(migration).toContain('max_uses between 1 and 50');
    expect(migration).toContain("set invite_kind = 'admin_campaign'");
    expect(migration).toContain('with legacy_campaign_owner as');
    expect(migration).toContain("i.code not in ('braga-whatsapp', 'local-development-only')");
    expect(migration).toContain("where invite_kind = 'system'");
    expect(migration).toContain('create or replace function public.replenish_member_invite_pool');
    expect(migration).toContain('while active_invite_count < 5 loop');
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain('create or replace function public.handle_member_profile_invites');
    expect(migration).toContain('after insert on public.profiles');
    expect(migration).toContain('and not coalesce(u.is_anonymous, false)');
    expect(migration).toContain('perform public.replenish_member_invite_pool(member_record.id)');
    expect(migration).toContain('create or replace function public.get_my_member_invites');
    expect(migration).toContain('create or replace function public.claim_my_pending_invite');
    expect(migration).toContain("current_flow is distinct from 'rolling_v1'");
    expect(migration).toContain("current_created_at < now() - interval '5 minutes'");
    expect(migration).toContain('after update of email_confirmed_at on auth.users');
    expect(migration).toContain("delivery_status = 'delivered'");
    expect(migration).toContain("selected_invite.invite_kind = 'member_single' and selected_invite.uses_count >= 1");
    expect(migration).toContain("existing_redemption.claim_expires_at > now()");
    expect(migration).toContain('u.created_at >= selected_redemption.requested_at');
    expect(migration).toContain("if not claimed and invite_flow is distinct from 'rolling_v1' then");
    expect(migration).toContain("r.delivery_status = 'reserved'");
    expect(migration).toContain("if not claimed then");
    expect(migration).toContain("raise exception 'invite confirmation is not pending'");
    expect(migration).toContain('uses_count = uses_count + 1');
    expect(migration).toContain('perform public.replenish_member_invite_pool(selected_invite.created_by)');
    expect(migration).toContain('profiles.suspended_at is null');
    expect(migration).toContain('revoke insert, update, delete on table public.invites from authenticated');
    expect(migration).toContain('revoke insert, update, delete on table public.invite_redemptions from authenticated');
    expect(migration).toContain('create or replace function public.complete_invite_redemption');
    expect(migration).toContain('create or replace function public.prepare_existing_invite_user');
    expect(migration).toContain("if selected_redemption.delivery_status = 'completed' then");
    expect(migration).toContain('expected_user_id = target_user_id');
    expect(migration).toContain('perform public.mark_invite_delivery(target_redemption_id, true)');
    expect(migration).toContain('rebound_user := public.prepare_existing_invite_user(target_redemption_id)');
    expect(migration).toContain('u.created_at < r.requested_at');
    expect(migration).not.toContain('drop function if exists public.complete_invite_redemption');
    expect(edge).toContain("invite_flow: 'rolling_v1'");
    expect(edge.indexOf('await markInviteDelivery(supabaseUrl, serviceRoleKey, reserved.redemption_id, true)')).toBeLessThan(edge.indexOf('const newAccountCreated = await sendInvitedLink'));
    expect(edge).toContain("'/rest/v1/rpc/mark_invite_delivery'");
    expect(edge).toContain("'/rest/v1/rpc/prepare_existing_invite_user'");
    expect(edge).toContain('const existingUser = [400, 422].includes');
    expect(edge).toContain('keeping the pending claim until expiry');
    expect(edge).not.toContain("'/rest/v1/rpc/complete_invite_redemption'");
  });

  test('admin invitation campaigns enforce a database-backed 1–50 use limit', async () => {
    const migration = await read('supabase/migrations/023_rolling_member_invites.sql');
    const admin = await read('src/lib/admin.ts');
    expect(migration).toContain('create or replace function public.create_admin_invite');
    expect(migration).toContain('requested_max_uses is null or requested_max_uses not between 1 and 50');
    expect(migration).toContain("invite_kind = 'admin_campaign' and max_uses is not null and max_uses between 1 and 50");
    expect(migration).toContain('create or replace function public.revoke_admin_invite');
    expect(migration).toContain('create or replace function public.list_member_invites_for_admin');
    expect(migration).toContain("raise exception 'admin access required'");
    expect(migration).toContain('grant execute on function public.create_admin_invite');
    expect(admin).toContain("rpc('create_admin_invite'");
    expect(admin).toContain("rpc('revoke_admin_invite'");
    expect(admin).toContain("rpc('list_member_invites_for_admin'");
  });

  test('post bookmarks are private, unique, and limited to active signed-in members', async () => {
    const migration = await read('supabase/migrations/024_post_bookmarks.sql');
    const queryPaths = await read('supabase/migrations/025_post_library_query_paths.sql');
    expect(migration).toContain('create table public.idea_bookmarks');
    expect(migration).toContain('primary key (user_id, idea_id)');
    expect(migration).toContain('references auth.users(id) on delete cascade');
    expect(migration).toContain('references public.ideas(id) on delete cascade');
    expect(migration).toContain('alter table public.idea_bookmarks enable row level security');
    expect(migration).toContain('revoke all on table public.idea_bookmarks from public, anon, authenticated');
    expect(migration).toContain('create or replace function public.get_my_post_relationships');
    expect(migration).toContain('create or replace function public.set_idea_bookmark');
    expect(migration).toContain('create or replace function public.is_active_member()');
    expect(migration).toContain('create or replace function public.is_admin()');
    expect(migration).toContain('create or replace function public.is_super_admin()');
    expect(migration).toContain('select not public.is_anonymous_user()');
    expect(migration).toContain('create or replace function public.current_member_role()');
    expect(migration).toContain('public.is_active_member()');
    expect(migration).toContain("auth.jwt() ->> 'is_anonymous'");
    expect(migration).toContain("raise exception 'active member account required'");
    expect(migration).toContain("target.status <> 'hidden' or public.is_admin()");
    expect(migration).toContain('grant execute on function public.get_my_post_relationships(uuid) to authenticated');
    expect(migration).toContain('on conflict (user_id, idea_id) do nothing');
    expect(migration).toContain('grant execute on function public.set_idea_bookmark(uuid, boolean) to authenticated');
    expect(migration).toContain('and public.is_active_member()');
    expect(migration).not.toContain('grant select on table public.idea_bookmarks to authenticated');
    expect(queryPaths).toContain('create index if not exists ideas_author_id_idx');
    expect(queryPaths).toContain('on public.ideas (author_id)');
    expect(queryPaths).toContain('where author_id is not null');
    expect(queryPaths).toContain('create or replace function public.set_idea_bookmark');
    expect(queryPaths).toContain('for share');
    expect(queryPaths).not.toContain('for no key update');
  });

  test('bug reports use a rate-limited Edge Function and admin-only data access', async () => {
    const migration = await read('supabase/migrations/019_bug_reports.sql');
    const notifications = await read('supabase/migrations/022_bug_report_notifications.sql');
    const edge = await read('supabase/functions/bug-reports/index.ts');
    const config = await read('supabase/config.toml');
    expect(migration).toContain('create table public.bug_reports');
    expect(migration).toContain('alter table public.bug_reports enable row level security');
    expect(migration).toContain('create or replace function public.submit_bug_report');
    expect(migration).toContain('char_length(normalized_description) between 20 and 5000');
    expect(migration).toContain('p_website');
    expect(migration).toContain("created_at >= now() - interval '1 day'");
    expect(migration).toContain("created_at >= now() - interval '1 hour'");
    expect(migration.match(/pg_advisory_xact_lock/g)).toHaveLength(2);
    expect(migration).toContain('revoke all on table public.bug_reports from public, anon, authenticated');
    expect(migration).toContain('grant all privileges on table public.bug_reports to service_role');
    expect(migration).toContain('grant execute on function public.submit_bug_report');
    expect(migration).toContain('to service_role');
    expect(migration).toContain('Admins read bug reports');
    expect(migration).toContain('Admins update bug report status');
    expect(migration).toContain('grant update (status) on table public.bug_reports to authenticated');
    expect(migration).not.toContain('grant insert on table public.bug_reports to anon');
    expect(edge).toContain("'/rest/v1/rpc/submit_bug_report'");
    expect(edge).toContain("request.headers.get('x-forwarded-for')");
    expect(edge).toContain('if (!origin || !allowed.has(origin)) return null');
    expect(edge).toContain("name: 'HMAC'");
    expect(edge).toContain("crypto.subtle.sign('HMAC'");
    expect(edge).toContain('rawBody.length > 16_000');
    expect(edge).toContain("typeof parsed !== 'object' || Array.isArray(parsed)");
    expect(edge).toContain('allowedOrigins.has(parsed.origin)');
    expect(edge).toContain('not part of this community site');
    expect(notifications).toContain('create extension if not exists pg_net');
    expect(notifications).toContain('before insert on public.bug_reports');
    expect(notifications).toContain("url := 'https://api.resend.com/emails'");
    expect(notifications).toContain("'Idempotency-Key', 'bug-report/' || new.id");
    expect(notifications).toContain("where name = 'RESEND_API_KEY'");
    expect(notifications).toContain('exception\n  when others then');
    expect(notifications).toContain('revoke all on function public.enqueue_bug_report_notification() from public, anon, authenticated');
    expect(edge).not.toContain('RESEND_API_KEY');
    expect(edge).not.toContain("'Access-Control-Allow-Origin': '*'");
    expect(config).toContain('[functions.bug-reports]');
    expect(config).toContain('verify_jwt = false');
  });
});
