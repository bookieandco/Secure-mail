import { strict as assert } from 'node:assert';
import { authorizeStorageRequest } from '../../packages/mail-domain/storage-policy';

const policy = {
  namespaceId: 'ns-1',
  allowPublicRead: false as const,
  encryptionRequired: true as const,
  versioningRequired: true,
};

const grant = {
  namespaceId: 'ns-1',
  principalId: 'site-1',
  capabilities: ['READ', 'WRITE'] as const,
  prefix: 'public/',
  expiresAt: null,
};

const object = {
  namespaceId: 'ns-1', key: 'public/index.html', sizeBytes: 10,
  contentType: 'text/html', state: 'ACTIVE' as const, version: 'v1',
  checksumSha256: 'a'.repeat(64),
};

assert.equal(authorizeStorageRequest(policy, grant, object, {
  principalId: 'site-1', namespaceId: 'ns-1', capability: 'READ', key: 'public/index.html', now: new Date(),
}), 'ALLOW');

assert.equal(authorizeStorageRequest(policy, grant, object, {
  principalId: 'site-1', namespaceId: 'ns-1', capability: 'DELETE', key: 'public/index.html', now: new Date(),
}), 'DENY');

assert.equal(authorizeStorageRequest(policy, grant, object, {
  principalId: 'site-1', namespaceId: 'ns-1', capability: 'READ', key: 'private/secret', now: new Date(),
}), 'DENY');

assert.equal(authorizeStorageRequest(policy, { ...grant, principalId: 'other' }, object, {
  principalId: 'site-1', namespaceId: 'ns-1', capability: 'READ', key: 'public/index.html', now: new Date(),
}), 'DENY');

assert.equal(authorizeStorageRequest(policy, { ...grant, expiresAt: '2026-08-29T17:00:00.000Z' }, object, {
  principalId: 'site-1', namespaceId: 'ns-1', capability: 'READ', key: 'public/index.html', now: new Date('2026-08-29T18:00:00.000Z'),
}), 'DENY');

console.log('storage policy security tests passed');
