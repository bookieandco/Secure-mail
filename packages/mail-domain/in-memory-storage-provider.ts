import { createHash } from 'node:crypto';
import type { GetObjectInput, ListObjectsInput, PutObjectInput, StorageObject, StorageProvider } from '../mail-types/storage-provider';
import { validateGetObject, validateListObjects, validatePutObject } from './storage-provider-validation';

type Stored = StorageObject & { readonly body: Uint8Array };

function versionFor(input: Uint8Array, previousVersion: number): string {
  return `${previousVersion + 1}-${createHash('sha256').update(input).digest('hex').slice(0, 16)}`;
}

export class InMemoryStorageProvider implements StorageProvider {
  private readonly objects = new Map<string, Stored>();
  private readonly versions = new Map<string, number>();

  async put(input: PutObjectInput): Promise<StorageObject> {
    validatePutObject(input);
    const id = `${input.namespaceId}\u0000${input.key}`;
    const current = this.objects.get(id);
    if (input.expectedVersionId !== undefined && input.expectedVersionId !== (current?.versionId ?? null)) {
      throw new Error('version_conflict');
    }

    const nextVersion = (this.versions.get(id) ?? 0) + 1;
    const body = new Uint8Array(input.body);
    const object: Stored = {
      namespaceId: input.namespaceId,
      key: input.key,
      sizeBytes: body.byteLength,
      contentType: input.contentType,
      etag: createHash('sha256').update(body).digest('hex'),
      versionId: versionFor(body, nextVersion - 1),
      encrypted: true,
      body,
    };
    this.versions.set(id, nextVersion);
    this.objects.set(id, object);
    return this.metadata(object);
  }

  async get(input: GetObjectInput): Promise<StorageObject & { readonly body: Uint8Array }> {
    validateGetObject(input);
    const object = this.objects.get(`${input.namespaceId}\u0000${input.key}`);
    if (!object || (input.versionId && input.versionId !== object.versionId)) throw new Error('object_not_found');
    return { ...this.metadata(object), body: new Uint8Array(object.body) };
  }

  async head(input: GetObjectInput): Promise<StorageObject> {
    const object = await this.get(input);
    return this.metadata(object);
  }

  async list(input: ListObjectsInput): Promise<readonly StorageObject[]> {
    validateListObjects(input);
    return [...this.objects.values()]
      .filter((object) => object.namespaceId === input.namespaceId && object.key.startsWith(input.prefix))
      .slice(0, input.limit)
      .map((object) => this.metadata(object));
  }

  async delete(input: GetObjectInput): Promise<void> {
    validateGetObject(input);
    const id = `${input.namespaceId}\u0000${input.key}`;
    const object = this.objects.get(id);
    if (!object || (input.versionId && input.versionId !== object.versionId)) throw new Error('object_not_found');
    this.objects.delete(id);
  }

  private metadata(object: Stored): StorageObject {
    const { body: _body, ...metadata } = object;
    return metadata;
  }
}
