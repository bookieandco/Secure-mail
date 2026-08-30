import type { NativeSandboxLaunchSpec } from './native-os-sandbox';

export type LinuxSeccompProfile = 'secure-mail-runtime-v1';

export interface LinuxKernelIsolationSpec {
  readonly namespaces: readonly ('mount' | 'pid' | 'network' | 'ipc' | 'uts' | 'user')[];
  readonly seccomp: 'REQUIRED';
  readonly seccompProfile: LinuxSeccompProfile;
  readonly resourceLimits: { readonly cpuMs: number; readonly memoryBytes: number; readonly pids: number; };
  readonly filesystemRoot: 'WORKDIR_ONLY' | 'READ_ONLY';
  readonly network: 'DENY';
}

export interface LinuxSandboxLaunchPlan extends NativeSandboxLaunchSpec {
  readonly isolation: LinuxKernelIsolationSpec;
}

export function createLinuxSandboxLaunchPlan(spec: NativeSandboxLaunchSpec, limits: LinuxKernelIsolationSpec['resourceLimits']): LinuxSandboxLaunchPlan {
  if (spec.network !== 'DENY') throw new Error('linux_sandbox_network_required');
  if (spec.filesystem === 'UNRESTRICTED') throw new Error('linux_sandbox_filesystem_required');
  if (!Number.isSafeInteger(limits.cpuMs) || limits.cpuMs < 1) throw new Error('linux_sandbox_cpu_limit_invalid');
  if (!Number.isSafeInteger(limits.memoryBytes) || limits.memoryBytes < 4096) throw new Error('linux_sandbox_memory_limit_invalid');
  if (!Number.isSafeInteger(limits.pids) || limits.pids < 1) throw new Error('linux_sandbox_pid_limit_invalid');
  return {
    ...spec,
    network: 'DENY',
    isolation: {
      namespaces: ['mount', 'pid', 'network', 'ipc', 'uts', 'user'],
      seccomp: 'REQUIRED',
      seccompProfile: 'secure-mail-runtime-v1',
      resourceLimits: limits,
      filesystemRoot: spec.filesystem,
      network: 'DENY',
    },
  };
}
