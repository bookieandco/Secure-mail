import type { LinuxSandboxLaunchPlan } from './linux-sandbox-launch-spec';

export interface LinuxSandboxCommand {
  readonly executable: string;
  readonly args: readonly string[];
}

export function buildLinuxSandboxCommand(plan: LinuxSandboxLaunchPlan): LinuxSandboxCommand {
  if (plan.network !== 'DENY' || plan.isolation.network !== 'DENY') throw new Error('linux_sandbox_network_required');
  if (plan.isolation.seccomp !== 'REQUIRED') throw new Error('linux_sandbox_seccomp_required');
  if (plan.filesystem === 'UNRESTRICTED') throw new Error('linux_sandbox_filesystem_required');
  const namespaces = plan.isolation.namespaces.join(',');
  if (namespaces !== 'mount,pid,network,ipc,uts,user') throw new Error('linux_sandbox_namespace_set_invalid');
  const { cpuMs, memoryBytes, pids } = plan.isolation.resourceLimits;
  if (cpuMs < 1 || memoryBytes < 4096 || pids < 1) throw new Error('linux_sandbox_resource_limits_invalid');
  return {
    executable: '/usr/bin/unshare',
    args: [
      '--mount', '--pid', '--fork', '--mount-proc', '--net', '--ipc', '--uts', '--user', '--map-root-user',
      '--', plan.executable, ...plan.args,
    ],
  };
}
