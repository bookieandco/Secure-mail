export interface NativeSandboxPolicy {
  readonly executable: string;
  readonly allowedArguments: readonly string[];
  readonly cwd: string;
  readonly env: Readonly<Record<string, string>>;
  readonly timeoutMs: number;
  readonly maxPayloadBytes: number;
  readonly network: 'DENY' | 'ALLOW';
  readonly filesystem: 'WORKDIR_ONLY' | 'READ_ONLY' | 'UNRESTRICTED';
}

export function validateNativeSandboxPolicy(policy: NativeSandboxPolicy): void {
  if (!policy.executable.trim()) throw new Error('native_sandbox_executable_required');
  if (policy.executable.includes('/') && !policy.executable.startsWith('/')) throw new Error('native_sandbox_executable_invalid');
  if (!policy.cwd.trim() || !policy.cwd.startsWith('/')) throw new Error('native_sandbox_cwd_invalid');
  if (!Number.isSafeInteger(policy.timeoutMs) || policy.timeoutMs < 1) throw new Error('native_sandbox_timeout_invalid');
  if (!Number.isSafeInteger(policy.maxPayloadBytes) || policy.maxPayloadBytes < 1) throw new Error('native_sandbox_payload_invalid');
  if (policy.network !== 'DENY' && policy.network !== 'ALLOW') throw new Error('native_sandbox_network_invalid');
  if (!['WORKDIR_ONLY', 'READ_ONLY', 'UNRESTRICTED'].includes(policy.filesystem)) throw new Error('native_sandbox_filesystem_invalid');
  if (policy.filesystem === 'UNRESTRICTED') throw new Error('native_sandbox_filesystem_policy_too_permissive');
}
