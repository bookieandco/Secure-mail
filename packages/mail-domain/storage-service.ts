import type { StorageGrant, StorageNamespace, StoragePolicy } from '../mail-types/storage';
import type { GetObjectInput, PutObjectInput, StorageObject as ProviderObject } from '../mail-types/storage-provider';
import type { StorageAuditAction, StorageAuditReason, StorageAuditSink } from '../mail-types/storage-audit';
import { authorizeStorageRequest } from './storage-policy';
import { assertQuotaForWrite, assertVersioningDelete, assertVersioningWrite } from './storage-service-guards';
import { StorageRuntime } from './storage-runtime';

export interface StorageServiceContext {
  readonly namespace: StorageNamespace;
  readonly policy: StoragePolicy;
  readonly grant: StorageGrant;
  readonly runtime: StorageRuntime;
  readonly backend: string;
  readonly audit: StorageAuditSink;
}

function policyObject(object: ProviderObject) {
  return { namespaceId: object.namespaceId, key: object.key, sizeBytes: object.sizeBytes, contentType: object.contentType, state: 'ACTIVE' as const, version: object.versionId ?? object.etag, checksumSha256: object.etag };
}

function reasonForError(error: unknown): StorageAuditReason {
  if (!(error instanceof Error)) return 'INTERNAL_ERROR';
  if (error.message === 'storage_quota_exceeded') return 'QUOTA_EXCEEDED';
  if (error.message === 'version_conflict') return 'VERSION_CONFLICT';
  if (error.message === 'object_not_found') return 'NOT_FOUND';
  if (error.message === 'storage_access_denied' || error.message === 'namespace_policy_mismatch') return 'ACCESS_DENIED';
  if (error.message.endsWith('_required') || error.message.includes('invalid') || error.message === 'namespace_mismatch') return 'INVALID_REQUEST';
  return 'INTERNAL_ERROR';
}

async function audit(context: StorageServiceContext, action: StorageAuditAction, key: string | null, requestId: string, decision: 'ALLOW' | 'DENY', reason: StorageAuditReason, now: Date): Promise<void> {
  await context.audit.append({ id: `${requestId}:${action}:${decision}`, requestId, actorId: context.grant.principalId, namespaceId: context.namespace.id, action, key, decision, reason, occurredAt: now.toISOString() });
}

function assertAuthorized(context: StorageServiceContext, capability: 'READ' | 'WRITE' | 'DELETE' | 'LIST', key: string, object: ProviderObject | null, now: Date): void {
  if (context.namespace.id !== context.policy.namespaceId || context.namespace.id !== context.grant.namespaceId) throw new Error('namespace_policy_mismatch');
  if (!context.policy.encryptionRequired) throw new Error('encryption_policy_required');
  const decision = authorizeStorageRequest(context.policy, context.grant, object ? policyObject(object) : null, { principalId: context.grant.principalId, namespaceId: context.namespace.id, capability, key, now });
  if (decision !== 'ALLOW') throw new Error('storage_access_denied');
}

export async function putObject(context: StorageServiceContext, input: PutObjectInput, now: Date, requestId: string): Promise<ProviderObject> {
  try {
    if (input.namespaceId !== context.namespace.id) throw new Error('namespace_mismatch');
    let current: ProviderObject | null = null;
    try { current = await context.runtime.head(context.backend, input); } catch (error) { if (!(error instanceof Error) || error.message !== 'object_not_found') throw error; }
    assertAuthorized(context, 'WRITE', input.key, current, now);
    assertVersioningWrite(context.policy, current, input);
    assertQuotaForWrite(context.namespace, current, input);
    const object = await context.runtime.put(context.backend, input);
    await audit(context, 'PUT', input.key, requestId, 'ALLOW', 'AUTHORIZED', now);
    return object;
  } catch (error) { await audit(context, 'PUT', input.key, requestId, 'DENY', reasonForError(error), now); throw error; }
}

export async function getObject(context: StorageServiceContext, input: GetObjectInput, now: Date, requestId: string): Promise<ProviderObject & { readonly body: Uint8Array }> {
  try {
    if (input.namespaceId !== context.namespace.id) throw new Error('namespace_mismatch');
    const object = await context.runtime.head(context.backend, input);
    assertAuthorized(context, 'READ', input.key, object, now);
    const result = await context.runtime.get(context.backend, input);
    await audit(context, 'GET', input.key, requestId, 'ALLOW', 'AUTHORIZED', now);
    return result;
  } catch (error) { await audit(context, 'GET', input.key, requestId, 'DENY', reasonForError(error), now); throw error; }
}

export async function deleteObject(context: StorageServiceContext, input: GetObjectInput, now: Date, requestId: string): Promise<void> {
  try {
    if (input.namespaceId !== context.namespace.id) throw new Error('namespace_mismatch');
    const object = await context.runtime.head(context.backend, input);
    assertAuthorized(context, 'DELETE', input.key, object, now);
    assertVersioningDelete(context.policy, object, input);
    await context.runtime.delete(context.backend, input);
    await audit(context, 'DELETE', input.key, requestId, 'ALLOW', 'AUTHORIZED', now);
  } catch (error) { await audit(context, 'DELETE', input.key, requestId, 'DENY', reasonForError(error), now); throw error; }
}

export async function listObjects(context: StorageServiceContext, prefix: string, limit: number, now: Date, requestId: string): Promise<readonly ProviderObject[]> {
  try {
    if (context.namespace.id !== context.policy.namespaceId || context.namespace.id !== context.grant.namespaceId) throw new Error('namespace_policy_mismatch');
    assertAuthorized(context, 'LIST', prefix, null, now);
    const objects = await context.runtime.list(context.backend, { namespaceId: context.namespace.id, prefix, limit });
    await audit(context, 'LIST', prefix, requestId, 'ALLOW', 'AUTHORIZED', now);
    return objects;
  } catch (error) { await audit(context, 'LIST', prefix, requestId, 'DENY', reasonForError(error), now); throw error; }
}
