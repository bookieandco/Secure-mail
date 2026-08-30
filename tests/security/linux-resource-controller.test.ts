import { strict as assert } from 'node:assert';
import { CgroupV2ResourceController } from '../../packages/mail-infra/linux-resource-controller';

await assert.rejects(new CgroupV2ResourceController('/definitely/not-a-cgroup').apply({ executable: '/bin/true', args: [], cwd: '/', env: {}, timeoutMs: 1000, maxPayloadBytes: 1024, network: 'DENY', filesystem: 'WORKDIR_ONLY', isolation: { namespaces: ['mount', 'pid', 'network', 'ipc', 'uts', 'user'], seccomp: 'REQUIRED', resourceLimits: { cpuMs: 1000, memoryBytes: 16 * 1024 * 1024, pids: 16 }, filesystemRoot: 'WORKDIR_ONLY', network: 'DENY' } }, 1), /cgroup_enforcement_failed/);
await assert.rejects(new CgroupV2ResourceController('/sys/fs/cgroup').apply({ executable: '/bin/true', args: [], cwd: '/', env: {}, timeoutMs: 1000, maxPayloadBytes: 1024, network: 'DENY', filesystem: 'WORKDIR_ONLY', isolation: { namespaces: ['mount', 'pid', 'network', 'ipc', 'uts', 'user'], seccomp: 'REQUIRED', resourceLimits: { cpuMs: 1000, memoryBytes: 16 * 1024 * 1024, pids: 16 }, filesystemRoot: 'WORKDIR_ONLY', network: 'DENY' } }, 0), /cgroup_pid_invalid/);
assert.ok(CgroupV2ResourceController);
console.log('Linux resource controller tests passed');
