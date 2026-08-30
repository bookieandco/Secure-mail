import { strict as assert } from 'node:assert';
import { runLinuxSandboxPreflight } from '../../packages/mail-infra/linux-sandbox-preflight';

const plan = { executable: '/bin/true', args: [], cwd: '/', env: {}, timeoutMs: 1000, maxPayloadBytes: 1024, network: 'DENY' as const, filesystem: 'WORKDIR_ONLY' as const, isolation: { namespaces: ['mount', 'pid', 'network', 'ipc', 'uts', 'user'] as const, seccomp: 'REQUIRED' as const, resourceLimits: { cpuMs: 1000, memoryBytes: 16 * 1024 * 1024, pids: 16 }, filesystemRoot: 'WORKDIR_ONLY' as const, network: 'DENY' as const } };
const ok = { verifyKernelIsolation: async () => true, verifyResourceController: async () => true, verifySeccomp: async () => true, verifyFilesystemIsolation: async () => true };
await runLinuxSandboxPreflight(ok, plan);
await assert.rejects(runLinuxSandboxPreflight({ ...ok, verifySeccomp: async () => false }, plan), /enforcement_unavailable/);
console.log('Linux sandbox preflight tests passed');
