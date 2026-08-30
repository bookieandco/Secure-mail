import { strict as assert } from 'node:assert';
import { StorageRuntime } from '../../packages/mail-domain/storage-runtime';

const provider = { name: 'test', put: async () => { throw new Error('unused'); }, get: async () => { throw new Error('unused'); }, head: async () => { throw new Error('unused'); }, list: async () => [], delete: async () => {} };
const capabilities = { encryptionAtRest: true, versioning: true, atomicWrites: true, conditionalWrites: true, maxObjectBytes: 1024 };
const audit = { append: async () => {} };
let healthy = true;
const runtime = new StorageRuntime({ audit });
await runtime.addBackend({ provider, capabilities, health: async () => ({ healthy, checkedAt: '2026-08-29T18:00:00.000Z', latencyMs: 1 }) });
assert.equal(runtime.provider('test'), provider);
healthy = false;
await runtime.refresh('test');
assert.throws(() => runtime.provider('test'), /storage_backend_not_active/);
runtime.stop('test');
assert.throws(() => runtime.provider('test'), /storage_backend_not_active/);
assert.throws(() => runtime.provider('missing'), /storage_provider_not_registered/);

console.log('storage runtime tests passed');
