import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import {
  COMMUNITY_PLATFORM_RELEASE,
  LAUNCHER_FEATURES,
  buildCommunityLaunchPrompt,
  buildCommunityRecoveryPrompt,
  platformLanguageFromStoredValue,
  validateCommunityAnswers,
  type CommunityLauncherAnswers,
} from '../src/lib/createCommunityLauncher';

const completeAnswers: CommunityLauncherAnswers = {
  agentConfirmed: true,
  communityName: 'Riverside Makers',
  location: 'Coimbra, Portugal',
  purpose: 'Help local makers share practical skills and build projects together.',
  audience: 'Makers, craftspeople, students, and curious neighbours.',
  organizerName: 'Rita Costa',
  country: 'Portugal',
  locale: 'English',
  timeZone: 'Europe/Lisbon',
  features: {
    posts: true,
    directory: true,
    events: true,
    voting: false,
    channel: false,
    bugEmail: false,
  },
};

describe('create-community launch brief', () => {
  test('pins the stable upstream release and carries approved community choices', () => {
    const prompt = buildCommunityLaunchPrompt(completeAnswers);

    expect(COMMUNITY_PLATFORM_RELEASE.tag).toBe('v0.2.0');
    expect(prompt).toContain('Riverside Makers');
    expect(prompt).toContain('Coimbra, Portugal');
    expect(prompt).toContain('- Platform language: English');
    expect(prompt).not.toContain('- Locale:');
    expect(prompt).toContain(COMMUNITY_PLATFORM_RELEASE.url);
    expect(prompt).toContain(`git clone --branch ${COMMUNITY_PLATFORM_RELEASE.tag}`);
    expect(prompt).toContain('- Posts and discussions: YES — launch enabled');
    expect(prompt).toContain('- Community voting: NOT NOW — keep disabled but available later');
    expect(prompt).toContain('Ask me for the hero image only after the source is available locally.');
    expect(prompt).toContain('Do not use the Braga AI Builders downstream repository');
    expect(prompt).toContain('Homepage + organizer login + member invitation');
    expect(prompt).not.toContain('undefined');
  });

  test('keeps provider secrets outside the launcher and the generated handoff', () => {
    const prompt = buildCommunityLaunchPrompt(completeAnswers);
    const recovery = buildCommunityRecoveryPrompt(completeAnswers);

    for (const output of [prompt, recovery]) {
      expect(output).toContain('Never commit secrets');
      expect(output).toContain('Do not ask me to paste secrets into this chat');
      expect(output).not.toContain('SUPABASE_SERVICE_ROLE_KEY=');
      expect(output).not.toContain('SMTP_PASS=');
      expect(output).not.toContain('VERCEL_TOKEN=');
    }
  });

  test('requires explicit agent capability, core community details, and every feature answer', () => {
    expect(LAUNCHER_FEATURES).toHaveLength(6);
    expect(validateCommunityAnswers(completeAnswers)).toEqual([]);

    const incomplete: CommunityLauncherAnswers = {
      ...completeAnswers,
      agentConfirmed: false,
      communityName: ' ',
      purpose: '',
      features: { ...completeAnswers.features, events: null },
    };

    expect(validateCommunityAnswers(incomplete)).toEqual([
      'Confirm that your AI can access files and run commands.',
      'Add your community name.',
      'Describe why the community exists.',
      'Answer Yes or Not now for every launch feature.',
    ]);
  });

  test('turns legacy locale codes into plain-language platform languages', () => {
    expect(platformLanguageFromStoredValue('en-GB')).toBe('English');
    expect(platformLanguageFromStoredValue('pt-PT')).toBe('Portuguese');
    expect(platformLanguageFromStoredValue('Spanish')).toBe('Spanish');
  });

  test('ships as a client-side public wizard with a visible site entry point', async () => {
    const [page, launcher, nav, footer] = await Promise.all([
      readFile('src/pages/create.astro', 'utf8'),
      readFile('src/components/create-community/CreateCommunityLauncher.tsx', 'utf8'),
      readFile('src/components/Nav.astro', 'utf8'),
      readFile('src/components/Footer.astro', 'utf8'),
    ]);

    expect(page).toContain('CreateCommunityLauncher client:load');
    expect(page).toContain('Give your local community');
    expect(page).toContain('href="#community-launcher"');
    expect(launcher).toContain('Platform Language');
    expect(launcher).not.toContain('Public locale');
    expect(launcher).toContain("const STORAGE_KEY = 'local-community-launcher-v1'");
    expect(launcher).toContain("{ id: 'features', label: 'Features' }");
    expect(launcher).toContain('Copy launch brief');
    expect(launcher).toContain('Copy recovery brief');
    expect(launcher).toContain('Back to review');
    expect(launcher).toContain('Nothing is preselected.');
    expect(launcher).not.toContain('type="file"');
    expect(launcher).not.toContain('fetch(');
    expect(nav.match(/href="\/create"/g)).toHaveLength(2);
    expect(footer).toContain('href="/create"');
  });
});
