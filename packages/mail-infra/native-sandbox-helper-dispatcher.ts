import type { NativeSandboxHelperRequest, NativeSandboxHelperResponse } from './native-sandbox-helper-protocol';
import { verifyNativeSandboxHelperRequest } from './native-sandbox-helper-protocol';
import { NativeSandboxRequestGuard, type NativeSandboxHelperLimits } from './native-sandbox-helper-guards';

export interface NativeSandboxHelperPolicy {
  readonly allowedExecutables: readonly string[];
  readonly allowedRoots: readonly string[];
}

export interface NativeSandboxHelperEnforcer {
  prepare(request: NativeSandboxHelperRequest): Promise<void>;
}

export class NativeSandboxHelperDispatcher {
  private readonly guard: NativeSandboxRequestGuard;

  constructor(private readonly secret: Buffer, private readonly policy: NativeSandboxHelperPolicy, private readonly enforcer: NativeSandboxHelperEnforcer, limits: NativeSandboxHelperLimits = { maxRequestBytes: 16 * 1024, maxArguments: 32, maxArgumentBytes: 4096, maxEnvironmentEntries: 0 }) {
    this.guard = new NativeSandboxRequestGuard(limits);
  }

  async dispatch(request: NativeSandboxHelperRequest): Promise<NativeSandboxHelperResponse> {
    const invalid = (errorCode: 'INVALID_REQUEST' | 'UNAVAILABLE' | 'ENFORCEMENT_FAILED' = 'INVALID_REQUEST') => ({ version: 1 as const, requestId: request.requestId, ok: false, errorCode });
    try {
      this.guard.validate(request);
      if (request.version !== 1 || request.operation !== 'prepare') return invalid();
      if (!verifyNativeSandboxHelperRequest(request, this.secret)) return invalid();
      if (!Number.isSafeInteger(request.pid) || request.pid < 1) return invalid();
      if (!this.policy.allowedExecutables.includes(request.executable)) return invalid();
      if (!this.policy.allowedRoots.some((root) => request.cwd === root || request.cwd.startsWith(`${root}/`))) return invalid();
      if (request.network !== 'DENY' || request.seccomp !== 'REQUIRED') return invalid();
      await this.enforcer.prepare(request);
      return { version: 1, requestId: request.requestId, ok: true };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('native_sandbox_')) return invalid();
      return invalid('ENFORCEMENT_FAILED');
    }
  }
}
