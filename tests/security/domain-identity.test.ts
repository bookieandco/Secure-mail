import { strict as assert } from 'node:assert';
import { canUseCapability, normalizeHostname, validateDomainIdentity } from '../../packages/mail-domain/domain-identity';

assert.equal(normalizeHostname(' Example.COM. '), 'example.com');
assert.equal(normalizeHostname('not a domain'), null);

const pending = {
  id: 'domain-1',
  hostname: 'Example.COM.',
  verificationMethod: 'DNS_TXT' as const,
  verificationState: 'PENDING' as const,
  verificationToken: 'opaque-token',
  webEnabled: true,
  mailEnabled: true,
};

const validated = validateDomainIdentity(pending);
assert.equal(validated.kind, 'ACCEPT');
assert.equal(canUseCapability(pending, 'web'), false);
assert.equal(canUseCapability(pending, 'mail'), false);

const verified = { ...pending, verificationState: 'VERIFIED' as const };
assert.equal(canUseCapability(verified, 'web'), true);
assert.equal(canUseCapability(verified, 'mail'), true);
assert.equal(canUseCapability({ ...verified, webEnabled: false }, 'web'), false);
assert.equal(canUseCapability({ ...verified, mailEnabled: false }, 'mail'), false);

assert.equal(validateDomainIdentity({ ...pending, hostname: 'evil/../example.com' }).kind, 'DENY');
assert.equal(validateDomainIdentity({ ...pending, verificationToken: '' }).kind, 'DENY');

console.log('domain identity security tests passed');
