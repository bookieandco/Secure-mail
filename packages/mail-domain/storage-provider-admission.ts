import type { ProductionStorageRequirements, StorageProviderCapabilities, StorageProviderHealth } from '../mail-types/storage-provider-capabilities';

export function admitStorageProvider(
  capabilities: StorageProviderCapabilities,
  requirements: ProductionStorageRequirements,
  health: StorageProviderHealth,
): void {
  if (!health.healthy) throw new Error(`provider_unhealthy:${health.reason ?? 'unknown'}`);
  if (!capabilities.encryptionAtRest) throw new Error('provider_encryption_required');
  if (requirements.versioning && !capabilities.versioning) throw new Error('provider_versioning_required');
  if (!capabilities.atomicWrites) throw new Error('provider_atomic_writes_required');
  if (!capabilities.conditionalWrites) throw new Error('provider_conditional_writes_required');
  if (!Number.isFinite(capabilities.maxObjectBytes) || capabilities.maxObjectBytes < requirements.maxObjectBytes) {
    throw new Error('provider_object_limit_insufficient');
  }
}
