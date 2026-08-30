import type { StorageProvider } from '../mail-types/storage-provider';
import type { StorageProviderCapabilities, StorageProviderHealth } from '../mail-types/storage-provider-capabilities';
import { admitStorageProvider } from './storage-provider-admission';

export interface StorageBackendRegistration {
  readonly provider: StorageProvider;
  readonly capabilities: StorageProviderCapabilities;
  readonly health: StorageProviderHealth;
}

export class StorageBackendRegistry {
  private readonly backends = new Map<string, StorageBackendRegistration>();

  register(registration: StorageBackendRegistration): void {
    const name = registration.provider.name;
    if (!name.trim()) throw new Error('provider_name_required');
    if (this.backends.has(name)) throw new Error('provider_already_registered');
    admitStorageProvider(registration.capabilities, registration.health);
    this.backends.set(name, registration);
  }

  get(name: string): StorageProvider {
    const registration = this.backends.get(name);
    if (!registration) throw new Error('storage_provider_not_registered');
    admitStorageProvider(registration.capabilities, registration.health);
    return registration.provider;
  }

  has(name: string): boolean { return this.backends.has(name); }
}
