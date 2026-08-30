import { access } from 'node:fs/promises';
import type { LinuxIsolationEnforcer } from './linux-sandbox-enforcement';
import type { LinuxSandboxLaunchPlan } from './linux-sandbox-launch-spec';

export interface LinuxIsolationProbe {
  readonly commandAvailable: (command: string) => Promise<boolean>;
  readonly pathExists: (path: string) => Promise<boolean>;
}

export class LinuxNativeIsolationEnforcer implements LinuxIsolationEnforcer {
  constructor(private readonly probe: LinuxIsolationProbe) {}

  async verify(plan: LinuxSandboxLaunchPlan): Promise<boolean> {
    if (plan.network !== 'DENY' || plan.isolation.network !== 'DENY') return false;
    if (plan.isolation.seccomp !== 'REQUIRED') return false;
    if (plan.isolation.namespaces.length < 6) return false;
    if (plan.isolation.resourceLimits.cpuMs < 1 || plan.isolation.resourceLimits.memoryBytes < 4096 || plan.isolation.resourceLimits.pids < 1) return false;
    const required = await Promise.all([
      this.probe.commandAvailable('unshare'),
      this.probe.commandAvailable('prlimit'),
      this.probe.pathExists('/proc/self/status'),
    ]);
    return required.every(Boolean);
  }
}

export const nodeLinuxIsolationProbe: LinuxIsolationProbe = {
  commandAvailable: async (command) => {
    try { await access(`/usr/bin/${command}`); return true; } catch { return false; }
  },
  pathExists: async (path) => { try { await access(path); return true; } catch { return false; } },
};
