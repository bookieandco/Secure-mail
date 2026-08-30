import type { LinuxSandboxLaunchPlan } from './linux-sandbox-launch-spec';

export interface LinuxSandboxPreflight {
  verifyKernelIsolation(plan: LinuxSandboxLaunchPlan): Promise<boolean>;
  verifyResourceController(plan: LinuxSandboxLaunchPlan): Promise<boolean>;
  verifySeccomp(plan: LinuxSandboxLaunchPlan): Promise<boolean>;
  verifyFilesystemIsolation(plan: LinuxSandboxLaunchPlan): Promise<boolean>;
}

export async function runLinuxSandboxPreflight(preflight: LinuxSandboxPreflight, plan: LinuxSandboxLaunchPlan): Promise<void> {
  if (plan.network !== 'DENY' || plan.isolation.network !== 'DENY') throw new Error('linux_sandbox_network_required');
  if (plan.isolation.seccomp !== 'REQUIRED') throw new Error('linux_sandbox_seccomp_required');
  const results = await Promise.all([
    preflight.verifyKernelIsolation(plan),
    preflight.verifyResourceController(plan),
    preflight.verifySeccomp(plan),
    preflight.verifyFilesystemIsolation(plan),
  ]);
  if (results.some((result) => !result)) throw new Error('linux_native_sandbox_enforcement_unavailable');
}

export class UnsupportedLinuxSandboxPreflight implements LinuxSandboxPreflight {
  async verifyKernelIsolation(): Promise<boolean> { return false; }
  async verifyResourceController(): Promise<boolean> { return false; }
  async verifySeccomp(): Promise<boolean> { return false; }
  async verifyFilesystemIsolation(): Promise<boolean> { return false; }
}
