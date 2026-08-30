import type { S3StorageApi } from '../mail-domain/s3-storage-provider';

export interface S3SdkClient {
  putObject(input: { Bucket: string; Key: string; Body: Uint8Array; ContentType?: string; IfMatch?: string }): Promise<{ ETag?: string; VersionId?: string }>;
  getObject(input: { Bucket: string; Key: string; VersionId?: string }): Promise<{ Body: Uint8Array; ContentType?: string; ETag?: string; VersionId?: string }>;
  headObject(input: { Bucket: string; Key: string; VersionId?: string }): Promise<{ ContentLength?: number; ContentType?: string; ETag?: string; VersionId?: string }>;
  listObjects(input: { Bucket: string; Prefix: string; MaxKeys: number }): Promise<{ Contents?: readonly { Key?: string; Size?: number; ContentType?: string; ETag?: string; VersionId?: string }[] }>;
  deleteObject(input: { Bucket: string; Key: string; VersionId?: string }): Promise<void>;
}

export interface S3SdkAdapterOptions {
  readonly client: S3SdkClient;
  readonly bucket: string;
  readonly maxObjectBytes: number;
}

export class S3SdkStorageApi implements S3StorageApi {
  constructor(private readonly options: S3SdkAdapterOptions) {
    if (!options.bucket.trim()) throw new Error('bucket_required');
    if (!Number.isSafeInteger(options.maxObjectBytes) || options.maxObjectBytes <= 0) throw new Error('invalid_max_object_bytes');
  }

  async putObject(input: Parameters<S3StorageApi['putObject']>[0]) {
    if (input.body.byteLength > this.options.maxObjectBytes) throw new Error('object_too_large');
    const result = await this.options.client.putObject({ Bucket: this.options.bucket, Key: input.key, Body: input.body, ContentType: input.contentType, IfMatch: input.ifMatch });
    return { etag: result.ETag ?? '', versionId: result.VersionId };
  }

  async getObject(input: Parameters<S3StorageApi['getObject']>[0]) {
    const result = await this.options.client.getObject({ Bucket: this.options.bucket, Key: input.key, VersionId: input.versionId });
    if (result.Body.byteLength > this.options.maxObjectBytes) throw new Error('object_too_large');
    return { body: new Uint8Array(result.Body), contentType: result.ContentType, etag: result.ETag ?? '', versionId: result.VersionId };
  }

  async headObject(input: Parameters<S3StorageApi['headObject']>[0]) {
    const sizeBytes = resultSize(await this.options.client.headObject({ Bucket: this.options.bucket, Key: input.key, VersionId: input.versionId }));
    if (sizeBytes > this.options.maxObjectBytes) throw new Error('object_too_large');
    const result = await this.options.client.headObject({ Bucket: this.options.bucket, Key: input.key, VersionId: input.versionId });
    return { sizeBytes, contentType: result.ContentType, etag: result.ETag ?? '', versionId: result.VersionId };
  }

  async listObjects(input: Parameters<S3StorageApi['listObjects']>[0]) {
    if (!Number.isSafeInteger(input.limit) || input.limit < 1) throw new Error('invalid_limit');
    const result = await this.options.client.listObjects({ Bucket: this.options.bucket, Prefix: input.prefix, MaxKeys: Math.min(input.limit, 1000) });
    return (result.Contents ?? []).filter((item): item is Required<Pick<typeof item, 'Key'>> & typeof item => Boolean(item.Key)).map((item) => ({ key: item.Key, sizeBytes: item.Size ?? 0, contentType: item.ContentType, etag: item.ETag ?? '', versionId: item.VersionId }));
  }

  async deleteObject(input: Parameters<S3StorageApi['deleteObject']>[0]) {
    await this.options.client.deleteObject({ Bucket: this.options.bucket, Key: input.key, VersionId: input.versionId });
  }
}

function resultSize(result: { ContentLength?: number }): number {
  const size = result.ContentLength ?? 0;
  if (!Number.isSafeInteger(size) || size < 0) throw new Error('invalid_object_size');
  return size;
}
