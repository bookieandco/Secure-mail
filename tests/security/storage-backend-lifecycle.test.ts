import { strict as assert } from 'node:assert';
import { StorageBackendLifecycle } from '../../packages/mail-domain/storage-backend-lifecycle';

const provider = { name: 'test', put: async () => { throw new Error('unused'); }, get: async () => { throw new Error('unused'); }, head: async () => { throw new Error('unused'); }, list: async () => [], delete: async () => {} };
const capabilities = { encryptionAtRest: true, versioning: true, atomicWrites: true, conditionalWrites: true, maxObjectBytes: 1024 };
let healthy = true;
const lifecycle = new StorageBackendLifecycle({ provider, capabilities, health: async () => ({ healthy, checkedAt: '2026-08-29T18:00:00.000Z', latencyMs: 1 }) });
assert.equal(lifecycle.getState(), 'REGISTERED');
await lifecycle.initialize();
assert.equal(lifecycle.getState(), 'ACTIVE');
assert.equal(lifecycle.provider(), provider);
healthy = false;
await lifecycle.refreshHealth();
assert.equal(lifecycle.getState(), 'DRAINING');
assert.throws(() => lifecycle.provider(), /storage_backend_not_active/);
lifecycle.stop();
assert.equal(lifecycle.getState(), 'STOPPED');
await assert.rejects(lifecycle.refreshHealth(), /backend_stopped/);

const unhealthy = new StorageBackendLifecycle({ provider: { ...provider, name: 'bad' }, capabilities, health: async () => ({ healthy: false, checkedAt: '2026-08-29T18:00:00.000Z', latencyMs: 1 }) });
await assert.rejects(unhealthy.initialize());
assert.equal(unhealthy.getState(), 'REGISTERED');

console.log('storage backend lifecycle tests passed');
