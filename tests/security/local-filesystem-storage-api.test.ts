import { strict as assert } from 'node:assert';
import { mkdtemp, rm, readFile, lstat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { LocalFilesystemStorageApi } from '../../packages/mail-infra/local-filesystem-storage-api';

const root = await mkdtemp(path.join(os.tmpdir(), 'secure-mail-storage-'));
try {
  const api = new LocalFilesystemStorageApi({ root, maxObjectBytes: 16, encryptedAtRest: true });
  const put = await api.put({ root, key: 'public/index.html', body: new TextEncoder().encode('hello'), contentType: 'text/html' });
  assert.equal(put.etag.length, 64);
  assert.equal(put.encrypted, true);
  assert.equal((await readFile(path.join(root, 'public/index.html'), 'utf8')), 'hello');
  assert.equal((await lstat(path.join(root, 'public/index.html'))).mode & 0o777, 0o600);
  await assert.rejects(api.put({ root, key: '../escape', body: new Uint8Array([1]) }), /invalid_object_key|path_escape/);
  await assert.rejects(api.put({ root, key: '/absolute', body: new Uint8Array([1]) }), /invalid_object_key/);
  await assert.rejects(api.put({ root, key: 'x\\escape', body: new Uint8Array([1]) }), /invalid_object_key/);
  await assert.rejects(api.put({ root, key: 'public/large', body: new Uint8Array(17) }), /object_too_large/);
  await assert.rejects(api.put(root === '/wrong' ? { root, key: 'x', body: new Uint8Array([1]) } : { root: `${root}-other`, key: 'x', body: new Uint8Array([1]) }), /root_mismatch/);
  await assert.rejects(api.put({ root, key: 'public/index.html', body: new Uint8Array([1]), expectedVersionId: 'stale' }), /version_conflict/);
  assert.equal((await api.list({ root, prefix: 'public/', limit: 10 })).length, 1);
  await api.delete({ root, key: 'public/index.html', versionId: put.versionId });
  await assert.rejects(api.head({ root, key: 'public/index.html' }));
} finally {
  await rm(root, { recursive: true, force: true });
}

console.log('local filesystem storage security tests passed');
