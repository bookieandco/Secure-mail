import type { NativeSandboxLaunchSpec } from './native-os-sandbox';
import { assertIsolationVerified, type VerifiedLinuxLaunchPlan } from './linux-sandbox-enforcement';
import type { LinuxIsolationEnforcer } from './linux-sandbox-enforcement';
import { verifyLinuxIsolation } from './linux-sandbox-enforcement';
import type { LinuxSandboxLaunchPlan } from './linux-sandbox-launch-spec';

export interface VerifiedLinuxNativeLauncher {
  verifyAndPrepare(plan: LinuxSandboxLaunchPlan): Promise<NativeSandboxLaunchSpec & { readonly isolationVerified: true }>;
}

export class GatedLinuxNativeLauncher implements VerifiedLinuxNativeLauncher {
  constructor(private readonly enforcer: LinuxIsolationEnforcer) {}

  async verifyAndPrepare(plan: LinuxSandboxLaunchPlan): Promise<VerifiedLinuxLaunchPlan> {
    const verified = await verifyLinuxIsolation(this.enforcer, plan);
    assertIsolationVerified(verified);
    return verified;
  }
}
