export type StorageObjectState = 'ACTIVE' | 'DELETED';
export type StorageCapability = 'READ' | 'WRITE' | 'DELETE' | 'LIST';

export interface StorageNamespace {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly quotaBytes: number;
}

export interface StorageObject {
  readonly namespaceId: string;
  readonly key: string;
  readonly sizeBytes: number;
  readonly contentType: string;
  readonly state: StorageObjectState;
  readonly version: string;
  readonly checksumSha256: string;
}

export interface StorageGrant {
  readonly namespaceId: string;
  readonly principalId: string;
  readonly capabilities: readonly StorageCapability[];
  readonly prefix: string;
  readonly expiresAt: string | null;
}

export interface StoragePolicy {
  readonly namespaceId: string;
  readonly allowPublicRead: false;
  readonly encryptionRequired: true;
  readonly versioningRequired: boolean;
}
