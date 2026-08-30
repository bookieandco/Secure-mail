import type { GetObjectInput, ListObjectsInput, PutObjectInput } from '../mail-types/storage-provider';

const KEY = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[\u0021-\u007e]{1,1024}$/;

export function validateObjectKey(key: string): boolean {
  return KEY.test(key);
}

export function validatePutObject(input: PutObjectInput): void {
  if (!input.namespaceId) throw new Error('namespace_id_required');
  if (!validateObjectKey(input.key)) throw new Error('invalid_object_key');
  if (!(input.body instanceof Uint8Array)) throw new Error('invalid_object_body');
  if (!input.contentType || input.contentType.length > 255) throw new Error('invalid_content_type');
}

export function validateGetObject(input: GetObjectInput): void {
  if (!input.namespaceId) throw new Error('namespace_id_required');
  if (!validateObjectKey(input.key)) throw new Error('invalid_object_key');
}

export function validateListObjects(input: ListObjectsInput): void {
  if (!input.namespaceId) throw new Error('namespace_id_required');
  if (!validateObjectKey(input.prefix) && input.prefix !== '') throw new Error('invalid_prefix');
  if (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 1000) {
    throw new Error('invalid_list_limit');
  }
}
