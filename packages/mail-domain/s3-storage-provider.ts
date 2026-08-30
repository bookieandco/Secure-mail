import type { GetObjectInput, PutObjectInput, StorageObject, StorageProvider } from '../mail-types/storage-provider';

export interface S3StorageApi {
  putObject(input: { bucket: string; key: string; body: Uint8Array; contentType?: string; ifMatch?: string }): Promise<{ etag: string; versionId?: string }>;
  getObject(input: { bucket: string; key: string; versionId?: string }): Promise<{ body: Uint8Array; contentType?: string; etag: string; versionId?: string }>;
  headObject(input: { bucket: string; key: string; versionId?: string }): Promise<{ sizeBytes: number; contentType?: string; etag: string; versionId?: string }>;
  listObjects(input: { bucket: string; prefix: string; limit: number }): Promise<readonly { key: string; sizeBytes: number; contentType?: string; etag: string; versionId?: string }[]>;
  deleteObject(input: { bucket: string; key: string; versionId?: string }): Promise<void>;
}

export interface S3StorageProviderOptions {
  readonly api: S3StorageApi;
  readonly bucket: string;
}

export class S3StorageProvider implements StorageProvider {
  readonly name = 's3-compatible';

  constructor(private readonly options: S3StorageProviderOptions) {
    if (!options.bucket.trim()) throw new Error('bucket_required');
  }

  async put(input: PutObjectInput): Promise<StorageObject> {
    const result = await this.options.api.putObject({ bucket: this.options.bucket, key: input.key, body: input.body, contentType: input.contentType, ifMatch: input.expectedVersionId });
    return { namespaceId: input.namespaceId, key: input.key, sizeBytes: input.body.byteLength, contentType: input.contentType, etag: result.etag, versionId: result.versionId, encrypted: true };
  }

  async get(input: GetObjectInput): Promise<StorageObject & { readonly body: Uint8Array }> {
    const result = await this.options.api.getObject({ bucket: this.options.bucket, key: input.key, versionId: input.versionId });
    return { namespaceId: input.namespaceId, key: input.key, sizeBytes: result.body.byteLength, contentType: result.contentType, etag: result.etag, versionId: result.versionId, encrypted: true, body: new Uint8Array(result.body) };
  }

  async head(input: GetObjectInput): Promise<StorageObject> {
    const result = await this.options.api.headObject({ bucket: this.options.bucket, key: input.key, versionId: input.versionId });
    return { namespaceId: input.namespaceId, key: input.key, sizeBytes: result.sizeBytes, contentType: result.contentType, etag: result.etag, versionId: result.versionId, encrypted: true };
  }

  async list(input: { namespaceId: string; prefix: string; limit: number }): Promise<readonly StorageObject[]> {
    const results = await this.options.api.listObjects({ bucket: this.options.bucket, prefix: input.prefix, limit: input.limit });
    return results.map((result) => ({ namespaceId: input.namespaceId, key: result.key, sizeBytes: result.sizeBytes, contentType: result.contentType, etag: result.etag, versionId: result.versionId, encrypted: true }));
  }

  async delete(input: GetObjectInput): Promise<void> {
    await this.options.api.deleteObject({ bucket: this.options.bucket, key: input.key, versionId: input.versionId });
  }
}
