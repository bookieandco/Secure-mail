import type { LinuxSandboxLaunchPlan } from './linux-sandbox-launch-spec';
import type { LinuxResourceController } from './linux-resource-controller';
import type { LinuxSeccompInstaller, LinuxSeccompPolicy } from './linux-seccomp-policy';
import { validateLinuxSeccompPolicy } from './linux-seccomp-policy';

export interface LinuxNativeAdmission {
  admit(plan: LinuxSandboxLaunchPlan, pid: number, seccomp: LinuxSeccompPolicy): Promise<void>;
}

export class FailClosedLinuxNativeAdmission implements LinuxNativeAdmission {
  constructor(private readonly resources: LinuxResourceController, private readonly seccomp: LinuxSeccompInstaller) {}

  async admit(plan: LinuxSandboxLaunchPlan, pid: number, seccompPolicy: LinuxSeccompPolicy): Promise<void> {
    if (plan.network !== 'DENY' || plan.isolation.network !== 'DENY') throw new Error('linux_native_network_required');
    validateLinuxSeccompPolicy(seccompPolicy);
    await this.resources.apply(plan, pid);
    try {
      await this.seccomp.install(seccompPolicy);
    } catch {
      throw new Error('linux_native_admission_seccomp_failed');
    }
  }
}
