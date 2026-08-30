import type { LinuxSandboxLaunchPlan } from './linux-sandbox-launch-spec';
import { runLinuxSandboxPreflight, type LinuxSandboxPreflight } from './linux-sandbox-preflight';
import { assertIsolationVerified, type VerifiedLinuxLaunchPlan } from './linux-sandbox-enforcement';

export interface EnforcedLinuxLaunchPlan extends VerifiedLinuxLaunchPlan {
  readonly enforcementVerified: true;
}

export async function verifyLinuxEnforcement(preflight: LinuxSandboxPreflight, plan: VerifiedLinuxLaunchPlan): Promise<EnforcedLinuxLaunchPlan> {
  assertIsolationVerified(plan);
  await runLinuxSandboxPreflight(preflight, plan as LinuxSandboxLaunchPlan);
  return { ...plan, enforcementVerified: true };
}

export function assertEnforcementVerified(plan: VerifiedLinuxLaunchPlan | EnforcedLinuxLaunchPlan): asserts plan is EnforcedLinuxLaunchPlan {
  if ((plan as Partial<EnforcedLinuxLaunchPlan>).enforcementVerified !== true) throw new Error('linux_native_sandbox_enforcement_required');
}
