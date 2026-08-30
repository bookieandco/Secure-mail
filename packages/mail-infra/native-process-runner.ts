export interface NativeProcessRequest<T> {
  readonly moduleId: string;
  readonly operation: string;
  readonly input: T;
  readonly timeoutMs: number;
}

export interface NativeProcessResult<R> {
  readonly ok: boolean;
  readonly value?: R;
  readonly errorCode?: 'TIMEOUT' | 'PROCESS_EXIT' | 'PROTOCOL_ERROR';
}

export interface NativeProcessTransport {
  run<T, R>(request: NativeProcessRequest<T>): Promise<NativeProcessResult<R>>;
}

export class IsolatedNativeProcessRunner {
  constructor(private readonly transport: NativeProcessTransport) {}

  async invoke<T, R>(request: NativeProcessRequest<T>): Promise<R> {
    if (!request.moduleId.trim()) throw new Error('native_module_id_required');
    if (!request.operation.trim()) throw new Error('native_operation_required');
    if (!Number.isSafeInteger(request.timeoutMs) || request.timeoutMs < 1) throw new Error('native_timeout_invalid');
    const result = await this.transport.run<T, R>(request);
    if (!result.ok) throw new Error(`native_process_${result.errorCode?.toLowerCase() ?? 'failed'}`);
    if (!('value' in result)) throw new Error('native_process_protocol_error');
    return result.value as R;
  }
}
