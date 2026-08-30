import type { NativeSandboxHelperRequest, NativeSandboxHelperResponse } from './native-sandbox-helper-protocol';
import { verifyNativeSandboxHelperRequest } from './native-sandbox-helper-protocol';

export interface NativeSandboxHelperPolicy {
  readonly allowedExecutables: readonly string[];
  readonly allowedRoots: readonly string[];
}

export interface NativeSandboxHelperEnforcer {
  prepare(request: NativeSandboxHelperRequest): Promise<void>;
}

export class NativeSandboxHelperDispatcher {
  constructor(private readonly secret: Buffer, private readonly policy: NativeSandboxHelperPolicy, private readonly enforcer: NativeSandboxHelperEnforcer) {}

  async dispatch(request: NativeSandboxHelperRequest): Promise<NativeSandboxHelperResponse> {
    if (request.version !== 1 || request.operation !== 'prepare') return { version: 1, requestId: request.requestId, ok: false, errorCode: 'INVALID_REQUEST' };
    if (!verifyNativeSandboxHelperRequest(request, this.secret)) return { version: 1, requestId: request.requestId, ok: false, errorCode: 'INVALID_REQUEST' };
    if (!Number.isSafeInteger(request.pid) || request.pid < 1) return { version: 1, requestId: request.requestId, ok: false, errorCode: 'INVALID_REQUEST' };
    if (!this.policy.allowedExecutables.includes(request.executable)) return { version: 1, requestId: request.requestId, ok: false, errorCode: 'INVALID_REQUEST' };
    if (!this.policy.allowedRoots.some((root) => request.cwd === root || request.cwd.startsWith(`${root}/`))) return { version: 1, requestId: request.requestId, ok: false, errorCode: 'INVALID_REQUEST' };
    if (request.network !== 'DENY' || request.seccomp !== 'REQUIRED') return { version: 1, requestId: request.requestId, ok: false, errorCode: 'INVALID_REQUEST' };
    try { await this.enforcer.prepare(request); return { version: 1, requestId: request.requestId, ok: true }; }
    catch { return { version: 1, requestId: request.requestId, ok: false, errorCode: 'ENFORCEMENT_FAILED' }; }
  }
}
