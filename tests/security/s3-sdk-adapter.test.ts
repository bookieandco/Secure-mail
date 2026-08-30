import { strict as assert } from 'node:assert';
import { S3SdkStorageApi } from '../../packages/mail-infra/s3-sdk-adapter';

const calls: { op: string; input: unknown }[] = [];
const api = new S3SdkStorageApi({
  bucket: 'secure-mail-test',
  maxObjectBytes: 8,
  client: {
    async putObject(input) { calls.push({ op: 'put', input }); return { ETag: 'etag-1', VersionId: 'v1' }; },
    async getObject(input) { calls.push({ op: 'get', input }); return { Body: new TextEncoder().encode('hello'), ContentType: 'text/plain', ETag: 'etag-1', VersionId: 'v1' }; },
    async headObject(input) { calls.push({ op: 'head', input }); return { ContentLength: 5, ContentType: 'text/plain', ETag: 'etag-1', VersionId: 'v1' }; },
    async listObjects(input) { calls.push({ op: 'list', input }); return { Contents: [{ Key: 'public/a', Size: 5, ETag: 'etag-1', VersionId: 'v1' }] }; },
    async deleteObject(input) { calls.push({ op: 'delete', input }); },
  },
});

const body = new TextEncoder().encode('hello');
assert.deepEqual(await api.putObject({ key: 'public/a', body, contentType: 'text/plain', ifMatch: 'v0' }), { etag: 'etag-1', versionId: 'v1' });
assert.deepEqual(await api.getObject({ key: 'public/a', versionId: 'v1' }), { body, contentType: 'text/plain', etag: 'etag-1', versionId: 'v1' });
assert.deepEqual(await api.headObject({ key: 'public/a', versionId: 'v1' }), { sizeBytes: 5, contentType: 'text/plain', etag: 'etag-1', versionId: 'v1' });
assert.deepEqual(await api.listObjects({ prefix: 'public/', limit: 2000 }), [{ key: 'public/a', sizeBytes: 5, etag: 'etag-1', versionId: 'v1' }]);
await api.deleteObject({ key: 'public/a', versionId: 'v1' });

assert.equal(calls.find((call) => call.op === 'put')?.input && 'credentials' in (calls.find((call) => call.op === 'put')?.input as object), false);
await assert.rejects(api.putObject({ key: 'public/large', body: new Uint8Array(9) }), /object_too_large/);
await assert.rejects(new S3SdkStorageApi({ bucket: '', maxObjectBytes: 8, client: {} as never }).putObject({ key: 'x', body: new Uint8Array() }), /bucket_required/);

console.log('S3 SDK adapter security tests passed');
