import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { NativeModuleDescriptor, NativeProvider } from '../mail-types/native-provider';

export interface ConariLoader {
  load(modulePath: string): Promise<ConariModule>;
}

export interface ConariModule {
  invoke<TResult>(operation: string, input: unknown): Promise<TResult>;
}

export interface ConariNativeProviderOptions<T> {
  readonly descriptor: NativeModuleDescriptor;
  readonly root: string;
  readonly loader: ConariLoader;
}

export async function createVerifiedConariProvider<T>(options: ConariNativeProviderOptions<T>): Promise<NativeProvider<T>> {
  const expected = options.descriptor.sha256.toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expected)) throw new Error('native_module_hash_invalid');
  if (!options.descriptor.fileName || options.descriptor.fileName.includes('/') || options.descriptor.fileName.includes('\\')) throw new Error('native_module_filename_invalid');

  const modulePath = `${options.root.replace(/[\\/]+$/, '')}/${options.descriptor.fileName}`;
  const bytes = await readFile(modulePath);
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected) throw new Error('native_module_verification_failed');

  const module = await options.loader.load(modulePath);
  return {
    name: options.descriptor.id,
    module: options.descriptor,
    invoke<TResult>(operation: string, input: T): Promise<TResult> {
      if (!operation.trim()) return Promise.reject(new Error('native_operation_required'));
      return module.invoke<TResult>(operation, input);
    },
  };
}
