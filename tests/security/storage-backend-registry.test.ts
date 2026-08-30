import { strict as assert } from 'node:assert';
import { StorageBackendRegistry } from '../../packages/mail-domain/storage-backend-registry';

const provider = { name: 'test', put: async () => { throw new Error('unused'); }, get: async () => { throw new Error('unused'); }, head: async () => { throw new Error('unused'); }, list: async () => [], delete: async () => {} };
const capabilities = { encryptionAtRest: true, versioning: true, atomicWrites: true, conditionalWrites: true, maxObjectBytes: 1024 };
const health = { healthy: true, checkedAt: '2026-08-29T18:00:00.000Z', latencyMs: 1 };
const registry = new StorageBackendRegistry();
registry.register({ provider, capabilities, health });
assert.equal(registry.has('test'), true);
assert.equal(registry.get('test'), provider);
assert.throws(() => registry.register({ provider, capabilities, health }), /provider_already_registered/);
assert.throws(() => registry.get('missing'), /storage_provider_not_registered/);
assert.throws(() => registry.register({ provider: { ...provider, name: 'weak' }, capabilities: { ...capabilities, encryptionAtRest: false }, health }), /storage_provider_rejected|encryption/);

console.log('storage backend registry tests passed');
