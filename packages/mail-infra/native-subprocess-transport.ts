import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NativeProcessRequest, NativeProcessResult, NativeProcessTransport } from './native-process-runner';
import { assertNativeResponse, DEFAULT_MAX_NATIVE_PAYLOAD_BYTES, type NativeWorkerRequest } from './native-worker-protocol';

export interface NativeSubprocessTransportOptions { readonly command: string; readonly args?: string[]; readonly cwd?: string; readonly maxPayloadBytes?: number; readonly env?: Record<string, string>; }

export class NativeSubprocessTransport implements NativeProcessTransport {
  constructor(private readonly options: NativeSubprocessTransportOptions) {}

  run<T, R>(request: NativeProcessRequest<T>): Promise<NativeProcessResult<R>> {
    const requestId = randomUUID();
    const maxPayloadBytes = this.options.maxPayloadBytes ?? DEFAULT_MAX_NATIVE_PAYLOAD_BYTES;
    const message: NativeWorkerRequest<T> = { requestId, moduleId: request.moduleId, operation: request.operation, input: request.input };
    return new Promise((resolve) => {
      const child = spawn(this.options.command, this.options.args ?? [], {
        cwd: this.options.cwd,
        env: this.options.env ?? {},
        stdio: ['pipe', 'pipe', 'ignore'],
        shell: false,
      });
      let settled = false;
      let stdout = '';
      const finish = (result: NativeProcessResult<R>) => { if (settled) return; settled = true; clearTimeout(timer); child.removeAllListeners(); child.stdout.removeAllListeners(); child.kill('SIGKILL'); resolve(result); };
      const timer = setTimeout(() => finish({ ok: false, errorCode: 'TIMEOUT' }), request.timeoutMs);
      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
        if (Buffer.byteLength(stdout) > maxPayloadBytes) finish({ ok: false, errorCode: 'PROTOCOL_ERROR' });
      });
      child.once('error', () => finish({ ok: false, errorCode: 'PROCESS_EXIT' }));
      child.once('exit', (code) => {
        if (settled) return;
        if (code !== 0) return finish({ ok: false, errorCode: 'PROCESS_EXIT' });
        try {
          const raw = JSON.parse(stdout);
          assertNativeResponse(raw, requestId, maxPayloadBytes);
          finish(raw.ok ? { ok: true, value: raw.value as R } : { ok: false, errorCode: raw.errorCode === 'PAYLOAD_TOO_LARGE' ? 'PROTOCOL_ERROR' : raw.errorCode });
        } catch { finish({ ok: false, errorCode: 'PROTOCOL_ERROR' }); }
      });
      try { child.stdin.end(JSON.stringify(message)); } catch { finish({ ok: false, errorCode: 'PROTOCOL_ERROR' }); }
    });
  }
}
