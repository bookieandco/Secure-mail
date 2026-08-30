import type { StorageProvider } from '../mail-types/storage-provider';
import type { StorageProviderCapabilities, StorageProviderHealth } from '../mail-types/storage-provider-capabilities';
import type { StorageAuditSink } from '../mail-types/storage-audit';
import { StorageBackendLifecycle } from './storage-backend-lifecycle';
import { StorageBackendRegistry } from './storage-backend-registry';

export interface StorageRuntimeBackend {
  readonly provider: StorageProvider;
  readonly capabilities: StorageProviderCapabilities;
  health(): Promise<StorageProviderHealth>;
}

export interface StorageRuntimeOptions {
  readonly audit: StorageAuditSink;
}

export class StorageRuntime {
  private readonly registry = new StorageBackendRegistry();
  private readonly lifecycles = new Map<string, StorageBackendLifecycle>();

  constructor(readonly options: StorageRuntimeOptions) {}

  async addBackend(backend: StorageRuntimeBackend): Promise<void> {
    const lifecycle = new StorageBackendLifecycle(backend);
    await lifecycle.initialize();
    const provider = lifecycle.provider();
    this.registry.register({ provider, capabilities: backend.capabilities, health: await backend.health() });
    this.lifecycles.set(provider.name, lifecycle);
  }

  async refresh(name: string): Promise<StorageProviderHealth> {
    const lifecycle = this.lifecycles.get(name);
    if (!lifecycle) throw new Error('storage_provider_not_registered');
    return lifecycle.refreshHealth();
  }

  provider(name: string): StorageProvider {
    const lifecycle = this.lifecycles.get(name);
    if (!lifecycle) throw new Error('storage_provider_not_registered');
    return lifecycle.provider();
  }

  drain(name: string): void {
    const lifecycle = this.lifecycles.get(name);
    if (!lifecycle) throw new Error('storage_provider_not_registered');
    lifecycle.beginDrain();
  }

  stop(name: string): void {
    const lifecycle = this.lifecycles.get(name);
    if (!lifecycle) throw new Error('storage_provider_not_registered');
    lifecycle.stop();
  }
}
