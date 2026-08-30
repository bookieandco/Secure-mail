import { strict as assert } from 'node:assert';
import { FailClosedLinuxSandboxSupervisor } from '../../packages/mail-infra/linux-sandbox-supervisor';

const plan = { executable: '/bin/true', args: [], cwd: '/', env: {}, timeoutMs: 1000, maxPayloadBytes: 1024, network: 'DENY' as const, filesystem: 'WORKDIR_ONLY' as const, isolation: { namespaces: ['mount', 'pid', 'network', 'ipc', 'uts', 'user'] as const, seccomp: 'REQUIRED' as const, resourceLimits: { cpuMs: 1000, memoryBytes: 16 * 1024 * 1024, pids: 16 }, filesystemRoot: 'WORKDIR_ONLY' as const, network: 'DENY' as const }, isolationVerified: true as const };
const ready = new FailClosedLinuxSandboxSupervisor({ namespaces: true, seccomp: true, cgroups: true, filesystemIsolation: true, networkIsolation: true });
const command = await ready.prepare(plan);
assert.equal(command.executable, '/usr/bin/unshare');
const blocked = new FailClosedLinuxSandboxSupervisor({ namespaces: true, seccomp: false, cgroups: true, filesystemIsolation: true, networkIsolation: true });
await assert.rejects(blocked.prepare(plan), /capabilities_unavailable/);
console.log('Linux sandbox supervisor tests passed');
