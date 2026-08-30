import { strict as assert } from 'node:assert';
import { InMemoryStorageProvider } from '../../packages/mail-domain/in-memory-storage-provider';
import { deleteObject, getObject, listObjects, putObject } from '../../packages/mail-domain/storage-service';

const now = new Date('2026-08-29T18:00:00.000Z');
const context = {
  namespace: { id: 'site-1', tenantId: 'tenant-1', name: 'website', quotaBytes: 10_000 },
  policy: { namespaceId: 'site-1', allowPublicRead: false as const, encryptionRequired: true as const, versioningRequired: true },
  grant: { namespaceId: 'site-1', principalId: 'web-1', capabilities: ['READ', 'WRITE', 'DELETE', 'LIST'] as const, prefix: 'public/', expiresAt: null },
  provider: new InMemoryStorageProvider(),
};

const body = new TextEncoder().encode('hello');
const created = await putObject(context, { namespaceId: 'site-1', key: 'public/index.html', body, contentType: 'text/html' }, now);
assert.equal(created.key, 'public/index.html');

const fetched = await getObject(context, { namespaceId: 'site-1', key: 'public/index.html' }, now);
assert.deepEqual([...fetched.body], [...body]);
assert.deepEqual((await listObjects(context, 'public/', 10, now)).map((o) => o.key), ['public/index.html']);

await assert.rejects(
  getObject(context, { namespaceId: 'site-1', key: 'private/secret.txt' }, now),
  /storage_access_denied/,
);
await assert.rejects(
  putObject({ ...context, grant: { ...context.grant, capabilities: ['READ'] as const } }, { namespaceId: 'site-1', key: 'public/write.txt', body, contentType: 'text/plain' }, now),
  /storage_access_denied/,
);
await assert.rejects(
  getObject({ ...context, grant: { ...context.grant, principalId: 'other-principal' } }, { namespaceId: 'site-1', key: 'public/index.html' }, now),
  /storage_access_denied/,
);
await assert.rejects(
  getObject({ ...context, grant: { ...context.grant, expiresAt: '2026-08-29T17:59:00.000Z' } }, { namespaceId: 'site-1', key: 'public/index.html' }, now),
  /storage_access_denied/,
);

await deleteObject(context, { namespaceId: 'site-1', key: 'public/index.html' }, now);
assert.rejects(getObject(context, { namespaceId: 'site-1', key: 'public/index.html' }, now), /object_not_found/);

console.log('storage service policy boundary tests passed');
