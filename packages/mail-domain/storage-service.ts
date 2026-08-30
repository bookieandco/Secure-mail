import type { StorageGrant, StorageNamespace, StoragePolicy } from '../mail-types/storage';
import type { GetObjectInput, PutObjectInput, StorageObject as ProviderObject, StorageProvider } from '../mail-types/storage-provider';
import { authorizeStorageRequest } from './storage-policy';
import { assertQuotaForWrite, assertVersioningDelete, assertVersioningWrite } from './storage-service-guards';

export interface StorageServiceContext {
  readonly namespace: StorageNamespace;
  readonly policy: StoragePolicy;
  readonly grant: StorageGrant;
  readonly provider: StorageProvider;
}

function policyObject(object: ProviderObject) {
  return { namespaceId: object.namespaceId, key: object.key, sizeBytes: object.sizeBytes, contentType: object.contentType, state: 'ACTIVE' as const, version: object.versionId ?? object.etag, checksumSha256: object.etag };
}

function assertAuthorized(context: StorageServiceContext, capability: 'READ' | 'WRITE' | 'DELETE' | 'LIST', key: string, object: ProviderObject | null, now: Date): void {
  if (context.namespace.id !== context.policy.namespaceId || context.namespace.id !== context.grant.namespaceId) throw new Error('namespace_policy_mismatch');
  if (!context.policy.encryptionRequired) throw new Error('encryption_policy_required');
  const decision = authorizeStorageRequest(context.policy, context.grant, object ? policyObject(object) : null, { principalId: context.grant.principalId, namespaceId: context.namespace.id, capability, key, now });
  if (decision !== 'ALLOW') throw new Error('storage_access_denied');
}

export async function putObject(context: StorageServiceContext, input: PutObjectInput, now: Date): Promise<ProviderObject> {
  if (input.namespaceId !== context.namespace.id) throw new Error('namespace_mismatch');
  let current: ProviderObject | null = null;
  try { current = await context.provider.head(input); } catch (error) { if (!(error instanceof Error) || error.message !== 'object_not_found') throw error; }
  assertAuthorized(context, 'WRITE', input.key, current, now);
  assertVersioningWrite(context.policy, current, input);
  assertQuotaForWrite(context.namespace, current, input);
  return context.provider.put(input);
}

export async function getObject(context: StorageServiceContext, input: GetObjectInput, now: Date): Promise<ProviderObject & { readonly body: Uint8Array }> {
  if (input.namespaceId !== context.namespace.id) throw new Error('namespace_mismatch');
  const object = await context.provider.head(input);
  assertAuthorized(context, 'READ', input.key, object, now);
  return context.provider.get(input);
}

export async function deleteObject(context: StorageServiceContext, input: GetObjectInput, now: Date): Promise<void> {
  if (input.namespaceId !== context.namespace.id) throw new Error('namespace_mismatch');
  const object = await context.provider.head(input);
  assertAuthorized(context, 'DELETE', input.key, object, now);
  assertVersioningDelete(context.policy, object, input);
  await context.provider.delete(input);
}

export async function listObjects(context: StorageServiceContext, prefix: string, limit: number, now: Date): Promise<readonly ProviderObject[]> {
  if (context.namespace.id !== context.policy.namespaceId || context.namespace.id !== context.grant.namespaceId) throw new Error('namespace_policy_mismatch');
  assertAuthorized(context, 'LIST', prefix, null, now);
  return context.provider.list({ namespaceId: context.namespace.id, prefix, limit });
}
