import { Worker } from 'node:worker_threads';
import type { NativeProcessRequest, NativeProcessResult, NativeProcessTransport } from './native-process-runner';

export interface NodeNativeProcessTransportOptions { readonly workerFile: string; }

export class NodeNativeProcessTransport implements NativeProcessTransport {
  constructor(private readonly options: NodeNativeProcessTransportOptions) {}

  run<T, R>(request: NativeProcessRequest<T>): Promise<NativeProcessResult<R>> {
    return new Promise((resolve) => {
      const worker = new Worker(this.options.workerFile);
      let settled = false;
      const finish = (result: NativeProcessResult<R>) => { if (settled) return; settled = true; clearTimeout(timer); worker.removeAllListeners(); void worker.terminate(); resolve(result); };
      const timer = setTimeout(() => finish({ ok: false, errorCode: 'TIMEOUT' }), request.timeoutMs);
      worker.once('message', (message: NativeProcessResult<R>) => finish(message));
      worker.once('error', () => finish({ ok: false, errorCode: 'PROCESS_EXIT' }));
      worker.once('exit', (code) => { if (code !== 0) finish({ ok: false, errorCode: 'PROCESS_EXIT' }); });
      worker.postMessage(request);
    });
  }
}
