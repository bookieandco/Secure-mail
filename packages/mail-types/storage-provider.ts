export interface StorageObject {
  readonly namespaceId: string;
  readonly key: string;
  readonly sizeBytes: number;
  readonly contentType: string;
  readonly etag: string;
  readonly versionId: string | null;
  readonly encrypted: true;
}

export interface PutObjectInput {
  readonly namespaceId: string;
  readonly key: string;
  readonly body: Uint8Array;
  readonly contentType: string;
  readonly expectedVersionId?: string | null;
}

export interface GetObjectInput {
  readonly namespaceId: string;
  readonly key: string;
  readonly versionId?: string | null;
}

export interface ListObjectsInput {
  readonly namespaceId: string;
  readonly prefix: string;
  readonly limit: number;
  readonly cursor?: string | null;
}

export interface StorageProvider {
  put(input: PutObjectInput): Promise<StorageObject>;
  get(input: GetObjectInput): Promise<StorageObject & { readonly body: Uint8Array }>;
  head(input: GetObjectInput): Promise<StorageObject>;
  list(input: ListObjectsInput): Promise<readonly StorageObject[]>;
  delete(input: GetObjectInput): Promise<void>;
}
