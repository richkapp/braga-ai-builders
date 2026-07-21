import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path: string) => readFile(new URL(path, root), 'utf8');

describe('WhatsApp community rules gate', () => {
  test('preserves the supplied Braga Area WhatsApp Community rules', async () => {
    const config = await read('src/config/community.ts');
    expect(config).toContain("name: 'Braga Area WhatsApp Community'");
    expect(config).toContain("groupName: 'Braga AI Builders WhatsApp Group'");
    expect(config).toContain('We welcome all residents, regardless of race, religion, nationality, income, skin colour, age, education, sexual orientation, or other personal characteristics.');
    expect(config).toContain('This is not an expat-only group.');
    expect(config).toContain('Only people who currently live in Braga or a nearby town are eligible to join.');
    expect(config).toContain("title: 'No self-promotion'");
    expect(config).toContain("title: 'Keep invite links private'");
    expect(config).toContain("title: 'No political opinions or debate'");
    expect(config).toContain("title: 'Invite local residents only'");
    expect(config).toContain("title: 'Handle disagreements privately'");
    expect(config).toContain('Community and group admins may delete posts, warn members, or remove members when rules are violated.');
    expect(config).toContain('Some groups may involve adult themes, including events where alcohol is served.');
  });

  test('requires both empty agreements before opening WhatsApp', async () => {
    const gate = await read('src/components/WhatsAppJoinGate.astro');
    expect(gate).toContain('<dialog');
    expect(gate).toContain('aria-modal="true"');
    expect(gate).toContain('data-whatsapp-rules-consent');
    expect(gate).toContain('data-whatsapp-legal-consent');
    expect(gate.match(/type="checkbox" required/g)).toHaveLength(2);
    expect(gate).toContain('I agree to the community rules and confirm that I live in or around Braga.');
    expect(gate).toContain('I agree to receive the WhatsApp group invite link and to the');
    expect(gate).toContain('href="/terms"');
    expect(gate).toContain('href="/privacy"');
    expect(gate).toContain('data-whatsapp-gate-submit');
    expect(gate).toContain('disabled>Agree and open WhatsApp');
    expect(gate).toContain('submit.disabled = !(rules?.checked && legal?.checked)');
    expect(gate).toContain('form?.reset()');
    expect(gate).toContain('window.location.assign(inviteUrl)');
    expect(gate).not.toContain('localStorage');
    expect(gate).not.toContain('sessionStorage');
  });

  test('routes every public WhatsApp CTA through one global gate', async () => {
    const layout = await read('src/layouts/BaseLayout.astro');
    const entrypointPaths = [
      'src/pages/index.astro',
      'src/components/auth/InviteEmailForm.tsx',
      'src/components/auth/SignInTabs.tsx',
      'src/components/profile/MemberDirectory.tsx',
      'src/components/ideas/IdeaComposer.tsx'
    ];
    const entrypoints = await Promise.all(entrypointPaths.map(read));
    const combined = entrypoints.join('\n');

    expect(layout).toContain("import WhatsAppJoinGate from '../components/WhatsAppJoinGate.astro'");
    expect(layout).toContain('<WhatsAppJoinGate />');
    expect(combined.match(/data-whatsapp-join/g)).toHaveLength(6);
    expect(combined).not.toContain('href={communityConfig.whatsappUrl}');
    expect(combined).not.toContain('href={whatsappUrl}');
    expect(combined).not.toContain('chat.whatsapp.com');
  });
});
