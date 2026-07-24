import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import {
  COMMUNITY_PLATFORM_RELEASE,
  INCLUDED_PLATFORM_FEATURES,
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
  locale: 'English',
};

describe('create-community launch brief', () => {
  test('pins the stable source and installs the complete platform into organizer-owned accounts', () => {
    const prompt = buildCommunityLaunchPrompt(completeAnswers);

    expect(COMMUNITY_PLATFORM_RELEASE.tag).toBe('v0.2.0');
    expect(INCLUDED_PLATFORM_FEATURES.length).toBeGreaterThanOrEqual(6);
    expect(prompt).toContain('Riverside Makers');
    expect(prompt).toContain('Coimbra, Portugal');
    expect(prompt).toContain('- Platform language: English');
    expect(prompt).toContain(COMMUNITY_PLATFORM_RELEASE.url);
    expect(prompt).toContain(`git clone --branch ${COMMUNITY_PLATFORM_RELEASE.tag}`);
    expect(prompt).toContain('Install every built module');
    expect(prompt).toContain('new organizer-owned Supabase account and project');
    expect(prompt).toContain('new organizer-owned Vercel account and project');
    expect(prompt).toContain('Do not build OAuth-based or one-click provider provisioning');
    expect(prompt).toContain('/admin/settings');
    expect(prompt).toContain('Voting, event creation, anonymous posting, and anonymous commenting');
    expect(prompt).toContain('Ask me for the hero image only after the source is available locally.');
    expect(prompt).toContain('Do not use the Braga AI Builders downstream repository');
    expect(prompt).toContain('Homepage + organizer login + member invitation');
    expect(prompt).not.toContain('NOT NOW');
    expect(prompt).not.toContain('undefined');
  });

  test('keeps provider secrets outside the launcher and guided handoff', () => {
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

  test('requires only capable-agent confirmation and plain community facts', () => {
    expect(validateCommunityAnswers(completeAnswers)).toEqual([]);

    const incomplete: CommunityLauncherAnswers = {
      ...completeAnswers,
      agentConfirmed: false,
      communityName: ' ',
      purpose: '',
    };

    expect(validateCommunityAnswers(incomplete)).toEqual([
      'Confirm that your AI can access files and run commands.',
      'Add your community name.',
      'Describe why the community exists.',
    ]);
  });

  test('turns legacy locale codes into plain-language platform languages', () => {
    expect(platformLanguageFromStoredValue('en-GB')).toBe('English');
    expect(platformLanguageFromStoredValue('pt-PT')).toBe('Portuguese');
    expect(platformLanguageFromStoredValue('Spanish')).toBe('Spanish');
  });

  test('ships a shorter client-side flow without feature-selection onboarding', async () => {
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
    expect(launcher).toContain("{ id: 'review', label: 'Review' }");
    expect(launcher).not.toContain("{ id: 'features', label: 'Features' }");
    expect(launcher).toContain('Every built feature is included');
    expect(launcher).toContain('Copy launch brief');
    expect(launcher).toContain('Copy recovery brief');
    expect(launcher).toContain('Back to review');
    expect(launcher).not.toContain('Nothing is preselected.');
    expect(launcher).not.toContain('type="file"');
    expect(launcher).not.toContain('fetch(');
    expect(nav.match(/href="\/create"/g)).toHaveLength(2);
    expect(footer).toContain('href="/create"');
  });
});
