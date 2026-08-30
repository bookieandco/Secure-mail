import { strict as assert } from 'node:assert';
import { InMemoryStorageProvider } from '../../packages/mail-domain/in-memory-storage-provider';

const provider = new InMemoryStorageProvider();
const body = new TextEncoder().encode('hello');

const first = await provider.put({
  namespaceId: 'site-1', key: 'public/index.html', body, contentType: 'text/html',
});
assert.equal(first.sizeBytes, 5);
assert.equal(first.encrypted, true);

const fetched = await provider.get({ namespaceId: 'site-1', key: 'public/index.html' });
assert.deepEqual([...fetched.body], [...body]);
fetched.body[0] = 0;
const fetchedAgain = await provider.get({ namespaceId: 'site-1', key: 'public/index.html' });
assert.deepEqual([...fetchedAgain.body], [...body]);

await provider.put({ namespaceId: 'site-1', key: 'public/app.js', body: new TextEncoder().encode('app'), contentType: 'text/javascript' });
await provider.put({ namespaceId: 'site-2', key: 'public/secret.txt', body: new TextEncoder().encode('secret'), contentType: 'text/plain' });

assert.deepEqual((await provider.list({ namespaceId: 'site-1', prefix: 'public/', limit: 100 })).map((o) => o.key), [
  'public/index.html', 'public/app.js',
]);
assert.equal((await provider.list({ namespaceId: 'site-1', prefix: '', limit: 100 })).some((o) => o.namespaceId === 'site-2'), false);

assert.rejects(
  provider.get({ namespaceId: 'site-2', key: 'public/index.html' }),
  /object_not_found/,
);

const updated = await provider.put({
  namespaceId: 'site-1', key: 'public/index.html', body: new TextEncoder().encode('updated'),
  contentType: 'text/html', expectedVersionId: first.versionId,
});
assert.notEqual(updated.versionId, first.versionId);
assert.rejects(
  provider.put({ namespaceId: 'site-1', key: 'public/index.html', body, contentType: 'text/html', expectedVersionId: first.versionId }),
  /version_conflict/,
);

await provider.delete({ namespaceId: 'site-1', key: 'public/index.html', versionId: updated.versionId });
assert.rejects(provider.get({ namespaceId: 'site-1', key: 'public/index.html' }), /object_not_found/);

console.log('in-memory storage provider security tests passed');
