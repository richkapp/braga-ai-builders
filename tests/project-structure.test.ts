import { expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { files } from './helpers/files';

const required = [
  'AGENTS.md',
  'CHANGELOG.md',
  'README.md',
  'supabase/migrations/001_initial_schema.sql',
  'supabase/migrations/002_rls_policies.sql',
  'supabase/functions/request-invite-magic-link/index.ts',
  'src/pages/join/[code].astro',
  'src/pages/ideas.astro',
  'src/pages/events.astro',
  'src/pages/admin/index.astro'
];

test('required project files exist', () => {
  for (const file of required) {
    expect(existsSync(file), `${file} should exist`).toBe(true);
  }
});

function sourceLineCount(path: string): number {
  const source = readFileSync(path, 'utf8');
  if (!source) return 0;
  return source.split('\n').length - Number(source.endsWith('\n'));
}

test('page and component modules stay within the 700-line refactor boundary', () => {
  const oversized = ['src/pages', 'src/components']
    .flatMap((directory) => files(directory, (path) => /\.(?:astro|[jt]sx?)$/.test(path)))
    .map((path) => ({ path, lines: sourceLineCount(path) }))
    .filter(({ lines }) => lines > 700);

  expect(oversized).toEqual([]);
});
