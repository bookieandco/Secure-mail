import { randomUUID } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import type { NativeProcessRequest, NativeProcessResult, NativeProcessTransport } from './native-process-runner';
import { assertNativeResponse, DEFAULT_MAX_NATIVE_PAYLOAD_BYTES, type NativeWorkerRequest, type NativeWorkerResponse } from './native-worker-protocol';

export interface NodeNativeProcessTransportOptions { readonly workerFile: string; readonly maxPayloadBytes?: number; }

export class NodeNativeProcessTransport implements NativeProcessTransport {
  constructor(private readonly options: NodeNativeProcessTransportOptions) {}

  run<T, R>(request: NativeProcessRequest<T>): Promise<NativeProcessResult<R>> {
    const requestId = randomUUID();
    const maxPayloadBytes = this.options.maxPayloadBytes ?? DEFAULT_MAX_NATIVE_PAYLOAD_BYTES;
    const message: NativeWorkerRequest<T> = { requestId, moduleId: request.moduleId, operation: request.operation, input: request.input };
    return new Promise((resolve) => {
      const worker = new Worker(this.options.workerFile);
      let settled = false;
      const finish = (result: NativeProcessResult<R>) => { if (settled) return; settled = true; clearTimeout(timer); worker.removeAllListeners(); void worker.terminate(); resolve(result); };
      const timer = setTimeout(() => finish({ ok: false, errorCode: 'TIMEOUT' }), request.timeoutMs);
      worker.once('message', (raw: unknown) => {
        try {
          assertNativeResponse(raw, requestId, maxPayloadBytes);
          const response = raw as NativeWorkerResponse<R>;
          finish(response.ok ? { ok: true, value: response.value } : { ok: false, errorCode: response.errorCode === 'PAYLOAD_TOO_LARGE' ? 'PROTOCOL_ERROR' : response.errorCode });
        } catch { finish({ ok: false, errorCode: 'PROTOCOL_ERROR' }); }
      });
      worker.once('error', () => finish({ ok: false, errorCode: 'PROCESS_EXIT' }));
      worker.once('exit', (code) => { if (code !== 0) finish({ ok: false, errorCode: 'PROCESS_EXIT' }); });
      try { worker.postMessage(message); } catch { finish({ ok: false, errorCode: 'PROTOCOL_ERROR' }); }
    });
  }
}
