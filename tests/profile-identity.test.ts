import { expect, test } from 'bun:test';
import { verifiedProfileIdentity } from '@/lib/profileIdentity';

test('profile updates remain bound to the authenticated submitting account', () => {
  expect(verifiedProfileIdentity('account-a', 'account-a')).toBe('account-a');
  expect(() => verifiedProfileIdentity('account-a', 'account-b')).toThrow('Your account changed while the profile was saving.');
});