import type { StorageCapability, StorageGrant, StorageObject, StoragePolicy } from '../mail-types/storage';

export interface StorageRequest {
  readonly principalId: string;
  readonly namespaceId: string;
  readonly capability: StorageCapability;
  readonly key: string;
  readonly now: Date;
}

export type StorageDecision = 'ALLOW' | 'DENY';

export function authorizeStorageRequest(
  policy: StoragePolicy,
  grant: StorageGrant,
  object: StorageObject | null,
  request: StorageRequest,
): StorageDecision {
  if (request.namespaceId !== policy.namespaceId || grant.namespaceId !== policy.namespaceId) return 'DENY';
  if (request.principalId !== grant.principalId) return 'DENY';
  if (!grant.capabilities.includes(request.capability)) return 'DENY';
  if (!request.key.startsWith(grant.prefix)) return 'DENY';
  if (grant.expiresAt !== null && request.now.getTime() >= Date.parse(grant.expiresAt)) return 'DENY';

  if (object?.state === 'DELETED' && request.capability !== 'WRITE') return 'DENY';
  if (request.capability === 'READ' && object === null) return 'DENY';
  if (request.capability === 'DELETE' && object === null) return 'DENY';

  return 'ALLOW';
}
