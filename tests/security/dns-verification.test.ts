import { strict as assert } from 'node:assert';
import { createDnsTxtChallenge, verifyDnsTxtChallenge } from '../../packages/mail-domain/dns-verification';

const now = new Date('2026-08-29T18:00:00.000Z');
const challenge = createDnsTxtChallenge('domain-1', 'Example.COM.', now, 900);

assert.equal(challenge.hostname, 'example.com');
assert.equal(challenge.recordName, '_securemail.example.com');
assert.match(challenge.expectedValue, /^v=secure-mail-1; challenge=[a-f0-9]{64}$/);

assert.deepEqual(
  verifyDnsTxtChallenge(challenge, {
    recordName: '_securemail.example.com.',
    values: [challenge.expectedValue],
  }, now),
  { verified: true, reason: 'verified' },
);

assert.equal(
  verifyDnsTxtChallenge(challenge, {
    recordName: '_securemail.example.com',
    values: ['v=secure-mail-1; challenge=wrong'],
  }, now).reason,
  'value_mismatch',
);

assert.equal(
  verifyDnsTxtChallenge(challenge, {
    recordName: '_other.example.com',
    values: [challenge.expectedValue],
  }, now).reason,
  'record_name_mismatch',
);

assert.equal(
  verifyDnsTxtChallenge(challenge, {
    recordName: '_securemail.example.com',
    values: [challenge.expectedValue],
  }, new Date('2026-08-29T18:15:00.000Z')).reason,
  'expired',
);

assert.throws(() => createDnsTxtChallenge('domain-1', 'example.com', now, 30), /invalid_challenge_ttl/);

console.log('DNS TXT verification security tests passed');
