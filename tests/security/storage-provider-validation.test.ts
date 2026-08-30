import { strict as assert } from 'node:assert';
import { validateGetObject, validateListObjects, validateObjectKey, validatePutObject } from '../../packages/mail-domain/storage-provider-validation';

assert.equal(validateObjectKey('public/index.html'), true);
assert.equal(validateObjectKey('../mail/secrets'), false);
assert.equal(validateObjectKey('/absolute/path'), false);

assert.doesNotThrow(() => validatePutObject({
  namespaceId: 'site-1', key: 'public/index.html', body: new Uint8Array([1, 2]), contentType: 'text/html',
}));
assert.throws(() => validatePutObject({
  namespaceId: 'site-1', key: '../mail/secrets', body: new Uint8Array(), contentType: 'text/plain',
}), /invalid_object_key/);

assert.doesNotThrow(() => validateGetObject({ namespaceId: 'site-1', key: 'public/index.html' }));
assert.throws(() => validateGetObject({ namespaceId: 'site-1', key: '/etc/passwd' }), /invalid_object_key/);

assert.doesNotThrow(() => validateListObjects({ namespaceId: 'site-1', prefix: 'public/', limit: 100 }));
assert.throws(() => validateListObjects({ namespaceId: 'site-1', prefix: '', limit: 1001 }), /invalid_list_limit/);

console.log('storage provider validation security tests passed');
