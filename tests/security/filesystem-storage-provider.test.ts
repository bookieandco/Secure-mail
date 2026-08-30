import { strict as assert } from 'node:assert';
import { FileSystemStorageProvider } from '../../packages/mail-domain/filesystem-storage-provider';

const calls: { op: string; root: string }[] = [];
const provider = new FileSystemStorageProvider({
  root: '/srv/secure-mail',
  api: {
    async put(input) { calls.push({ op: 'put', root: input.root }); return { namespaceId: 'site-1', key: input.key, sizeBytes: input.body.byteLength, contentType: input.contentType, etag: 'e1', versionId: 'v1', encrypted: true }; },
    async get(input) { calls.push({ op: 'get', root: input.root }); return { namespaceId: 'site-1', key: input.key, sizeBytes: 1, contentType: 'text/plain', etag: 'e1', versionId: 'v1', encrypted: true, body: new Uint8Array([1]) }; },
    async head(input) { calls.push({ op: 'head', root: input.root }); return { namespaceId: 'site-1', key: input.key, sizeBytes: 1, contentType: 'text/plain', etag: 'e1', versionId: 'v1', encrypted: true }; },
    async list(input) { calls.push({ op: 'list', root: input.root }); return []; },
    async delete(input) { calls.push({ op: 'delete', root: input.root }); },
  },
});

await provider.put({ namespaceId: 'site-1', key: 'public/a', body: new Uint8Array([1]), contentType: 'text/plain' });
await provider.get({ namespaceId: 'site-1', key: 'public/a' });
await provider.head({ namespaceId: 'site-1', key: 'public/a' });
await provider.list({ namespaceId: 'site-1', prefix: 'public/', limit: 10 });
await provider.delete({ namespaceId: 'site-1', key: 'public/a' });
assert.deepEqual(calls.map((call) => call.op), ['put', 'get', 'head', 'list', 'delete']);
assert.ok(calls.every((call) => call.root === '/srv/secure-mail'));
assert.throws(() => new FileSystemStorageProvider({ root: '', api: {} as never }), /root_required/);

console.log('filesystem storage provider contract tests passed');
