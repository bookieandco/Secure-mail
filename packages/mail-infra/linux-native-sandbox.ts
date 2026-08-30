import type { NativeSandboxPolicy } from './native-sandbox-policy';
import type { NativeOsSandbox, NativeSandboxLaunchSpec } from './native-os-sandbox';
import { validateNativeSandboxPolicy } from './native-sandbox-policy';

export interface LinuxSandboxLauncher extends NativeOsSandbox {
  prepare(policy: NativeSandboxPolicy): Promise<NativeSandboxLaunchSpec>;
}

/**
 * Produces an explicit Linux launcher specification. Actual kernel isolation
 * (namespaces, seccomp, cgroups, mount restrictions) must be applied by the
 * deployment launcher/container runtime; this class never claims to enforce
 * those controls inside Node.
 */
export class LinuxNativeSandbox implements LinuxSandboxLauncher {
  async prepare(policy: NativeSandboxPolicy): Promise<NativeSandboxLaunchSpec> {
    validateNativeSandboxPolicy(policy);
    if (policy.network !== 'DENY') throw new Error('linux_native_sandbox_network_must_be_denied');
    return {
      executable: policy.executable,
      args: [...policy.allowedArguments],
      cwd: policy.cwd,
      env: { ...policy.env },
      timeoutMs: policy.timeoutMs,
      maxPayloadBytes: policy.maxPayloadBytes,
      network: 'DENY',
      filesystem: policy.filesystem === 'WORKDIR_ONLY' ? 'WORKDIR_ONLY' : 'READ_ONLY',
    };
  }
}
