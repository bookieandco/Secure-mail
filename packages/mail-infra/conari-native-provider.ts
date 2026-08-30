import type { NativeModuleDescriptor, NativeProvider, NativeProviderRegistry } from '../mail-types/native-provider';
import { verifyNativeModule, type NativeModuleVerificationOptions } from '../mail-domain/native-module-verifier';

export interface ConariLoader {
  load(modulePath: string): Promise<ConariModule>;
}

export interface ConariModule {
  invoke<TResult>(operation: string, input: unknown): Promise<TResult>;
}

export interface ConariNativeProviderOptions<T> extends NativeModuleVerificationOptions {
  readonly moduleId: string;
  readonly registry: NativeProviderRegistry;
  readonly loader: ConariLoader;
}

export async function createVerifiedConariProvider<T>(options: ConariNativeProviderOptions<T>): Promise<NativeProvider<T>> {
  const descriptor: NativeModuleDescriptor = options.registry.resolve(options.moduleId);
  const modulePath = await verifyNativeModule(descriptor, options);
  const module = await options.loader.load(modulePath);
  return {
    name: descriptor.id,
    module: descriptor,
    invoke<TResult>(operation: string, input: T): Promise<TResult> {
      if (!operation.trim()) return Promise.reject(new Error('native_operation_required'));
      return module.invoke<TResult>(operation, input);
    },
  };
}
