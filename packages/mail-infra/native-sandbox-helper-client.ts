import { randomUUID } from 'node:crypto';
import type { VerifiedLinuxLaunchPlan } from './linux-sandbox-enforcement';
import type { LinuxSandboxHelperResponse, NativeSandboxHelperRequest } from './native-sandbox-helper-protocol';
import { signNativeSandboxHelperRequest } from './native-sandbox-helper-protocol';

export interface NativeSandboxHelperClient {
  prepare(plan: VerifiedLinuxLaunchPlan, pid: number): Promise<void>;
}

export class FailClosedNativeSandboxHelperClient implements NativeSandboxHelperClient {
  constructor(private readonly secret: Buffer, private readonly send: (request: NativeSandboxHelperRequest) => Promise<LinuxSandboxHelperResponse>) {}

  async prepare(plan: VerifiedLinuxLaunchPlan, pid: number): Promise<void> {
    if (!Number.isSafeInteger(pid) || pid < 1) throw new Error('native_sandbox_helper_pid_invalid');
    const unsigned = { version: 1 as const, requestId: randomUUID(), operation: 'prepare' as const, executable: plan.executable, args: [...plan.args], cwd: plan.cwd, pid, cpuMs: plan.isolation.resourceLimits.cpuMs, memoryBytes: plan.isolation.resourceLimits.memoryBytes, pids: plan.isolation.resourceLimits.pids, network: 'DENY' as const, filesystem: plan.filesystem, seccomp: 'REQUIRED' as const };
    const request = { ...unsigned, mac: signNativeSandboxHelperRequest(unsigned, this.secret) };
    const response = await this.send(request);
    if (response.version !== 1 || response.requestId !== request.requestId || response.ok !== true) throw new Error('native_sandbox_helper_rejected');
  }
}
