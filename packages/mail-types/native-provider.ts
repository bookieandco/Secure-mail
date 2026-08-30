export interface NativeModuleDescriptor {
  readonly id: string;
  readonly fileName: string;
  readonly sha256: string;
  readonly signature?: string;
}

export interface NativeProviderRegistry {
  resolve(id: string): NativeModuleDescriptor;
}

export interface NativeProvider<T> {
  readonly name: string;
  readonly module: NativeModuleDescriptor;
  invoke<TResult>(operation: string, input: T): Promise<TResult>;
}
