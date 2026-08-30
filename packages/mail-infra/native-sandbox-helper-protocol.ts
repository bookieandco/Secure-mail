import { createHmac, timingSafeEqual } from 'node:crypto';

export interface NativeSandboxHelperRequest {
  readonly version: 1;
  readonly requestId: string;
  readonly operation: 'prepare';
  readonly executable: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly pid: number;
  readonly cpuMs: number;
  readonly memoryBytes: number;
  readonly pids: number;
  readonly network: 'DENY';
  readonly filesystem: 'WORKDIR_ONLY' | 'READ_ONLY';
  readonly seccomp: 'REQUIRED';
  readonly mac: string;
}

export interface NativeSandboxHelperResponse {
  readonly version: 1;
  readonly requestId: string;
  readonly ok: boolean;
  readonly errorCode?: 'INVALID_REQUEST' | 'UNAVAILABLE' | 'ENFORCEMENT_FAILED';
}

function canonical(request: Omit<NativeSandboxHelperRequest, 'mac'>): string {
  return JSON.stringify(request);
}

export function signNativeSandboxHelperRequest(request: Omit<NativeSandboxHelperRequest, 'mac'>, secret: Buffer): string {
  return createHmac('sha256', secret).update(canonical(request)).digest('hex');
}

export function verifyNativeSandboxHelperRequest(request: NativeSandboxHelperRequest, secret: Buffer): boolean {
  const expected = Buffer.from(signNativeSandboxHelperRequest({ ...request, mac: undefined as never }, secret), 'hex');
  const actual = Buffer.from(request.mac, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
