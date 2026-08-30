import { strict as assert } from 'node:assert';
import { createDnsTxtChallenge } from '../../packages/mail-domain/dns-verification';
import { verifyDomain } from '../../packages/mail-domain/dns-verification-service';
import { StaticDnsObservationProvider } from '../../packages/mail-domain/dns-observation';

const now = new Date('2026-08-29T18:00:00.000Z');
const identity = {
  id: 'domain-1', hostname: 'example.com', verificationMethod: 'DNS_TXT' as const,
  verificationState: 'PENDING' as const, verificationToken: 'opaque', webEnabled: true, mailEnabled: true,
};
const challenge = createDnsTxtChallenge(identity.id, identity.hostname, now);
const provider = new StaticDnsObservationProvider(new Map([[challenge.recordName, {
  recordName: challenge.recordName, values: [challenge.expectedValue],
}]]));

const outcome = await verifyDomain(identity, challenge, provider, now);
assert.equal(outcome.result.verified, true);
assert.equal(outcome.identity.verificationState, 'VERIFIED');
assert.equal(outcome.auditEvent.type, 'DOMAIN_VERIFICATION_ATTEMPTED');
assert.equal(outcome.auditEvent.provider, 'static-test');

const mismatched = await verifyDomain(
  identity,
  { ...challenge, domainId: 'other-domain' },
  provider,
  now,
).catch((error: Error) => error);
assert.equal(mismatched instanceof Error, true);
assert.equal((mismatched as Error).message, 'challenge_domain_mismatch');

console.log('DNS verification service security tests passed');
