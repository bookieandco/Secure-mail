import type { GetObjectInput, ListObjectsInput, PutObjectInput, StorageObject, StorageProvider } from '../mail-types/storage-provider';

export interface FileSystemStorageApi {
  put(input: { root: string; key: string; body: Uint8Array; contentType?: string; expectedVersionId?: string | null }): Promise<StorageObject>;
  get(input: { root: string; key: string; versionId?: string }): Promise<StorageObject & { readonly body: Uint8Array }>;
  head(input: { root: string; key: string; versionId?: string }): Promise<StorageObject>;
  list(input: { root: string; prefix: string; limit: number }): Promise<readonly StorageObject[]>;
  delete(input: { root: string; key: string; versionId?: string }): Promise<void>;
}

export interface FileSystemStorageProviderOptions {
  readonly api: FileSystemStorageApi;
  readonly root: string;
}

export class FileSystemStorageProvider implements StorageProvider {
  readonly name = 'filesystem';

  constructor(private readonly options: FileSystemStorageProviderOptions) {
    if (!options.root.trim()) throw new Error('root_required');
  }

  put(input: PutObjectInput): Promise<StorageObject> {
    return this.options.api.put({ root: this.options.root, key: input.key, body: input.body, contentType: input.contentType, expectedVersionId: input.expectedVersionId });
  }

  get(input: GetObjectInput): Promise<StorageObject & { readonly body: Uint8Array }> {
    return this.options.api.get({ root: this.options.root, key: input.key, versionId: input.versionId });
  }

  head(input: GetObjectInput): Promise<StorageObject> {
    return this.options.api.head({ root: this.options.root, key: input.key, versionId: input.versionId });
  }

  list(input: ListObjectsInput): Promise<readonly StorageObject[]> {
    return this.options.api.list({ root: this.options.root, prefix: input.prefix, limit: input.limit });
  }

  delete(input: GetObjectInput): Promise<void> {
    return this.options.api.delete({ root: this.options.root, key: input.key, versionId: input.versionId });
  }
}
