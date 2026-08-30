import type { StorageProviderCapabilities, StorageProviderHealth } from '../mail-types/storage-provider-capabilities';
import { admitStorageProvider } from './storage-provider-admission';
import type { S3StorageProvider } from './s3-storage-provider';

export interface S3ProviderAdmissionConfig {
  readonly maxObjectBytes: number;
  readonly encryptionAtRest: boolean;
  readonly versioning: boolean;
  readonly atomicWrites: boolean;
  readonly conditionalWrites: boolean;
}

export function s3Capabilities(config: S3ProviderAdmissionConfig): StorageProviderCapabilities {
  return {
    encryptionAtRest: config.encryptionAtRest,
    versioning: config.versioning,
    atomicWrites: config.atomicWrites,
    conditionalWrites: config.conditionalWrites,
    maxObjectBytes: config.maxObjectBytes,
  };
}

export function admitS3Provider(
  provider: S3StorageProvider,
  config: S3ProviderAdmissionConfig,
  health: StorageProviderHealth,
): S3StorageProvider {
  const capabilities = s3Capabilities(config);
  admitStorageProvider(capabilities, health);
  return provider;
}
