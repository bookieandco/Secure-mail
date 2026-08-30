export interface LinuxSeccompPolicy {
  readonly mode: 'REQUIRED';
  readonly defaultAction: 'ERRNO';
  readonly allowedSyscalls: readonly string[];
}

export function validateLinuxSeccompPolicy(policy: LinuxSeccompPolicy): void {
  if (policy.mode !== 'REQUIRED') throw new Error('linux_seccomp_required');
  if (policy.defaultAction !== 'ERRNO') throw new Error('linux_seccomp_default_action_invalid');
  if (policy.allowedSyscalls.length === 0) throw new Error('linux_seccomp_allowlist_empty');
  if (policy.allowedSyscalls.some((name) => !/^[a-z0-9_]+$/.test(name))) throw new Error('linux_seccomp_syscall_invalid');
}

export interface LinuxSeccompInstaller {
  install(policy: LinuxSeccompPolicy): Promise<void>;
}

export class UnsupportedLinuxSeccompInstaller implements LinuxSeccompInstaller {
  async install(): Promise<void> { throw new Error('linux_seccomp_enforcement_unavailable'); }
}
