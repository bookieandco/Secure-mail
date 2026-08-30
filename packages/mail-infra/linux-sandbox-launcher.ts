import { spawn, type ChildProcess } from 'node:child_process';
import type { EnforcedLinuxLaunchPlan } from './linux-sandbox-enforcement-preflight';
import { assertEnforcementVerified } from './linux-sandbox-enforcement-preflight';
import { buildLinuxSandboxCommand, type LinuxSandboxCommand } from './linux-sandbox-command';

export interface LinuxSandboxExecutor {
  spawn(plan: EnforcedLinuxLaunchPlan): ChildProcess;
}

export class VerifiedLinuxSandboxExecutor implements LinuxSandboxExecutor {
  spawn(plan: EnforcedLinuxLaunchPlan): ChildProcess {
    assertEnforcementVerified(plan);
    const command: LinuxSandboxCommand = buildLinuxSandboxCommand(plan);
    return spawn(command.executable, [...command.args], {
      cwd: plan.cwd,
      env: { ...plan.env },
      shell: false,
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  }
}
