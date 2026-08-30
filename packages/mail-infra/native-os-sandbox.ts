import type { NativeSandboxPolicy } from './native-sandbox-policy';
import { validateNativeSandboxPolicy } from './native-sandbox-policy';

export interface NativeSandboxLaunchSpec {
  readonly executable: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env: Readonly<Record<string, string>>;
  readonly timeoutMs: number;
  readonly maxPayloadBytes: number;
  readonly network: 'DENY' | 'ALLOW';
  readonly filesystem: 'WORKDIR_ONLY' | 'READ_ONLY';
}

export interface NativeOsSandbox {
  prepare(policy: NativeSandboxPolicy): Promise<NativeSandboxLaunchSpec>;
}

export class PortableNativeOsSandbox implements NativeOsSandbox {
  async prepare(policy: NativeSandboxPolicy): Promise<NativeSandboxLaunchSpec> {
    validateNativeSandboxPolicy(policy);
    return {
      executable: policy.executable,
      args: [...policy.allowedArguments],
      cwd: policy.cwd,
      env: { ...policy.env },
      timeoutMs: policy.timeoutMs,
      maxPayloadBytes: policy.maxPayloadBytes,
      network: policy.network,
      filesystem: policy.filesystem === 'UNRESTRICTED' ? 'READ_ONLY' : policy.filesystem,
    };
  }
}
