import { expect, test } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const schema = readdirSync('supabase/migrations')
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map((file) => readFileSync(join('supabase/migrations', file), 'utf8'))
  .join('\n');

test('core community tables are defined', () => {
  for (const table of ['profiles', 'invites', 'invite_redemptions', 'ideas', 'idea_votes', 'idea_bookmarks', 'post_tags', 'events', 'event_registrations', 'bug_reports', 'community_votes', 'community_vote_options', 'community_vote_ballots']) {
    expect(schema).toContain(`create table public.${table}`);
  }
});

test('one upvote per member per idea is enforced', () => {
  expect(schema).toContain('primary key (idea_id, user_id)');
});

test('RLS is enabled on user-owned tables', () => {
  for (const table of ['profiles', 'ideas', 'idea_votes', 'idea_bookmarks', 'post_tags', 'events', 'event_registrations', 'bug_reports', 'community_votes', 'community_vote_options', 'community_vote_ballots']) {
    expect(schema).toContain(`alter table public.${table} enable row level security;`);
  }
});

test('Data API grants are explicit because auto expose is disabled', () => {
  expect(schema).toContain('grant usage on schema public to anon, authenticated;');
  expect(schema).toContain('grant select on table public.events to anon, authenticated;');
  expect(schema).toContain('grant select, insert, update, delete on table public.invites to authenticated;');
  expect(schema).toContain('grant usage on schema public to service_role;');
  expect(schema).toContain('grant all privileges on all tables in schema public to service_role;');
});

test('service-role-only tables are admin protected by policy', () => {
  expect(schema).toContain('Admins manage invites');
  expect(schema).toContain('Admins manage invite redemptions');
});

test('one current ballot per member per community vote is enforced', () => {
  expect(schema).toContain('unique (vote_id, user_id)');
  expect(schema).toContain('foreign key (vote_id, option_id)');
});
