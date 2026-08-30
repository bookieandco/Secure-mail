import { strict as assert } from 'node:assert';
import { S3StorageProvider } from '../../packages/mail-domain/s3-storage-provider';

const calls: unknown[] = [];
const provider = new S3StorageProvider({
  bucket: 'secure-mail-objects',
  api: {
    async putObject(input) { calls.push(input); return { etag: 'etag-1', versionId: 'v1' }; },
    async getObject(input) { calls.push(input); return { body: new TextEncoder().encode('hello'), contentType: 'text/plain', etag: 'etag-1', versionId: 'v1' }; },
    async headObject(input) { calls.push(input); return { sizeBytes: 5, contentType: 'text/plain', etag: 'etag-1', versionId: 'v1' }; },
    async listObjects(input) { calls.push(input); return [{ key: 'public/a.txt', sizeBytes: 5, contentType: 'text/plain', etag: 'etag-1', versionId: 'v1' }]; },
    async deleteObject(input) { calls.push(input); },
  },
});

const body = new TextEncoder().encode('hello');
const put = await provider.put({ namespaceId: 'site-1', key: 'public/a.txt', body, contentType: 'text/plain', expectedVersionId: 'v0' });
assert.equal(put.versionId, 'v1');
assert.equal(put.encrypted, true);
assert.deepEqual(await provider.get({ namespaceId: 'site-1', key: 'public/a.txt', versionId: 'v1' }), {
  namespaceId: 'site-1', key: 'public/a.txt', sizeBytes: 5, contentType: 'text/plain', etag: 'etag-1', versionId: 'v1', encrypted: true, body,
});
assert.deepEqual(await provider.head({ namespaceId: 'site-1', key: 'public/a.txt' }), {
  namespaceId: 'site-1', key: 'public/a.txt', sizeBytes: 5, contentType: 'text/plain', etag: 'etag-1', versionId: 'v1', encrypted: true,
});
assert.equal((await provider.list({ namespaceId: 'site-1', prefix: 'public/', limit: 10 }))[0].key, 'public/a.txt');
await provider.delete({ namespaceId: 'site-1', key: 'public/a.txt', versionId: 'v1' });
assert.equal((calls[0] as { bucket: string }).bucket, 'secure-mail-objects');
assert.throws(() => new S3StorageProvider({ bucket: ' ', api: provider as never }), /bucket_required/);

console.log('S3-compatible storage provider security tests passed');
