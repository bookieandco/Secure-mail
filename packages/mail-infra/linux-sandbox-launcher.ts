import { spawn, type ChildProcess } from 'node:child_process';
import type { VerifiedLinuxLaunchPlan } from './linux-sandbox-enforcement';
import { assertIsolationVerified } from './linux-sandbox-enforcement';
import { buildLinuxSandboxCommand, type LinuxSandboxCommand } from './linux-sandbox-command';

export interface LinuxSandboxExecutor {
  spawn(plan: VerifiedLinuxLaunchPlan): ChildProcess;
}

export class VerifiedLinuxSandboxExecutor implements LinuxSandboxExecutor {
  spawn(plan: VerifiedLinuxLaunchPlan): ChildProcess {
    assertIsolationVerified(plan);
    const command: LinuxSandboxCommand = buildLinuxSandboxCommand(plan);
    return spawn(command.executable, [...command.args], {
      cwd: plan.cwd,
      env: { ...plan.env },
      shell: false,
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  }
}
