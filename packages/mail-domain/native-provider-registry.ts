import type { NativeModuleDescriptor, NativeProviderRegistry } from '../mail-types/native-provider';

export class AllowlistedNativeProviderRegistry implements NativeProviderRegistry {
  private readonly modules = new Map<string, NativeModuleDescriptor>();

  register(module: NativeModuleDescriptor): void {
    if (!module.id.trim()) throw new Error('native_module_id_required');
    if (!module.fileName.trim() || module.fileName.includes('/') || module.fileName.includes('\\')) throw new Error('native_module_filename_invalid');
    if (!/^[a-f0-9]{64}$/i.test(module.sha256)) throw new Error('native_module_hash_invalid');
    if (this.modules.has(module.id)) throw new Error('native_module_already_registered');
    this.modules.set(module.id, module);
  }

  resolve(id: string): NativeModuleDescriptor {
    const module = this.modules.get(id);
    if (!module) throw new Error('native_module_not_allowlisted');
    return module;
  }
}
