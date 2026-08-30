import { parentPort } from 'node:worker_threads';
import { assertNativeRequest, type NativeWorkerRequest, type NativeWorkerResponse } from './native-worker-protocol';

export type NativeWorkerHandler = (request: NativeWorkerRequest<unknown>) => Promise<unknown>;

export function startNativeWorker(handler: NativeWorkerHandler, maxPayloadBytes?: number): void {
  if (!parentPort) throw new Error('native_worker_parent_port_required');
  parentPort.on('message', async (message: unknown) => {
    let request: NativeWorkerRequest<unknown>;
    try { assertNativeRequest(message, maxPayloadBytes); request = message; }
    catch { return; }
    try {
      const value = await handler(request);
      const response: NativeWorkerResponse<unknown> = { requestId: request.requestId, ok: true, value };
      parentPort!.postMessage(response);
    } catch {
      const response: NativeWorkerResponse<unknown> = { requestId: request.requestId, ok: false, errorCode: 'PROCESS_EXIT' };
      parentPort!.postMessage(response);
    }
  });
}
