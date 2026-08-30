import { strict as assert } from 'node:assert';
import { admitStorageProvider } from '../../packages/mail-domain/storage-provider-admission';
import type { ProductionStorageRequirements, StorageProviderCapabilities, StorageProviderHealth } from '../../packages/mail-types/storage-provider-capabilities';

const requirements: ProductionStorageRequirements = {
  encryptionAtRest: true, versioning: true, atomicWrites: true, conditionalWrites: true, maxObjectBytes: 10_000_000,
};
const good: StorageProviderCapabilities = {
  provider: 'reference', encryptionAtRest: true, versioning: true, atomicWrites: true, conditionalWrites: true, maxObjectBytes: 20_000_000,
};
const healthy: StorageProviderHealth = { healthy: true, checkedAt: '2026-08-29T18:00:00.000Z', latencyMs: 2 };

assert.doesNotThrow(() => admitStorageProvider(good, requirements, healthy));
for (const [field, message] of [
  ['encryptionAtRest', 'provider_encryption_required'],
  ['versioning', 'provider_versioning_required'],
  ['atomicWrites', 'provider_atomic_writes_required'],
  ['conditionalWrites', 'provider_conditional_writes_required'],
] as const) {
  const capabilities = { ...good, [field]: false } as StorageProviderCapabilities;
  assert.throws(() => admitStorageProvider(capabilities, requirements, healthy), new RegExp(message));
}
assert.throws(() => admitStorageProvider(good, requirements, { ...healthy, healthy: false, reason: 'backend_unreachable' }), /provider_unhealthy/);
assert.throws(() => admitStorageProvider({ ...good, maxObjectBytes: 1 }, requirements, healthy), /provider_object_limit_insufficient/);

console.log('storage provider admission tests passed');
