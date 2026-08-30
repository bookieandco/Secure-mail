import type { StorageProvider } from '../mail-types/storage-provider';
import type { StorageProviderCapabilities, StorageProviderHealth } from '../mail-types/storage-provider-capabilities';
import { admitStorageProvider } from './storage-provider-admission';

export type StorageBackendState = 'REGISTERED' | 'ACTIVE' | 'DRAINING' | 'STOPPED';

export interface StorageBackendLifecycleRegistration {
  readonly provider: StorageProvider;
  readonly capabilities: StorageProviderCapabilities;
  health(): Promise<StorageProviderHealth>;
}

export class StorageBackendLifecycle {
  private state: StorageBackendState = 'REGISTERED';

  constructor(private readonly registration: StorageBackendLifecycleRegistration) {}

  getState(): StorageBackendState { return this.state; }

  async initialize(): Promise<void> {
    if (this.state !== 'REGISTERED') throw new Error('invalid_lifecycle_transition');
    const health = await this.registration.health();
    admitStorageProvider(this.registration.capabilities, health);
    this.state = 'ACTIVE';
  }

  async refreshHealth(): Promise<StorageProviderHealth> {
    if (this.state === 'STOPPED') throw new Error('backend_stopped');
    const health = await this.registration.health();
    if (this.state === 'ACTIVE' && !health.healthy) this.state = 'DRAINING';
    return health;
  }

  beginDrain(): void {
    if (this.state !== 'ACTIVE') throw new Error('invalid_lifecycle_transition');
    this.state = 'DRAINING';
  }

  stop(): void {
    if (this.state === 'STOPPED') return;
    this.state = 'STOPPED';
  }

  provider(): StorageProvider {
    if (this.state !== 'ACTIVE') throw new Error('storage_backend_not_active');
    return this.registration.provider;
  }
}
