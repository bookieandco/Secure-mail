import type { NativeSandboxHelperRequest } from './native-sandbox-helper-protocol';

export interface NativeSandboxHelperLimits {
  readonly maxRequestBytes: number;
  readonly maxArguments: number;
  readonly maxArgumentBytes: number;
  readonly maxEnvironmentEntries: number;
}

export class NativeSandboxRequestGuard {
  private readonly seen = new Set<string>();
  constructor(private readonly limits: NativeSandboxHelperLimits) {}

  validate(request: NativeSandboxHelperRequest): void {
    const bytes = Buffer.byteLength(JSON.stringify(request), 'utf8');
    if (!Number.isSafeInteger(bytes) || bytes > this.limits.maxRequestBytes) throw new Error('native_sandbox_request_too_large');
    if (this.seen.has(request.requestId)) throw new Error('native_sandbox_request_replay');
    if (request.args.length > this.limits.maxArguments) throw new Error('native_sandbox_argument_count_exceeded');
    if (request.args.some((arg) => Buffer.byteLength(arg, 'utf8') > this.limits.maxArgumentBytes)) throw new Error('native_sandbox_argument_too_large');
    this.seen.add(request.requestId);
  }
}
