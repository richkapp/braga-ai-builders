import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';

const read = (path: string) => readFile(path, 'utf8');

describe('super-admin community feature settings', () => {
  test('ships one forward migration with super-admin-only mutation and database event enforcement', async () => {
    const migration = await read('supabase/migrations/037_super_admin_feature_settings.sql');
    const eventSetter = migration.slice(
      migration.indexOf('create or replace function public.super_admin_set_event_creation_enabled'),
      migration.indexOf('-- Voting visibility')
    );
    const votingSetter = migration.slice(
      migration.indexOf('create or replace function public.admin_set_voting_feature_enabled'),
      migration.indexOf('-- Preserve organizer access')
    );

    expect(migration).toContain("('allow_event_creation', true)");
    expect(migration).toContain('if not public.is_super_admin() then');
    expect(migration).toContain('Super-admin access required');
    expect(migration).toContain('get_event_creation_feature_enabled');
    expect(migration).toContain('super_admin_set_event_creation_enabled');
    expect(migration).toContain('Admins create events when enabled');
    expect(migration).toContain("feature_key = 'allow_event_creation'");
    expect(migration).toContain('and public.get_event_creation_feature_enabled()');
    expect(migration).toContain('create policy "Admins update events"');
    expect(migration).toContain('create policy "Admins delete events"');
    expect(eventSetter).toContain('public.is_super_admin()');
    expect(votingSetter).toContain('public.is_super_admin()');
    expect(votingSetter).not.toContain('public.is_admin()');
    expect(migration).toContain('grant execute on function public.get_event_creation_feature_enabled() to authenticated');
    expect(migration).toContain('grant execute on function public.super_admin_set_event_creation_enabled(boolean) to authenticated');
  });

  test('centralizes feature switches on a super-admin-only settings route', async () => {
    const [dashboard, page, settings, participation, ideas, voting] = await Promise.all([
      read('src/components/admin/AdminDashboard.tsx'),
      read('src/pages/admin/settings.astro'),
      read('src/components/admin/CommunityFeatureSettings.tsx'),
      read('src/components/admin/PostParticipationManager.tsx'),
      read('src/components/admin/IdeaModerator.tsx'),
      read('src/components/admin/VotingManager.tsx')
    ]);

    expect(page).toContain('mode="settings"');
    expect(dashboard).toContain("key: 'settings'");
    expect(dashboard).toContain("role === 'super_admin'");
    expect(dashboard).toContain('<CommunityFeatureSettings />');
    expect(settings).toContain('Voting');
    expect(settings).toContain('Event creation');
    expect(settings).toContain('<PostParticipationManager />');
    expect(participation).toContain('Allow anonymous posts');
    expect(participation).toContain('Allow anonymous comments');
    expect(ideas).not.toContain('<PostParticipationManager />');
    expect(voting).toContain('Manage feature availability in Settings');
    expect(voting).not.toContain('setVotingFeatureEnabled');
  });

  test('checks event creation availability in the UI and keeps the database as the authority', async () => {
    const [manager, adminClient, featureClient] = await Promise.all([
      read('src/components/admin/EventManager.tsx'),
      read('src/lib/admin.ts'),
      read('src/lib/communityFeatures.ts')
    ]);

    expect(manager).toContain('getEventCreationEnabled');
    expect(manager).toContain('Event creation is off');
    expect(adminClient).toContain("supabase.from('events').insert");
    expect(featureClient).toContain("rpc('get_event_creation_feature_enabled'");
    expect(featureClient).toContain("rpc('super_admin_set_event_creation_enabled'");
  });
});
