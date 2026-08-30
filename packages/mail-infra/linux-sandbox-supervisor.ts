import type { VerifiedLinuxLaunchPlan } from './linux-sandbox-enforcement';
import { assertIsolationVerified } from './linux-sandbox-enforcement';
import { buildLinuxSandboxCommand, type LinuxSandboxCommand } from './linux-sandbox-command';

export interface LinuxSandboxSupervisorCapabilities {
  readonly namespaces: boolean;
  readonly seccomp: boolean;
  readonly cgroups: boolean;
  readonly filesystemIsolation: boolean;
  readonly networkIsolation: boolean;
}

export interface LinuxSandboxSupervisor {
  verifyCapabilities(): Promise<LinuxSandboxSupervisorCapabilities>;
  prepare(plan: VerifiedLinuxLaunchPlan): Promise<LinuxSandboxCommand>;
}

export class FailClosedLinuxSandboxSupervisor implements LinuxSandboxSupervisor {
  constructor(private readonly capabilities: LinuxSandboxSupervisorCapabilities) {}

  async verifyCapabilities(): Promise<LinuxSandboxSupervisorCapabilities> {
    return { ...this.capabilities };
  }

  async prepare(plan: VerifiedLinuxLaunchPlan): Promise<LinuxSandboxCommand> {
    assertIsolationVerified(plan);
    const c = await this.verifyCapabilities();
    if (!c.namespaces || !c.seccomp || !c.cgroups || !c.filesystemIsolation || !c.networkIsolation) {
      throw new Error('linux_native_sandbox_capabilities_unavailable');
    }
    return buildLinuxSandboxCommand(plan);
  }
}
