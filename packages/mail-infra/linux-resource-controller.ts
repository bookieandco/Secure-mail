import { mkdir, writeFile } from 'node:fs/promises';
import type { LinuxSandboxLaunchPlan } from './linux-sandbox-launch-spec';

export interface LinuxResourceController {
  apply(plan: LinuxSandboxLaunchPlan, pid: number): Promise<void>;
}

export class CgroupV2ResourceController implements LinuxResourceController {
  constructor(private readonly root = '/sys/fs/cgroup') {}

  async apply(plan: LinuxSandboxLaunchPlan, pid: number): Promise<void> {
    if (!Number.isSafeInteger(pid) || pid < 1) throw new Error('linux_cgroup_pid_invalid');
    const name = `secure-mail-native-${pid}`;
    const dir = `${this.root}/${name}`;
    try {
      await mkdir(dir, { recursive: false });
      await writeFile(`${dir}/memory.max`, String(plan.isolation.resourceLimits.memoryBytes));
      await writeFile(`${dir}/pids.max`, String(plan.isolation.resourceLimits.pids));
      await writeFile(`${dir}/cpu.max`, `${plan.isolation.resourceLimits.cpuMs} 100000`);
      await writeFile(`${dir}/cgroup.procs`, String(pid));
    } catch {
      throw new Error('linux_cgroup_enforcement_failed');
    }
  }
}
