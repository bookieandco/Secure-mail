import { strict as assert } from 'node:assert';
import { S3SdkStorageApi } from '../../packages/mail-infra/s3-sdk-adapter';

let headCalls = 0;
const api = new S3SdkStorageApi({
  bucket: 'secure-mail-test',
  maxObjectBytes: 8,
  client: {
    async putObject() { throw new Error('PreconditionFailed'); },
    async getObject() { return { Body: new Uint8Array(9) }; },
    async headObject() { headCalls += 1; return { ContentLength: 9 }; },
    async listObjects() { throw new Error('AccessDenied'); },
    async deleteObject() { throw new Error('AccessDenied'); },
  },
});

await assert.rejects(api.putObject({ key: 'public/a', body: new Uint8Array([1]) }), /PreconditionFailed/);
await assert.rejects(api.getObject({ key: 'public/a' }), /object_too_large/);
await assert.rejects(api.headObject({ key: 'public/a' }), /object_too_large/);
assert.equal(headCalls, 1);
await assert.rejects(api.listObjects({ prefix: 'public/', limit: 1 }), /AccessDenied/);
await assert.rejects(api.deleteObject({ key: 'public/a' }), /AccessDenied/);

console.log('S3 SDK error boundary tests passed');
