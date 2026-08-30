import { strict as assert } from 'node:assert';
import { InMemoryStorageProvider } from '../../packages/mail-domain/in-memory-storage-provider';
import { putObject, getObject, deleteObject } from '../../packages/mail-domain/storage-service';

const now = new Date('2026-08-29T18:00:00.000Z');
const base = {
  namespace: { id: 'site-1', quotaBytes: 10 },
  policy: { namespaceId: 'site-1', encryptionRequired: true, versioningRequired: true },
  grant: { principalId: 'user-1', namespaceId: 'site-1', prefix: 'public/', capabilities: ['READ', 'WRITE', 'DELETE', 'LIST'], expiresAt: '2026-08-29T19:00:00.000Z' },
  provider: new InMemoryStorageProvider(),
};

const body = new TextEncoder().encode('hello');
const first = await putObject(base, { namespaceId: 'site-1', key: 'public/a.txt', body, contentType: 'text/plain' }, now);
assert.equal(first.key, 'public/a.txt');

await assert.rejects(
  putObject({ ...base, grant: { ...base.grant, prefix: 'private/' } }, { namespaceId: 'site-1', key: 'public/b.txt', body, contentType: 'text/plain' }, now),
  /storage_access_denied/,
);
await assert.rejects(
  getObject({ ...base, grant: { ...base.grant, principalId: 'user-2' } }, { namespaceId: 'site-1', key: 'public/a.txt' }, now),
  /storage_access_denied/,
);
await assert.rejects(
  putObject({ ...base, grant: { ...base.grant, expiresAt: '2026-08-29T17:59:59.000Z' } }, { namespaceId: 'site-1', key: 'public/b.txt', body, contentType: 'text/plain' }, now),
  /storage_access_denied/,
);
await assert.rejects(
  putObject(base, { namespaceId: 'site-1', key: 'public/c.txt', body: new TextEncoder().encode('123456'), contentType: 'text/plain' }, now),
  /storage_quota_exceeded/,
);
await assert.rejects(
  putObject(base, { namespaceId: 'site-1', key: 'public/a.txt', body, contentType: 'text/plain', expectedVersionId: 'stale' }, now),
  /version_conflict/,
);
await assert.rejects(
  getObject({ ...base, grant: { ...base.grant, namespaceId: 'site-2' }, namespace: { ...base.namespace, id: 'site-1' } }, { namespaceId: 'site-2', key: 'public/a.txt' }, now),
  /namespace_policy_mismatch|storage_access_denied|object_not_found/,
);
await assert.rejects(
  deleteObject(base, { namespaceId: 'site-1', key: 'public/a.txt', versionId: 'stale' }, now),
  /version_conflict|object_not_found/,
);

console.log('storage service adversarial tests passed');
