import type { StorageNamespace, StoragePolicy } from '../mail-types/storage';
import type { GetObjectInput, PutObjectInput, StorageObject } from '../mail-types/storage-provider';

export function assertVersioningWrite(policy: StoragePolicy, current: StorageObject | null, input: PutObjectInput): void {
  if (!policy.versioningRequired) return;
  if (current === null) {
    if (input.expectedVersionId !== undefined && input.expectedVersionId !== null) throw new Error('version_conflict');
    return;
  }
  if (input.expectedVersionId !== current.versionId) throw new Error('version_conflict');
}

export function assertVersioningDelete(policy: StoragePolicy, current: StorageObject, input: GetObjectInput): void {
  if (!policy.versioningRequired) return;
  if (input.versionId !== current.versionId) throw new Error('version_conflict');
}

export function assertQuotaForWrite(namespace: StorageNamespace, current: StorageObject | null, input: PutObjectInput): void {
  const currentBytes = current?.sizeBytes ?? 0;
  const projected = namespace.quotaBytes - currentBytes + input.body.byteLength;
  if (projected > namespace.quotaBytes) throw new Error('storage_quota_exceeded');
}
