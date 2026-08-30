export interface StorageProviderCapabilities {
  readonly provider: string;
  readonly encryptionAtRest: boolean;
  readonly versioning: boolean;
  readonly atomicWrites: boolean;
  readonly conditionalWrites: boolean;
  readonly maxObjectBytes: number;
}

export interface StorageProviderHealth {
  readonly healthy: boolean;
  readonly checkedAt: string;
  readonly latencyMs: number | null;
  readonly reason?: string;
}

export interface ProductionStorageRequirements {
  readonly encryptionAtRest: true;
  readonly versioning: boolean;
  readonly atomicWrites: true;
  readonly conditionalWrites: true;
  readonly maxObjectBytes: number;
}
