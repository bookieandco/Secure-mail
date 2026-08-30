import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NativeProcessRequest, NativeProcessResult, NativeProcessTransport } from './native-process-runner';
import { assertNativeResponse, DEFAULT_MAX_NATIVE_PAYLOAD_BYTES, type NativeWorkerRequest } from './native-worker-protocol';
import { validateNativeSandboxPolicy, type NativeSandboxPolicy } from './native-sandbox-policy';

export interface NativeSubprocessTransportOptions { readonly policy: NativeSandboxPolicy; }

export class NativeSubprocessTransport implements NativeProcessTransport {
  constructor(private readonly options: NativeSubprocessTransportOptions) { validateNativeSandboxPolicy(options.policy); }

  run<T, R>(request: NativeProcessRequest<T>): Promise<NativeProcessResult<R>> {
    const policy = this.options.policy;
    const requestId = randomUUID();
    const maxPayloadBytes = policy.maxPayloadBytes ?? DEFAULT_MAX_NATIVE_PAYLOAD_BYTES;
    const message: NativeWorkerRequest<T> = { requestId, moduleId: request.moduleId, operation: request.operation, input: request.input };
    return new Promise((resolve) => {
      const child = spawn(policy.executable, [...policy.allowedArguments], {
        cwd: policy.cwd,
        env: { ...policy.env },
        stdio: ['pipe', 'pipe', 'ignore'],
        shell: false,
      });
      let settled = false;
      let stdout = '';
      const finish = (result: NativeProcessResult<R>) => { if (settled) return; settled = true; clearTimeout(timer); child.removeAllListeners(); child.stdout.removeAllListeners(); child.kill('SIGKILL'); resolve(result); };
      const timer = setTimeout(() => finish({ ok: false, errorCode: 'TIMEOUT' }), Math.min(request.timeoutMs, policy.timeoutMs));
      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
        if (Buffer.byteLength(stdout) > maxPayloadBytes) finish({ ok: false, errorCode: 'PROTOCOL_ERROR' });
      });
      child.once('error', () => finish({ ok: false, errorCode: 'PROCESS_EXIT' }));
      child.once('exit', (code) => {
        if (settled) return;
        if (code !== 0) return finish({ ok: false, errorCode: 'PROCESS_EXIT' });
        try { const raw = JSON.parse(stdout); assertNativeResponse(raw, requestId, maxPayloadBytes); finish(raw.ok ? { ok: true, value: raw.value as R } : { ok: false, errorCode: raw.errorCode === 'PAYLOAD_TOO_LARGE' ? 'PROTOCOL_ERROR' : raw.errorCode }); }
        catch { finish({ ok: false, errorCode: 'PROTOCOL_ERROR' }); }
      });
      try { child.stdin.end(JSON.stringify(message)); } catch { finish({ ok: false, errorCode: 'PROTOCOL_ERROR' }); }
    });
  }
}
