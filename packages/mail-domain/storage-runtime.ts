import type { GetObjectInput, ListObjectsInput, PutObjectInput, StorageObject, StorageProvider } from '../mail-types/storage-provider';
import type { StorageProviderCapabilities, StorageProviderHealth } from '../mail-types/storage-provider-capabilities';
import type { StorageAuditSink } from '../mail-types/storage-audit';
import { StorageBackendLifecycle } from './storage-backend-lifecycle';
import { StorageBackendRegistry } from './storage-backend-registry';

export interface StorageRuntimeBackend {
  readonly provider: StorageProvider;
  readonly capabilities: StorageProviderCapabilities;
  health(): Promise<StorageProviderHealth>;
}

export interface StorageRuntimeOptions { readonly audit: StorageAuditSink; }

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
    const lifecycle = this.lifecycle(name);
    return lifecycle.refreshHealth();
  }

  drain(name: string): void { this.lifecycle(name).beginDrain(); }
  stop(name: string): void { this.lifecycle(name).stop(); }

  async put(name: string, input: PutObjectInput): Promise<StorageObject> { return this.active(name).put(input); }
  async get(name: string, input: GetObjectInput): Promise<StorageObject & { readonly body: Uint8Array }> { return this.active(name).get(input); }
  async head(name: string, input: GetObjectInput): Promise<StorageObject> { return this.active(name).head(input); }
  async list(name: string, input: ListObjectsInput): Promise<readonly StorageObject[]> { return this.active(name).list(input); }
  async delete(name: string, input: GetObjectInput): Promise<void> { return this.active(name).delete(input); }

  private active(name: string): StorageProvider {
    const lifecycle = this.lifecycle(name);
    const provider = lifecycle.provider();
    if (this.registry.get(name) !== provider) throw new Error('storage_provider_registry_mismatch');
    return provider;
  }

  private lifecycle(name: string): StorageBackendLifecycle {
    const lifecycle = this.lifecycles.get(name);
    if (!lifecycle) throw new Error('storage_provider_not_registered');
    return lifecycle;
  }
}
