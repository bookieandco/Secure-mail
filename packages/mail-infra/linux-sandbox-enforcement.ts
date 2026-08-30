import type { LinuxSandboxLaunchPlan } from './linux-sandbox-launch-spec';

export interface LinuxIsolationEnforcer {
  verify(plan: LinuxSandboxLaunchPlan): Promise<boolean>;
}

export interface VerifiedLinuxLaunchPlan extends LinuxSandboxLaunchPlan {
  readonly isolationVerified: true;
}

export async function verifyLinuxIsolation(enforcer: LinuxIsolationEnforcer, plan: LinuxSandboxLaunchPlan): Promise<VerifiedLinuxLaunchPlan> {
  const verified = await enforcer.verify(plan);
  if (!verified) throw new Error('linux_native_sandbox_isolation_unverified');
  return { ...plan, isolationVerified: true };
}

export function assertIsolationVerified(plan: LinuxSandboxLaunchPlan | VerifiedLinuxLaunchPlan): asserts plan is VerifiedLinuxLaunchPlan {
  if ((plan as Partial<VerifiedLinuxLaunchPlan>).isolationVerified !== true) throw new Error('linux_native_sandbox_isolation_required');
}
