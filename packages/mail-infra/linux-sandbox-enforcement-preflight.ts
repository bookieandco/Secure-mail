import type { LinuxSandboxLaunchPlan, LinuxSeccompProfile } from './linux-sandbox-launch-spec';
import { runLinuxSandboxPreflight, type LinuxSandboxPreflight } from './linux-sandbox-preflight';
import { assertIsolationVerified, type VerifiedLinuxLaunchPlan } from './linux-sandbox-enforcement';

export interface EnforcedLinuxLaunchPlan extends VerifiedLinuxLaunchPlan {
  readonly enforcementVerified: true;
  readonly seccompProfile: LinuxSeccompProfile;
}

function assertSupportedSeccompProfile(profile: unknown): asserts profile is LinuxSeccompProfile {
  if (profile !== 'secure-mail-runtime-v1') throw new Error('linux_seccomp_profile_invalid');
}

export async function verifyLinuxEnforcement(preflight: LinuxSandboxPreflight, plan: VerifiedLinuxLaunchPlan): Promise<EnforcedLinuxLaunchPlan> {
  assertIsolationVerified(plan);
  const linuxPlan = plan as LinuxSandboxLaunchPlan;
  if (linuxPlan.isolation.seccomp !== 'REQUIRED') throw new Error('linux_seccomp_required');
  assertSupportedSeccompProfile(linuxPlan.isolation.seccompProfile);
  await runLinuxSandboxPreflight(preflight, linuxPlan);
  return { ...plan, enforcementVerified: true, seccompProfile: linuxPlan.isolation.seccompProfile };
}

export function assertEnforcementVerified(plan: VerifiedLinuxLaunchPlan | EnforcedLinuxLaunchPlan): asserts plan is EnforcedLinuxLaunchPlan {
  if ((plan as Partial<EnforcedLinuxLaunchPlan>).enforcementVerified !== true) throw new Error('linux_native_sandbox_enforcement_required');
  assertSupportedSeccompProfile((plan as Partial<EnforcedLinuxLaunchPlan>).seccompProfile);
}
